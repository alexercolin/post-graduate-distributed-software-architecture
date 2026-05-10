import type { NextFunction, Request, Response } from "express";
import type { MemberService } from "../services/member.service.js";

export class MemberController {
  constructor(private memberService: MemberService) {}

  list = (_req: Request, res: Response) => {
    const members = this.memberService.listMembers();
    res.json({ data: members });
  };

  getById = (req: Request, res: Response, next: NextFunction) => {
    try {
      const member = this.memberService.getMember(req.params.id!);
      res.json({ data: member });
    } catch (err) {
      next(err);
    }
  };

  create = (req: Request, res: Response, next: NextFunction) => {
    try {
      const member = this.memberService.createMember(req.body);
      res.status(201).json({ data: member });
    } catch (err) {
      next(err);
    }
  };

  update = (req: Request, res: Response, next: NextFunction) => {
    try {
      const member = this.memberService.updateMember(req.params.id!, req.body);
      res.json({ data: member });
    } catch (err) {
      next(err);
    }
  };

  remove = (req: Request, res: Response, next: NextFunction) => {
    try {
      this.memberService.deleteMember(req.params.id!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
