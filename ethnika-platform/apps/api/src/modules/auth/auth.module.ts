import { Global, Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";
import { SessionGuard } from "./session.guard";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Global()
@Module({
  controllers: [AuthController, UsersController],
  providers: [AuthService, PasswordService, UsersService, SessionGuard],
  exports: [AuthService, PasswordService, UsersService, SessionGuard],
})
export class AuthModule {}
