import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { InternalKeyGuard } from "../../common/internal-key.guard";
import { ZodPipe } from "../../common/zod.pipe";
import { AuditService } from "../audit/audit.service";
import { CurrentUser, Roles } from "./auth.decorators";
import { pageInput, userCreate, userUpdate } from "./auth.schemas";
import { auditCategories } from "../audit/audit.service";

const auditQuery = z.strictObject({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  category: z.enum(auditCategories).optional(),
  actorId: z.uuid().optional(),
});
import type { AuthContext } from "./auth.types";
import { SessionGuard } from "./session.guard";
import { UsersService } from "./users.service";

/** Comptes du back-office et journal d'audit : administrateurs uniquement. */
@Controller("v1")
@UseGuards(InternalKeyGuard, SessionGuard)
@Roles("admin")
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  @Get("users")
  list(@Query(new ZodPipe(pageInput)) q: z.infer<typeof pageInput>) {
    return this.users.list(q.page, q.pageSize);
  }

  @Post("users")
  @HttpCode(201)
  create(@Body(new ZodPipe(userCreate)) body: z.infer<typeof userCreate>, @CurrentUser() me: AuthContext) {
    return this.users.create(body, me.userId);
  }

  @Patch("users/:id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body(new ZodPipe(userUpdate)) body: z.infer<typeof userUpdate>, @CurrentUser() me: AuthContext) {
    return this.users.update(id, body, me.userId);
  }

  @Post("users/:id/reset-mfa")
  @HttpCode(200)
  resetMfa(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthContext) {
    return this.users.resetMfa(id, me.userId);
  }

  @Post("users/:id/reset-password")
  @HttpCode(200)
  resetPassword(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthContext) {
    return this.users.resetPassword(id, me.userId);
  }

  @Get("audit/search")
  auditSearch(@Query(new ZodPipe(auditQuery)) q: z.infer<typeof auditQuery>) {
    return this.audit.search(q);
  }

  @Get("audit/summary")
  auditSummary() {
    return this.audit.summary();
  }

  @Get("audit")
  auditLog(@Query(new ZodPipe(pageInput)) q: z.infer<typeof pageInput>) {
    return this.audit.list(q.page, q.pageSize);
  }
}
