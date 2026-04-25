import { ContaRepository } from "../../../domain/repositories/ContaRepository";
import { ContaId } from "../../../domain/value-objects/ContaId";
import { Money } from "../../../domain/value-objects/Money";
import { DebitarContaInput } from "./DebitarContaInput";
import { DebitarContaOutput } from "./DebitarContaOutput";

export class DebitarContaUseCase {
  constructor(private readonly repo: ContaRepository) {}

  execute(input: DebitarContaInput): DebitarContaOutput {
    const conta = this.repo.findById(new ContaId(input.id));
    if (!conta) {
      throw new Error(`conta não encontrada: ${input.id}`);
    }
    conta.debitar(new Money(input.valor));
    this.repo.save(conta);
    return { conta };
  }
}
