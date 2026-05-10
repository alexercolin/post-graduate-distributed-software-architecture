import type { Book } from "../models/book.model.js";
import { type IRepository, InMemoryRepository } from "./base.repository.js";

export interface IBookRepository extends IRepository<Book> {
  findByIsbn(isbn: string): Book | undefined;
  findByGenre(genre: string): Book[];
}

export class InMemoryBookRepository
  extends InMemoryRepository<Book>
  implements IBookRepository
{
  findByIsbn(isbn: string): Book | undefined {
    return [...this.store.values()].find((b) => b.isbn === isbn);
  }

  findByGenre(genre: string): Book[] {
    return [...this.store.values()].filter((b) => b.genre === genre);
  }
}
