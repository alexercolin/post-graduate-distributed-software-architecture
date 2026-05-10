import type { Loan } from "../models/loan.model.js";
import { type IRepository, InMemoryRepository } from "./base.repository.js";

export interface ILoanRepository extends IRepository<Loan> {
  findByMemberId(memberId: string): Loan[];
  findActiveByBookId(bookId: string): Loan[];
  findActiveByMemberId(memberId: string): Loan[];
  findByStatus(status: Loan["status"]): Loan[];
}

export class InMemoryLoanRepository
  extends InMemoryRepository<Loan>
  implements ILoanRepository
{
  findByMemberId(memberId: string): Loan[] {
    return [...this.store.values()].filter((l) => l.memberId === memberId);
  }

  findActiveByBookId(bookId: string): Loan[] {
    return [...this.store.values()].filter(
      (l) => l.bookId === bookId && l.status === "active",
    );
  }

  findActiveByMemberId(memberId: string): Loan[] {
    return [...this.store.values()].filter(
      (l) => l.memberId === memberId && l.status === "active",
    );
  }

  findByStatus(status: Loan["status"]): Loan[] {
    return [...this.store.values()].filter((l) => l.status === status);
  }
}
