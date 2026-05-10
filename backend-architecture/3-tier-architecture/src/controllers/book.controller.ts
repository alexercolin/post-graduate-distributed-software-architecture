import type { NextFunction, Request, Response } from "express";
import type { BookService } from "../services/book.service.js";

export class BookController {
  constructor(private bookService: BookService) {}

  list = (_req: Request, res: Response) => {
    const books = this.bookService.listBooks();
    res.json({ data: books });
  };

  getById = (req: Request, res: Response, next: NextFunction) => {
    try {
      const book = this.bookService.getBook(req.params.id!);
      res.json({ data: book });
    } catch (err) {
      next(err);
    }
  };

  create = (req: Request, res: Response, next: NextFunction) => {
    try {
      const book = this.bookService.createBook(req.body);
      res.status(201).json({ data: book });
    } catch (err) {
      next(err);
    }
  };

  update = (req: Request, res: Response, next: NextFunction) => {
    try {
      const book = this.bookService.updateBook(req.params.id!, req.body);
      res.json({ data: book });
    } catch (err) {
      next(err);
    }
  };

  remove = (req: Request, res: Response, next: NextFunction) => {
    try {
      this.bookService.deleteBook(req.params.id!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
