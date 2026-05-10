import { Router } from "express";
import type { LoanController } from "../controllers/loan.controller.js";

export function loanRoutes(controller: LoanController): Router {
  const router = Router();

  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.post("/borrow", controller.borrow);
  router.post("/:id/return", controller.returnBook);
  router.get("/member/:memberId", controller.getByMember);

  return router;
}
