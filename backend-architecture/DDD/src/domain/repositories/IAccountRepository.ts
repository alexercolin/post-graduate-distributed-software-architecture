import { BankAccount } from "../entities/BankAccount";

// Repository contract lives in the DOMAIN. Infrastructure must conform to it,
// not the other way around — this is the Dependency Inversion heart of DDD.
export interface IAccountRepository {
  findById(id: string): BankAccount | null;
  save(account: BankAccount): void;
}
