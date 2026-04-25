export class ContaId {
  private readonly id: string;

  constructor(id: string) {
    if (!id || id.trim().length === 0) {
      throw new Error("ContaId: id não pode ser vazio");
    }
    this.id = id;
  }

  value(): string {
    return this.id;
  }

  equals(other: ContaId): boolean {
    return this.id === other.id;
  }
}
