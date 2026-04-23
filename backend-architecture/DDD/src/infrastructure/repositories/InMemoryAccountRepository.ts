import { BankAccount } from "../../domain/entities/BankAccount";
import { IAccountRepository } from "../../domain/repositories/IAccountRepository";

// Infrastructure implements a domain-defined contract.
// Swap this for a Postgres/Mongo/etc. version without touching domain or application.
export class InMemoryAccountRepository implements IAccountRepository {
  private readonly accounts = new Map<string, BankAccount>();

  findById(id: string): BankAccount | null {
    return this.accounts.get(id) ?? null;
  }

  save(account: BankAccount): void {
    this.accounts.set(account.id, account);
  }
}
