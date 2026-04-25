export class Money {
  private readonly amount: number;

  constructor(amount: number) {
    if (!Number.isFinite(amount)) {
      throw new Error("Money: valor deve ser um número finito");
    }
    if (amount < 0) {
      throw new Error("Money: valor não pode ser negativo");
    }
    this.amount = amount;
  }

  value(): number {
    return this.amount;
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    return new Money(this.amount - other.amount);
  }

  greaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }
}
