import type { BaseEntity } from "./base.model.js";

export type MemberStatus = "active" | "inactive";

export type Member = BaseEntity & {
  name: string;
  email: string;
  phone: string;
  memberSince: string;
  maxLoans: number;
  status: MemberStatus;
};
