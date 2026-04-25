import { ContaRepository } from "../../../domain/repositories/ContaRepository";
import { ContaId } from "../../../domain/value-objects/ContaId";
import { Money } from "../../../domain/value-objects/Money";
import { CreditarContaInput } from "./CreditarContaInput";
import { CreditarContaOutput } from "./CreditarContaOutput";

export class CreditarContaUseCase {
  constructor(private readonly repo: ContaRepository) {}

  execute(input: CreditarContaInput): CreditarContaOutput {
    const conta = this.repo.findById(new ContaId(input.id));
    if (!conta) {
      throw new Error(`conta não encontrada: ${input.id}`);
    }
    conta.creditar(new Money(input.valor));
    this.repo.save(conta);
    return { conta };
  }
}
