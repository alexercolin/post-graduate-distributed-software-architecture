import { ContaRepository } from "../../../domain/repositories/ContaRepository";
import { ContaId } from "../../../domain/value-objects/ContaId";
import { Money } from "../../../domain/value-objects/Money";
import { DefinirLimiteCreditoInput } from "./DefinirLimiteCreditoInput";
import { DefinirLimiteCreditoOutput } from "./DefinirLimiteCreditoOutput";

export class DefinirLimiteCreditoUseCase {
  constructor(private readonly repo: ContaRepository) {}

  execute(input: DefinirLimiteCreditoInput): DefinirLimiteCreditoOutput {
    const conta = this.repo.findById(new ContaId(input.id));
    if (!conta) {
      throw new Error(`conta não encontrada: ${input.id}`);
    }
    conta.definirLimiteCredito(new Money(input.limite));
    this.repo.save(conta);
    return { conta };
  }
}
