import type { BaseEntity } from "./base.model.js";

export type BookStatus = "available" | "unavailable";

export type Book = BaseEntity & {
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publishedYear: number;
  availableCopies: number;
  totalCopies: number;
  status: BookStatus;
};
