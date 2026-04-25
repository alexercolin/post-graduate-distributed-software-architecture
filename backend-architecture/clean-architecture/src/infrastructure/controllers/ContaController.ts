import { Router, Request, Response } from "express";
import { ConsultarContaUseCase } from "../../app/usecases/consultar/ConsultarContaUseCase";
import { CreditarContaUseCase } from "../../app/usecases/creditar/CreditarContaUseCase";
import { DebitarContaUseCase } from "../../app/usecases/debitar/DebitarContaUseCase";
import { DefinirLimiteCreditoUseCase } from "../../app/usecases/definirLimiteCredito/DefinirLimiteCreditoUseCase";
import { ContaPresenter } from "../presenters/ContaPresenter";

export class ContaController {
  constructor(
    private readonly consultar: ConsultarContaUseCase,
    private readonly creditar: CreditarContaUseCase,
    private readonly debitar: DebitarContaUseCase,
    private readonly definirLimite: DefinirLimiteCreditoUseCase,
  ) {}

  router(): Router {
    const router = Router();
    router.get("/accounts/:id", (req, res) => this.handleConsultar(req, res));
    router.post("/accounts/:id/credit", (req, res) => this.handleCreditar(req, res));
    router.post("/accounts/:id/debit", (req, res) => this.handleDebitar(req, res));
    router.put("/accounts/:id/credit-limit", (req, res) => this.handleDefinirLimite(req, res));
    return router;
  }

  private handleConsultar(req: Request, res: Response) {
    try {
      const { conta } = this.consultar.execute({ id: req.params.id });
      res.json(ContaPresenter.toJSON(conta));
    } catch (err) {
      res.status(400).json(ContaPresenter.toErrorResponse(err));
    }
  }

  private handleCreditar(req: Request, res: Response) {
    try {
      const { conta } = this.creditar.execute({
        id: req.params.id,
        valor: Number(req.body?.valor),
      });
      res.json(ContaPresenter.toJSON(conta));
    } catch (err) {
      res.status(400).json(ContaPresenter.toErrorResponse(err));
    }
  }

  private handleDebitar(req: Request, res: Response) {
    try {
      const { conta } = this.debitar.execute({
        id: req.params.id,
        valor: Number(req.body?.valor),
      });
      res.json(ContaPresenter.toJSON(conta));
    } catch (err) {
      res.status(400).json(ContaPresenter.toErrorResponse(err));
    }
  }

  private handleDefinirLimite(req: Request, res: Response) {
    try {
      const { conta } = this.definirLimite.execute({
        id: req.params.id,
        limite: Number(req.body?.limite),
      });
      res.json(ContaPresenter.toJSON(conta));
    } catch (err) {
      res.status(400).json(ContaPresenter.toErrorResponse(err));
    }
  }
}
