import { TransferService } from "./domain/TransferService";
import { InMemoryAccountRepository } from "./infrastructure/repositories/InMemoryAccountRepository";
import { OpenAccountService } from "./application/services/OpenAccountService";
import { DepositService } from "./application/services/DepositService";
import { TransferMoneyService } from "./application/services/TransferMoneyService";
import { AccountController } from "./interfaces/controllers/AccountController";

// --- Composition Root ---
// The only place in the system that instantiates concrete infrastructure
// and wires it into the inner layers via constructor injection.

const repo = new InMemoryAccountRepository();
const transferService = new TransferService();

const openAccountService = new OpenAccountService(repo);
const depositService = new DepositService(repo);
const transferMoneyService = new TransferMoneyService(repo, transferService);

const controller = new AccountController(
  openAccountService,
  depositService,
  transferMoneyService,
);

// --- Exercise the system end-to-end ---
controller.open("A", "Alice", "USD");
controller.open("B", "Bob", "USD");
controller.deposit("A", 100, "USD");
controller.transfer("A", "B", 40, "USD");

// --- Deliberate invariant violation: domain rule fires ---
try {
  controller.transfer("A", "B", 999, "USD");
} catch (err) {
  console.log(`[caught]   domain invariant fired → ${(err as Error).message}`);
}
