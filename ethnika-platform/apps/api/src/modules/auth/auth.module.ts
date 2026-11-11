import { Global, Module } from "@nestjs/common";
import { AccountController } from "./account.controller";
import { AccountService } from "./account.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";
import { SessionGuard } from "./session.guard";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Global()
@Module({
  controllers: [AuthController, UsersController, AccountController],
  providers: [AuthService, PasswordService, UsersService, SessionGuard, AccountService],
  exports: [AuthService, PasswordService, UsersService, SessionGuard],
})
export class AuthModule {}
