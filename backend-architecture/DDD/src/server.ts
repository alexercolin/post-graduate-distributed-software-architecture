import express from "express";
import { TransferService } from "./domain/TransferService";
import { InMemoryAccountRepository } from "./infrastructure/repositories/InMemoryAccountRepository";
import { OpenAccountService } from "./application/services/OpenAccountService";
import { DepositService } from "./application/services/DepositService";
import { TransferMoneyService } from "./application/services/TransferMoneyService";
import { HttpAccountController } from "./interfaces/controllers/HttpAccountController";

// HTTP Composition Root. Identical wiring to main.ts — only the outermost
// adapter differs (Express here vs. direct CLI calls in main.ts).

const repo = new InMemoryAccountRepository();
const transferService = new TransferService();

const openAccountService = new OpenAccountService(repo);
const depositService = new DepositService(repo);
const transferMoneyService = new TransferMoneyService(repo, transferService);

const httpController = new HttpAccountController(
  openAccountService,
  depositService,
  transferMoneyService,
);

const app = express();
app.use(express.json());
app.use("/api", httpController.router());

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`DDD HTTP server listening on http://localhost:${port}`);
  console.log("");
  console.log("Endpoints:");
  console.log("  POST /api/accounts                { id, ownerName, currency }");
  console.log("  POST /api/accounts/:id/deposits   { amount, currency }");
  console.log("  POST /api/transfers               { fromId, toId, amount, currency }");
});
