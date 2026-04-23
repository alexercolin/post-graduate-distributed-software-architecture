import { BankAccount } from "../../domain/entities/BankAccount";
import { Money } from "../../domain/value-objects/Money";
import { IAccountRepository } from "../../domain/repositories/IAccountRepository";

export class DepositService {
  constructor(private readonly repo: IAccountRepository) {}

  execute(input: { accountId: string; amount: number; currency: string }): BankAccount {
    const account = this.repo.findById(input.accountId);
    if (!account) throw new Error(`Account ${input.accountId} not found`);

    account.deposit(new Money(input.amount, input.currency));
    this.repo.save(account);
    return account;
  }
}
