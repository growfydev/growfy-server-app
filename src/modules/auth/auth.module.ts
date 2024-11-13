import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/core/prisma.service';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { configLoader } from 'src/lib/config.loader';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        secret: configLoader().jwt.secret_key,
        signOptions: { expiresIn: '7d' },
      }),
    })
  ],
  providers: [AuthService, PrismaService, TwoFactorAuthService],
  controllers: [AuthController]
})
export class AuthModule { }
