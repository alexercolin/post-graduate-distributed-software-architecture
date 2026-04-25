import express from "express";
import { ContaId } from "../../domain/value-objects/ContaId";
import { Money } from "../../domain/value-objects/Money";
import { Conta } from "../../domain/entities/Conta";
import { InMemoryContaRepository } from "../repositories/InMemoryContaRepository";
import { ConsultarContaUseCase } from "../../app/usecases/consultar/ConsultarContaUseCase";
import { CreditarContaUseCase } from "../../app/usecases/creditar/CreditarContaUseCase";
import { DebitarContaUseCase } from "../../app/usecases/debitar/DebitarContaUseCase";
import { DefinirLimiteCreditoUseCase } from "../../app/usecases/definirLimiteCredito/DefinirLimiteCreditoUseCase";
import { ContaController } from "../controllers/ContaController";

// --- Composition Root ---
// The only file that imports from all three layers. Concrete infrastructure
// (repository, Express) is wired into the inner layers via constructor
// injection. Inner layers never reach outward.

const repo = new InMemoryContaRepository();

repo.save(new Conta(new ContaId("acc-1"), new Money(200), new Money(100)));

const consultar = new ConsultarContaUseCase(repo);
const creditar = new CreditarContaUseCase(repo);
const debitar = new DebitarContaUseCase(repo);
const definirLimite = new DefinirLimiteCreditoUseCase(repo);

const controller = new ContaController(consultar, creditar, debitar, definirLimite);

const app = express();
app.use(express.json());
app.use(controller.router());

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Clean Architecture HTTP server listening on http://localhost:${port}`);
  console.log("");
  console.log("Endpoints:");
  console.log("  GET  /accounts/:id");
  console.log("  POST /accounts/:id/credit          { valor }");
  console.log("  POST /accounts/:id/debit           { valor }");
  console.log("  PUT  /accounts/:id/credit-limit    { limite }");
  console.log("");
  console.log("Seeded conta: acc-1 (saldo=200, limiteCredito=100)");
});
