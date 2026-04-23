import { BankAccount } from "../../domain/entities/BankAccount";
import { Money } from "../../domain/value-objects/Money";
import { IAccountRepository } from "../../domain/repositories/IAccountRepository";

// Application Service (use case): orchestrates a single user-facing operation.
// No business rules of its own — just coordination of domain + repository.
export class OpenAccountService {
  constructor(private readonly repo: IAccountRepository) {}

  execute(input: { id: string; ownerName: string; currency: string }): BankAccount {
    const account = new BankAccount(
      input.id,
      input.ownerName,
      new Money(0, input.currency),
    );
    this.repo.save(account);
    return account;
  }
}
