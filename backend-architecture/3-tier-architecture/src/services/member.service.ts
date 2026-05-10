import type { Member } from "../models/member.model.js";
import type { IMemberRepository } from "../repositories/member.repository.js";
import { NotFoundError, ValidationError } from "../shared/errors.js";
import { generateId } from "../shared/utils/id-generator.js";

export class MemberService {
  constructor(private memberRepository: IMemberRepository) {}

  listMembers(): Member[] {
    return this.memberRepository.findAll();
  }

  getMember(id: string): Member {
    const member = this.memberRepository.findById(id);
    if (!member) throw new NotFoundError("Member");
    return member;
  }

  createMember(data: { name: string; email: string; phone: string }): Member {
    if (!data.name?.trim()) throw new ValidationError("Name is required");
    if (!data.email?.trim() || !data.email.includes("@"))
      throw new ValidationError("A valid email is required");
    if (!data.phone?.trim()) throw new ValidationError("Phone is required");

    if (this.memberRepository.findByEmail(data.email.trim()))
      throw new ValidationError("Email already registered");

    const now = new Date();
    const member: Member = {
      id: generateId(),
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      memberSince: now.toISOString().split("T")[0]!,
      maxLoans: 3,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    this.memberRepository.save(member);
    return member;
  }

  updateMember(
    id: string,
    data: Partial<{ name: string; email: string; phone: string; maxLoans: number; status: Member["status"] }>,
  ): Member {
    const member = this.getMember(id);

    if (data.name !== undefined) {
      if (!data.name.trim()) throw new ValidationError("Name cannot be empty");
      member.name = data.name.trim();
    }
    if (data.email !== undefined) {
      if (!data.email.trim() || !data.email.includes("@"))
        throw new ValidationError("A valid email is required");
      const existing = this.memberRepository.findByEmail(data.email.trim());
      if (existing && existing.id !== id)
        throw new ValidationError("Email already registered");
      member.email = data.email.trim();
    }
    if (data.phone !== undefined) {
      if (!data.phone.trim()) throw new ValidationError("Phone cannot be empty");
      member.phone = data.phone.trim();
    }
    if (data.maxLoans !== undefined) {
      if (data.maxLoans < 1)
        throw new ValidationError("Max loans must be at least 1");
      member.maxLoans = data.maxLoans;
    }
    if (data.status !== undefined) {
      member.status = data.status;
    }

    this.memberRepository.save(member);
    return member;
  }

  deleteMember(id: string): void {
    this.getMember(id);
    this.memberRepository.delete(id);
  }
}
