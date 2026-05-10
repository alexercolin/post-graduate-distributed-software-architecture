import type { BaseEntity } from "./base.model.js";

export type LoanStatus = "active" | "returned" | "overdue";

export type Loan = BaseEntity & {
  bookId: string;
  memberId: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: LoanStatus;
};
