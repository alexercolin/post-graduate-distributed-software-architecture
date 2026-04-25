import { ContaId } from "../value-objects/ContaId";
import { Conta } from "../entities/Conta";

// Contract owned by the domain. Implementations live in the infrastructure
// layer — the dependency rule says inner layers must not know about outer ones.
export interface ContaRepository {
  findById(id: ContaId): Conta | null;
  save(conta: Conta): void;
}
