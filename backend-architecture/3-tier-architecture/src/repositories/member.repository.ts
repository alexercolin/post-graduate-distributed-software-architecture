import type { Member } from "../models/member.model.js";
import { type IRepository, InMemoryRepository } from "./base.repository.js";

export interface IMemberRepository extends IRepository<Member> {
  findByEmail(email: string): Member | undefined;
  findByStatus(status: Member["status"]): Member[];
}

export class InMemoryMemberRepository
  extends InMemoryRepository<Member>
  implements IMemberRepository
{
  findByEmail(email: string): Member | undefined {
    return [...this.store.values()].find((m) => m.email === email);
  }

  findByStatus(status: Member["status"]): Member[] {
    return [...this.store.values()].filter((m) => m.status === status);
  }
}
