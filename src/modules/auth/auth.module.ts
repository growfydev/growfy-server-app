import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/core/prisma.service';
import { configLoader } from 'src/lib/config.loader';
import { AuthService } from './services/auth.service';
import { TwoFactorAuthService } from './services/two-factor-auth.service';
import { RolesGuardService } from './services/roles-guard.service';
import { AuthenticationService } from './services/authentication.service';
import { MemberService } from './services/member.service';
import { ProfileService } from './services/profile.service';
import { UserService } from './services/users.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        secret: configLoader().jwt.secret_key,
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [
    AuthService,
    PrismaService,
    TwoFactorAuthService,
    RolesGuardService,
    AuthenticationService,
    MemberService,
    ProfileService,
    UserService,
  ],
  controllers: [AuthController],
  exports: [AuthService, RolesGuardService],
})
export class AuthModule {}
