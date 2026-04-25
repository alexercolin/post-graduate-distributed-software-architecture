import { ContaRepository } from "../../domain/repositories/ContaRepository";
import { ContaId } from "../../domain/value-objects/ContaId";
import { Conta } from "../../domain/entities/Conta";

export class InMemoryContaRepository implements ContaRepository {
  private readonly store = new Map<string, Conta>();

  findById(id: ContaId): Conta | null {
    return this.store.get(id.value()) ?? null;
  }

  save(conta: Conta): void {
    this.store.set(conta.id.value(), conta);
  }
}
