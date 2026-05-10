import type { BaseEntity } from "../models/base.model.js";

export interface IRepository<T extends BaseEntity> {
  findAll(): T[];
  findById(id: string): T | undefined;
  save(entity: T): void;
  delete(id: string): boolean;
}

export class InMemoryRepository<T extends BaseEntity> implements IRepository<T> {
  protected store = new Map<string, T>();

  findAll(): T[] {
    return [...this.store.values()];
  }

  findById(id: string): T | undefined {
    return this.store.get(id);
  }

  save(entity: T): void {
    entity.updatedAt = new Date();
    this.store.set(entity.id, entity);
  }

  delete(id: string): boolean {
    return this.store.delete(id);
  }
}
