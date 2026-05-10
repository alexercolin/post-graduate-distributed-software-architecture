import type { RequestHandler } from "express";

export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const elapsed = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${elapsed}ms`);
  });

  next();
};
