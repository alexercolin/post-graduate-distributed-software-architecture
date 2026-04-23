import { BankAccount } from "./entities/BankAccount";
import { Money } from "./value-objects/Money";

// Domain Service: business logic that spans MULTIPLE entities and has no
// natural home on any single entity. Stateless, no I/O, no persistence —
// it operates on entities the caller has already loaded.
export class TransferService {
  transfer(from: BankAccount, to: BankAccount, amount: Money): void {
    from.withdraw(amount);
    to.deposit(amount);
  }
}
