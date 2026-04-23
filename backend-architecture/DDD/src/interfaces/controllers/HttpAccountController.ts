import { Router, Request, Response } from "express";
import { BankAccount } from "../../domain/entities/BankAccount";
import { OpenAccountService } from "../../application/services/OpenAccountService";
import { DepositService } from "../../application/services/DepositService";
import { TransferMoneyService } from "../../application/services/TransferMoneyService";

// HTTP adapter. Same layer as AccountController (the CLI adapter) — both
// translate external calls into application-service invocations. Adding this
// file required zero changes to domain or application code.
export class HttpAccountController {
  constructor(
    private readonly openAccountService: OpenAccountService,
    private readonly depositService: DepositService,
    private readonly transferMoneyService: TransferMoneyService,
  ) {}

  router(): Router {
    const router = Router();
    router.post("/accounts", (req, res) => this.openAccount(req, res));
    router.post("/accounts/:id/deposits", (req, res) => this.deposit(req, res));
    router.post("/transfers", (req, res) => this.transfer(req, res));
    return router;
  }

  private openAccount(req: Request, res: Response): void {
    try {
      const { id, ownerName, currency } = req.body;
      const account = this.openAccountService.execute({ id, ownerName, currency });
      res.status(201).json(this.serialize(account));
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  }

  private deposit(req: Request, res: Response): void {
    try {
      const { amount, currency } = req.body;
      const account = this.depositService.execute({
        accountId: req.params.id,
        amount,
        currency,
      });
      res.json(this.serialize(account));
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  }

  private transfer(req: Request, res: Response): void {
    try {
      const { fromId, toId, amount, currency } = req.body;
      const { from, to } = this.transferMoneyService.execute({
        fromId,
        toId,
        amount,
        currency,
      });
      res.json({ from: this.serialize(from), to: this.serialize(to) });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  }

  private serialize(account: BankAccount) {
    return {
      id: account.id,
      ownerName: account.ownerName,
      balance: {
        amount: account.balance.amount,
        currency: account.balance.currency,
      },
    };
  }
}
