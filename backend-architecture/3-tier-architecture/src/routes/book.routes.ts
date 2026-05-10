import { Router } from "express";
import type { BookController } from "../controllers/book.controller.js";

export function bookRoutes(controller: BookController): Router {
  const router = Router();

  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}
