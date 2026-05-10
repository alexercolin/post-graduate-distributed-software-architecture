import express from "express";
import { InMemoryBookRepository } from "./repositories/book.repository.js";
import { InMemoryMemberRepository } from "./repositories/member.repository.js";
import { InMemoryLoanRepository } from "./repositories/loan.repository.js";
import { BookService } from "./services/book.service.js";
import { MemberService } from "./services/member.service.js";
import { LoanService } from "./services/loan.service.js";
import { BookController } from "./controllers/book.controller.js";
import { MemberController } from "./controllers/member.controller.js";
import { LoanController } from "./controllers/loan.controller.js";
import { bookRoutes } from "./routes/book.routes.js";
import { memberRoutes } from "./routes/member.routes.js";
import { loanRoutes } from "./routes/loan.routes.js";
import { requestLogger } from "./shared/middleware/request-logger.js";
import { errorHandler } from "./shared/middleware/error-handler.js";

// --- Data Access Tier (swap these for real DB implementations) ---
const bookRepository = new InMemoryBookRepository();
const memberRepository = new InMemoryMemberRepository();
const loanRepository = new InMemoryLoanRepository();

// --- Business Logic Tier ---
const bookService = new BookService(bookRepository);
const memberService = new MemberService(memberRepository);
const loanService = new LoanService(loanRepository, bookRepository, memberRepository);

// --- Presentation Tier ---
const bookController = new BookController(bookService);
const memberController = new MemberController(memberService);
const loanController = new LoanController(loanService);

const app = express();

app.use(express.json());
app.use(requestLogger);

app.use("/api/books", bookRoutes(bookController));
app.use("/api/members", memberRoutes(memberController));
app.use("/api/loans", loanRoutes(loanController));

app.use(errorHandler);

// --- Seed data ---
const seededBooks = [
  bookService.createBook({ title: "Clean Code", author: "Robert C. Martin", isbn: "978-0132350884", genre: "Software Engineering", publishedYear: 2008, totalCopies: 3 }),
  bookService.createBook({ title: "Design Patterns", author: "Gang of Four", isbn: "978-0201633610", genre: "Software Engineering", publishedYear: 1994, totalCopies: 2 }),
  bookService.createBook({ title: "The Pragmatic Programmer", author: "David Thomas & Andrew Hunt", isbn: "978-0135957059", genre: "Software Engineering", publishedYear: 2019, totalCopies: 1 }),
];

const seededMembers = [
  memberService.createMember({ name: "Alice Johnson", email: "alice@example.com", phone: "+1-555-0101" }),
  memberService.createMember({ name: "Bob Smith", email: "bob@example.com", phone: "+1-555-0102" }),
];

const port = 3000;
app.listen(port, () => {
  console.log(`3-Tier Architecture demo listening on http://localhost:${port}`);
  console.log("\nSeeded data:");
  console.log(`  Books:   ${seededBooks.map((b) => `${b.title} (${b.id})`).join(", ")}`);
  console.log(`  Members: ${seededMembers.map((m) => `${m.name} (${m.id})`).join(", ")}`);
  console.log("\nEndpoints:");
  console.log("  GET/POST        /api/books");
  console.log("  GET/PUT/DELETE  /api/books/:id");
  console.log("  GET/POST        /api/members");
  console.log("  GET/PUT/DELETE  /api/members/:id");
  console.log("  GET             /api/loans");
  console.log("  GET             /api/loans/:id");
  console.log("  POST            /api/loans/borrow");
  console.log("  POST            /api/loans/:id/return");
  console.log("  GET             /api/loans/member/:memberId");
});
