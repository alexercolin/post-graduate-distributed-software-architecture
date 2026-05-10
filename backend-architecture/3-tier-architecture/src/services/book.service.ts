import type { Book } from "../models/book.model.js";
import type { IBookRepository } from "../repositories/book.repository.js";
import { NotFoundError, ValidationError } from "../shared/errors.js";
import { generateId } from "../shared/utils/id-generator.js";

export class BookService {
  constructor(private bookRepository: IBookRepository) {}

  listBooks(): Book[] {
    return this.bookRepository.findAll();
  }

  getBook(id: string): Book {
    const book = this.bookRepository.findById(id);
    if (!book) throw new NotFoundError("Book");
    return book;
  }

  createBook(data: {
    title: string;
    author: string;
    isbn: string;
    genre: string;
    publishedYear: number;
    totalCopies: number;
  }): Book {
    if (!data.title?.trim()) throw new ValidationError("Title is required");
    if (!data.author?.trim()) throw new ValidationError("Author is required");
    if (!data.isbn?.trim()) throw new ValidationError("ISBN is required");
    if (!data.genre?.trim()) throw new ValidationError("Genre is required");
    if (!data.publishedYear) throw new ValidationError("Published year is required");
    if (!data.totalCopies || data.totalCopies < 1)
      throw new ValidationError("Total copies must be at least 1");

    if (this.bookRepository.findByIsbn(data.isbn.trim()))
      throw new ValidationError("A book with this ISBN already exists");

    const now = new Date();
    const book: Book = {
      id: generateId(),
      title: data.title.trim(),
      author: data.author.trim(),
      isbn: data.isbn.trim(),
      genre: data.genre.trim(),
      publishedYear: data.publishedYear,
      totalCopies: data.totalCopies,
      availableCopies: data.totalCopies,
      status: "available",
      createdAt: now,
      updatedAt: now,
    };

    this.bookRepository.save(book);
    return book;
  }

  updateBook(
    id: string,
    data: Partial<{
      title: string;
      author: string;
      isbn: string;
      genre: string;
      publishedYear: number;
      totalCopies: number;
    }>,
  ): Book {
    const book = this.getBook(id);

    if (data.title !== undefined) {
      if (!data.title.trim()) throw new ValidationError("Title cannot be empty");
      book.title = data.title.trim();
    }
    if (data.author !== undefined) {
      if (!data.author.trim()) throw new ValidationError("Author cannot be empty");
      book.author = data.author.trim();
    }
    if (data.isbn !== undefined) {
      if (!data.isbn.trim()) throw new ValidationError("ISBN cannot be empty");
      const existing = this.bookRepository.findByIsbn(data.isbn.trim());
      if (existing && existing.id !== id)
        throw new ValidationError("A book with this ISBN already exists");
      book.isbn = data.isbn.trim();
    }
    if (data.genre !== undefined) {
      if (!data.genre.trim()) throw new ValidationError("Genre cannot be empty");
      book.genre = data.genre.trim();
    }
    if (data.publishedYear !== undefined) {
      book.publishedYear = data.publishedYear;
    }
    if (data.totalCopies !== undefined) {
      if (data.totalCopies < 1)
        throw new ValidationError("Total copies must be at least 1");
      const lentOut = book.totalCopies - book.availableCopies;
      if (data.totalCopies < lentOut)
        throw new ValidationError("Cannot reduce total copies below currently lent out count");
      book.availableCopies = data.totalCopies - lentOut;
      book.totalCopies = data.totalCopies;
    }

    book.status = book.availableCopies > 0 ? "available" : "unavailable";
    this.bookRepository.save(book);
    return book;
  }

  deleteBook(id: string): void {
    this.getBook(id);
    this.bookRepository.delete(id);
  }
}
