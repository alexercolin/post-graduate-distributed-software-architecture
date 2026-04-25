import { ContaId } from "../value-objects/ContaId";
import { Money } from "../value-objects/Money";

export class Conta {
  constructor(
    public readonly id: ContaId,
    private saldo: Money,
    private limiteCredito: Money,
  ) {}

  creditar(valor: Money): void {
    this.saldo = this.saldo.add(valor);
  }

  debitar(valor: Money): void {
    const saldoDisponivel = this.saldo.add(this.limiteCredito);
    if (valor.greaterThan(saldoDisponivel)) {
      throw new Error("Conta: saldo insuficiente (saldo + limite excedido)");
    }
    this.saldo = this.saldo.subtract(valor);
  }

  definirLimiteCredito(novoLimite: Money): void {
    this.limiteCredito = novoLimite;
  }

  consultarSaldo(): { saldo: Money; limiteCredito: Money; saldoDisponivel: Money } {
    return {
      saldo: this.saldo,
      limiteCredito: this.limiteCredito,
      saldoDisponivel: this.saldo.add(this.limiteCredito),
    };
  }
}
