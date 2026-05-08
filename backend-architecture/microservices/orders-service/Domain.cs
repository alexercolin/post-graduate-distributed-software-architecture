// Order aggregate, lifecycle states, and the in-memory store.
//
// Kept deliberately thin: this service's lesson is the Saga, not internal layering.
// Order moves through the states Pending → StockReserved → PaymentAuthorized → Confirmed,
// or jumps to Cancelled at any point if the saga compensates.

namespace OrdersService;

public enum OrderStatus
{
    Pending,
    StockReserved,
    PaymentAuthorized,
    Confirmed,
    Cancelled,
}

public sealed class Order
{
    public required string Id { get; init; }
    public required string ProductId { get; init; }
    public required int Qty { get; init; }
    public required string CorrelationId { get; init; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public string? CancellationReason { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}

public sealed class InMemoryOrderStore
{
    private readonly Dictionary<string, Order> _store = new();
    private readonly object _lock = new();

    public void Save(Order order)
    {
        lock (_lock)
        {
            _store[order.Id] = order;
        }
    }

    public Order? Get(string id)
    {
        lock (_lock)
        {
            return _store.GetValueOrDefault(id);
        }
    }

    public IReadOnlyCollection<Order> All()
    {
        lock (_lock)
        {
            return _store.Values.ToList();
        }
    }
}
