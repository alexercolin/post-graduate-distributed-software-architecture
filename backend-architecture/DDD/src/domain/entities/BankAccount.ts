import { Money } from "../value-objects/Money";

// Entity: identity + mutable state + invariants enforced internally.
export class BankAccount {
  private _balance: Money;

  constructor(
    public readonly id: string,
    public readonly ownerName: string,
    initialBalance: Money,
  ) {
    this._balance = initialBalance;
  }

  get balance(): Money {
    return this._balance;
  }

  deposit(amount: Money): void {
    if (amount.amount <= 0) throw new Error("Deposit must be positive");
    this._balance = this._balance.add(amount);
  }

  withdraw(amount: Money): void {
    if (amount.amount <= 0) throw new Error("Withdrawal must be positive");
    if (!this._balance.isGreaterThanOrEqual(amount)) {
      throw new Error(`Insufficient funds in account ${this.id}`);
    }
    this._balance = this._balance.subtract(amount);
  }
}
