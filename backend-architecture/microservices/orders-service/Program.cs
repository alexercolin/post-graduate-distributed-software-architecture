// Composition root for orders-service.
//
// What lives here:
//   1. The Polly resilience pipeline wrapped around the HttpClient that talks to catalog
//      (CircuitBreaker + ConcurrencyLimiter / bulkhead).
//   2. The Redis Streams publisher (StackExchange.Redis).
//   3. Correlation-ID middleware.
//   4. Minimal API endpoints.
//
// What does NOT live here:
//   - The saga itself — see Saga.cs.
//   - The aggregate / state machine — see Domain.cs.

using System.Text.Json;
using Microsoft.Extensions.Http.Resilience;
using OrdersService;
using Polly;
using StackExchange.Redis;
using Order = OrdersService.Order; // disambiguate from StackExchange.Redis.Order (sort enum)

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();
builder.Logging.ClearProviders();
builder.Logging.AddSimpleConsole(o =>
{
    o.SingleLine = true;
    o.TimestampFormat = "HH:mm:ss ";
});

var catalogUrl = builder.Configuration["CATALOG_URL"] ?? "http://localhost:8001";
var redisUrl   = builder.Configuration["REDIS_URL"]   ?? "localhost:6379";

// ---- HttpClient "catalog" with Polly: CircuitBreaker + ConcurrencyLimiter ---
//
// Two strategies are layered explicitly so a reader can see both names:
//   - ConcurrencyLimiter is the bulkhead — it caps in-flight calls to 4 with a queue of 8,
//     so a slow catalog can't exhaust orders-service's thread/socket pool.
//   - CircuitBreaker opens after 50% of calls fail in a 10s window (min 3 calls), then
//     stays open for 5s before allowing a probe.
//
// Order matters: ConcurrencyLimiter outermost means we drop overflow BEFORE attempting
// the call; CircuitBreaker innermost means we count actual call outcomes.
builder.Services
    .AddHttpClient("catalog", c =>
    {
        c.BaseAddress = new Uri(catalogUrl);
        c.Timeout = TimeSpan.FromSeconds(2); // tight, to make the breaker trip visible
    })
    .AddResilienceHandler("catalog-pipeline", pipeline =>
    {
        pipeline.AddConcurrencyLimiter(permitLimit: 4, queueLimit: 8);
        pipeline.AddCircuitBreaker(new HttpCircuitBreakerStrategyOptions
        {
            FailureRatio       = 0.5,
            MinimumThroughput  = 3,
            SamplingDuration   = TimeSpan.FromSeconds(10),
            BreakDuration      = TimeSpan.FromSeconds(5),
            OnOpened = args =>
            {
                Console.WriteLine($"[circuit_breaker] OPENED for {args.BreakDuration}");
                return ValueTask.CompletedTask;
            },
            OnClosed = _ =>
            {
                Console.WriteLine("[circuit_breaker] CLOSED");
                return ValueTask.CompletedTask;
            },
        });
    });

// ---- Redis (single multiplexer; cheap to share) -----------------------------
builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(redisUrl));

// ---- Domain wiring ----------------------------------------------------------
builder.Services.AddSingleton<InMemoryOrderStore>();
builder.Services.AddSingleton<OrderConfirmedPublisher>();
builder.Services.AddScoped<OrderSaga>();

var app = builder.Build();

// ---- Correlation-ID middleware ---------------------------------------------
//
// Generates an ID on entry if the client didn't send one; echoes back on the
// response; saves it on HttpContext.Items so endpoints can pass it to the saga.
app.Use(async (ctx, next) =>
{
    var cid = ctx.Request.Headers["X-Correlation-Id"].ToString();
    if (string.IsNullOrWhiteSpace(cid))
    {
        cid = $"ord-{Guid.NewGuid():N}"[..12];
    }
    ctx.Items["cid"] = cid;
    ctx.Response.Headers["X-Correlation-Id"] = cid;
    await next(ctx);
});

// ---- Endpoints --------------------------------------------------------------

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapPost("/orders", async (PlaceOrderRequest body, OrderSaga saga, HttpContext ctx) =>
{
    if (string.IsNullOrWhiteSpace(body.ProductId) || body.Qty <= 0)
    {
        return Results.BadRequest(new { error = "productId and qty>0 required" });
    }
    var cid = (string)ctx.Items["cid"]!;
    var order = await saga.Run(body.ProductId, body.Qty, cid);
    return order.Status == OrderStatus.Confirmed
        ? Results.Ok(OrderDto.From(order))
        : Results.UnprocessableEntity(OrderDto.From(order));
});

app.MapGet("/orders/{id}", (string id, InMemoryOrderStore store) =>
{
    var order = store.Get(id);
    return order is null ? Results.NotFound() : Results.Ok(OrderDto.From(order));
});

app.MapGet("/orders", (InMemoryOrderStore store) =>
    Results.Ok(store.All().Select(OrderDto.From)));

app.Logger.LogInformation("orders-service ready (catalog={catalog}, redis={redis})", catalogUrl, redisUrl);
app.Run();


// ============================================================================
// Types co-located with composition. Kept in this file because they're glue.
// ============================================================================

public sealed record PlaceOrderRequest(string ProductId, int Qty);

public sealed record OrderDto(string Id, string ProductId, int Qty, string Status, string? CancellationReason, string CorrelationId)
{
    public static OrderDto From(Order o) =>
        new(o.Id, o.ProductId, o.Qty, o.Status.ToString(), o.CancellationReason, o.CorrelationId);
}

public sealed class OrderConfirmedPublisher
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<OrderConfirmedPublisher> _log;

    public OrderConfirmedPublisher(IConnectionMultiplexer redis, ILogger<OrderConfirmedPublisher> log)
    {
        _redis = redis;
        _log = log;
    }

    public async Task Publish(Order order)
    {
        var db = _redis.GetDatabase();
        var payload = JsonSerializer.Serialize(new
        {
            order_id = order.Id,
            product_id = order.ProductId,
            qty = order.Qty,
            correlation_id = order.CorrelationId,
        });

        await db.StreamAddAsync("microservices:events", new NameValueEntry[]
        {
            new("type", "OrderConfirmed"),
            new("payload", payload),
            new("correlation_id", order.CorrelationId),
        });

        _log.LogInformation("[cid={cid}] published OrderConfirmed for order {id}", order.CorrelationId, order.Id);
    }
}
