import { Controller, Get, HttpCode, Module, Post, UseGuards } from "@nestjs/common";
import { InternalKeyGuard } from "../../common/internal-key.guard";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import type { AuthContext } from "../auth/auth.types";
import { SessionGuard } from "../auth/session.guard";
import { NotificationsService } from "./notifications.service";

/** Cloche du back-office : liste et marquage « lu » (agents et admins). */
@Controller("v1/notifications")
@UseGuards(InternalKeyGuard, SessionGuard)
@Roles("agent", "admin")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() me: AuthContext) {
    return this.notifications.list(me);
  }

  @Post("seen")
  @HttpCode(200)
  seen(@CurrentUser() me: AuthContext) {
    return this.notifications.markSeen(me);
  }
}

@Module({ controllers: [NotificationsController], providers: [NotificationsService] })
export class NotificationsModule {}
