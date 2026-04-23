import { BankAccount } from "../../domain/entities/BankAccount";
import { Money } from "../../domain/value-objects/Money";
import { IAccountRepository } from "../../domain/repositories/IAccountRepository";
import { TransferService } from "../../domain/TransferService";

// Contrast with TransferService (domain): this one does I/O (load + save) and
// delegates the actual rule enforcement to the domain service.
export class TransferMoneyService {
  constructor(
    private readonly repo: IAccountRepository,
    private readonly transferService: TransferService,
  ) {}

  execute(input: {
    fromId: string;
    toId: string;
    amount: number;
    currency: string;
  }): { from: BankAccount; to: BankAccount } {
    const from = this.repo.findById(input.fromId);
    const to = this.repo.findById(input.toId);
    if (!from) throw new Error(`Account ${input.fromId} not found`);
    if (!to) throw new Error(`Account ${input.toId} not found`);

    this.transferService.transfer(from, to, new Money(input.amount, input.currency));

    this.repo.save(from);
    this.repo.save(to);
    return { from, to };
  }
}
