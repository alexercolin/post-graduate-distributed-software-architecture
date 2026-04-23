import { OpenAccountService } from "../../application/services/OpenAccountService";
import { DepositService } from "../../application/services/DepositService";
import { TransferMoneyService } from "../../application/services/TransferMoneyService";

// Interface Adapter: translates an external call (HTTP handler, CLI, test)
// into an application-service invocation. Never touches domain logic directly
// and never touches repositories directly.
export class AccountController {
  constructor(
    private readonly openAccountService: OpenAccountService,
    private readonly depositService: DepositService,
    private readonly transferMoneyService: TransferMoneyService,
  ) {}

  open(id: string, ownerName: string, currency: string): void {
    const account = this.openAccountService.execute({ id, ownerName, currency });
    console.log(`[opened]   ${account.id} (${account.ownerName}) balance=${account.balance}`);
  }

  deposit(accountId: string, amount: number, currency: string): void {
    const account = this.depositService.execute({ accountId, amount, currency });
    console.log(`[deposit]  ${account.id} +${amount} ${currency} → balance=${account.balance}`);
  }

  transfer(fromId: string, toId: string, amount: number, currency: string): void {
    const { from, to } = this.transferMoneyService.execute({ fromId, toId, amount, currency });
    console.log(`[transfer] ${amount} ${currency}: ${from.id}→${to.id}`);
    console.log(`           ${from.id} balance=${from.balance}`);
    console.log(`           ${to.id} balance=${to.balance}`);
  }
}
