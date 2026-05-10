import type { NextFunction, Request, Response } from "express";
import type { LoanService } from "../services/loan.service.js";

export class LoanController {
  constructor(private loanService: LoanService) {}

  list = (_req: Request, res: Response) => {
    const loans = this.loanService.listLoans();
    res.json({ data: loans });
  };

  getById = (req: Request, res: Response, next: NextFunction) => {
    try {
      const loan = this.loanService.getLoan(req.params.id!);
      res.json({ data: loan });
    } catch (err) {
      next(err);
    }
  };

  borrow = (req: Request, res: Response, next: NextFunction) => {
    try {
      const loan = this.loanService.borrowBook(req.body);
      res.status(201).json({ data: loan });
    } catch (err) {
      next(err);
    }
  };

  returnBook = (req: Request, res: Response, next: NextFunction) => {
    try {
      const loan = this.loanService.returnBook(req.params.id!);
      res.json({ data: loan });
    } catch (err) {
      next(err);
    }
  };

  getByMember = (req: Request, res: Response, next: NextFunction) => {
    try {
      const loans = this.loanService.getMemberLoans(req.params.memberId!);
      res.json({ data: loans });
    } catch (err) {
      next(err);
    }
  };
}
