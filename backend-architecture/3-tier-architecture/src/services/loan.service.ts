import type { Loan } from "../models/loan.model.js";
import type { IBookRepository } from "../repositories/book.repository.js";
import type { ILoanRepository } from "../repositories/loan.repository.js";
import type { IMemberRepository } from "../repositories/member.repository.js";
import { NotFoundError, ValidationError } from "../shared/errors.js";
import { generateId } from "../shared/utils/id-generator.js";

export class LoanService {
  constructor(
    private loanRepository: ILoanRepository,
    private bookRepository: IBookRepository,
    private memberRepository: IMemberRepository,
  ) {}

  listLoans(): Loan[] {
    return this.loanRepository.findAll();
  }

  getLoan(id: string): Loan {
    const loan = this.loanRepository.findById(id);
    if (!loan) throw new NotFoundError("Loan");
    return loan;
  }

  borrowBook(data: { bookId: string; memberId: string }): Loan {
    const book = this.bookRepository.findById(data.bookId);
    if (!book) throw new NotFoundError("Book");

    const member = this.memberRepository.findById(data.memberId);
    if (!member) throw new NotFoundError("Member");

    if (member.status === "inactive")
      throw new ValidationError("Inactive members cannot borrow books");

    if (book.availableCopies < 1)
      throw new ValidationError("No copies available for this book");

    const activeLoans = this.loanRepository.findActiveByMemberId(member.id);
    if (activeLoans.length >= member.maxLoans)
      throw new ValidationError("Member has reached the borrowing limit");

    book.availableCopies -= 1;
    book.status = book.availableCopies > 0 ? "available" : "unavailable";
    this.bookRepository.save(book);

    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 14);

    const loan: Loan = {
      id: generateId(),
      bookId: book.id,
      memberId: member.id,
      loanDate: today.toISOString().split("T")[0]!,
      dueDate: dueDate.toISOString().split("T")[0]!,
      returnDate: null,
      status: "active",
      createdAt: today,
      updatedAt: today,
    };

    this.loanRepository.save(loan);
    return loan;
  }

  returnBook(loanId: string): Loan {
    const loan = this.loanRepository.findById(loanId);
    if (!loan) throw new NotFoundError("Loan");

    if (loan.status === "returned")
      throw new ValidationError("This loan has already been returned");

    const today = new Date();
    loan.returnDate = today.toISOString().split("T")[0]!;
    loan.status = "returned";
    this.loanRepository.save(loan);

    const book = this.bookRepository.findById(loan.bookId);
    if (book) {
      book.availableCopies += 1;
      book.status = "available";
      this.bookRepository.save(book);
    }

    return loan;
  }

  getMemberLoans(memberId: string): Loan[] {
    const member = this.memberRepository.findById(memberId);
    if (!member) throw new NotFoundError("Member");
    return this.loanRepository.findByMemberId(memberId);
  }
}
