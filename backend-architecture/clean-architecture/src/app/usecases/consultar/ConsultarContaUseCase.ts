import { ContaRepository } from "../../../domain/repositories/ContaRepository";
import { ContaId } from "../../../domain/value-objects/ContaId";
import { ConsultarContaInput } from "./ConsultarContaInput";
import { ConsultarContaOutput } from "./ConsultarContaOutput";

export class ConsultarContaUseCase {
  constructor(private readonly repo: ContaRepository) {}

  execute(input: ConsultarContaInput): ConsultarContaOutput {
    const conta = this.repo.findById(new ContaId(input.id));
    if (!conta) {
      throw new Error(`conta não encontrada: ${input.id}`);
    }
    return { conta };
  }
}
