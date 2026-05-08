// THE centerpiece of orders-service. Open this file and you understand sagas.
//
// A saga is a sequence of steps where each step has a *compensating* counterpart.
// If step N succeeds, step N+1 runs. If any step fails, the steps that already
// committed get UNDONE in reverse order. That's the whole pattern.
//
// In this demo:
//   step 1: reserveStock     — HTTP POST to catalog-service. Compensation: HTTP POST /release.
//   step 2: authorizePayment — in-process fake (random failure, knob = PAYMENT_FAIL_RATE).
//                              Compensation: no-op (no real payment to void).
//
// With only one step, this would be a try/catch across services. With two steps,
// the compensation chain is real: payment failure forces a release of the stock
// reserved in step 1, which is observable on catalog-service's stock count.
//
// The sync HTTP call inside reserveStock goes through an HttpClient whose pipeline
// is wrapped in Polly's CircuitBreaker + ConcurrencyLimiter (= bulkhead). See
// Program.cs for that setup. The saga itself doesn't know about Polly; it just
// calls HttpClient.SendAsync and lets exceptions propagate.

using System.Net.Http.Json;
using System.Text.Json;

namespace OrdersService;

public sealed record SagaStep(
    string Name,
    Func<Task> Do,
    Func<Task> Compensate,
    OrderStatus PostState
);

public sealed class SagaStepFailed : Exception
{
    public SagaStepFailed(string message, Exception? inner = null) : base(message, inner) { }
}

public sealed class OrderSaga
{
    private readonly HttpClient _catalog;          // named "catalog" — Polly attached in Program.cs
    private readonly InMemoryOrderStore _store;
    private readonly OrderConfirmedPublisher _publisher;
    private readonly ILogger<OrderSaga> _log;
    private readonly double _paymentFailRate;
    private readonly Random _rng = new();

    public OrderSaga(
        IHttpClientFactory factory,
        InMemoryOrderStore store,
        OrderConfirmedPublisher publisher,
        ILogger<OrderSaga> log,
        IConfiguration config)
    {
        _catalog = factory.CreateClient("catalog");
        _store = store;
        _publisher = publisher;
        _log = log;
        _paymentFailRate = double.TryParse(
            config["PAYMENT_FAIL_RATE"], out var v) ? v : 0.0;
    }

    public async Task<Order> Run(string productId, int qty, string correlationId)
    {
        var order = new Order
        {
            Id = Guid.NewGuid().ToString("N")[..8],
            ProductId = productId,
            Qty = qty,
            CorrelationId = correlationId,
        };
        _store.Save(order);

        var steps = new[]
        {
            new SagaStep(
                Name: "reserveStock",
                Do: () => CallCatalog(HttpMethod.Post, $"/products/{productId}/reserve", new { qty }, correlationId),
                Compensate: () => CallCatalog(HttpMethod.Post, $"/products/{productId}/release", new { qty }, correlationId),
                PostState: OrderStatus.StockReserved
            ),
            new SagaStep(
                Name: "authorizePayment",
                Do: AuthorizePayment,
                Compensate: () => Task.CompletedTask, // no real payment processor → nothing to void
                PostState: OrderStatus.PaymentAuthorized
            ),
        };

        // ---- Forward execution -----------------------------------------------
        var completedThrough = -1;
        try
        {
            for (var i = 0; i < steps.Length; i++)
            {
                _log.LogInformation("[cid={cid}] saga step do: {name}", correlationId, steps[i].Name);
                await steps[i].Do();
                order.Status = steps[i].PostState;
                _store.Save(order);
                completedThrough = i;
            }
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex,
                "[cid={cid}] saga failed at step #{n} ({name}); compensating in reverse",
                correlationId, completedThrough + 1,
                completedThrough + 1 < steps.Length ? steps[completedThrough + 1].Name : "<post>");

            // ---- Compensation in REVERSE order -------------------------------
            for (var i = completedThrough; i >= 0; i--)
            {
                try
                {
                    _log.LogInformation("[cid={cid}] saga compensating: {name}", correlationId, steps[i].Name);
                    await steps[i].Compensate();
                }
                catch (Exception cex)
                {
                    // Real systems must not lose this — they queue it for human/automated retry.
                    _log.LogError(cex,
                        "[cid={cid}] compensation for {name} failed; manual intervention required",
                        correlationId, steps[i].Name);
                }
            }

            order.Status = OrderStatus.Cancelled;
            order.CancellationReason = ex.Message;
            _store.Save(order);
            return order;
        }

        // ---- Saga succeeded — publish the success event ----------------------
        order.Status = OrderStatus.Confirmed;
        _store.Save(order);
        await _publisher.Publish(order);
        _log.LogInformation("[cid={cid}] order {id} confirmed", correlationId, order.Id);
        return order;
    }

    // -------------------------------------------------------------------------
    // Step bodies
    // -------------------------------------------------------------------------

    private async Task CallCatalog(HttpMethod method, string path, object body, string correlationId)
    {
        using var req = new HttpRequestMessage(method, path)
        {
            Content = JsonContent.Create(body),
        };
        req.Headers.Add("X-Correlation-Id", correlationId);

        try
        {
            using var resp = await _catalog.SendAsync(req);
            if (!resp.IsSuccessStatusCode)
            {
                var text = await resp.Content.ReadAsStringAsync();
                throw new SagaStepFailed($"catalog {method} {path} → HTTP {(int)resp.StatusCode} {text}");
            }
        }
        catch (SagaStepFailed)
        {
            throw;
        }
        catch (Exception ex)
        {
            // HttpRequestException, TaskCanceledException (timeout), Polly BrokenCircuitException → all surface here.
            throw new SagaStepFailed($"catalog {method} {path} → {ex.GetType().Name}: {ex.Message}", ex);
        }
    }

    private Task AuthorizePayment()
    {
        if (_rng.NextDouble() < _paymentFailRate)
        {
            throw new SagaStepFailed("authorizePayment: payment_failed (simulated)");
        }
        return Task.CompletedTask;
    }
}
