import { Conta } from "../../domain/entities/Conta";

// Presenters live in the outer layer: they translate the domain entity
// returned by use cases into the shape this delivery mechanism (HTTP/JSON)
// wants. The domain entity itself stays free of any serialization concern.
export const ContaPresenter = {
  toJSON(conta: Conta) {
    const { saldo, limiteCredito, saldoDisponivel } = conta.consultarSaldo();
    return {
      id: conta.id.value(),
      saldo: saldo.value(),
      limiteCredito: limiteCredito.value(),
      saldoDisponivel: saldoDisponivel.value(),
    };
  },

  toErrorResponse(err: unknown) {
    const message = err instanceof Error ? err.message : "erro desconhecido";
    return { error: message };
  },
};
