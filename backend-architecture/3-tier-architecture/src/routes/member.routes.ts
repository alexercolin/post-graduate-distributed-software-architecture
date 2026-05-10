import { Router } from "express";
import type { MemberController } from "../controllers/member.controller.js";

export function memberRoutes(controller: MemberController): Router {
  const router = Router();

  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}
