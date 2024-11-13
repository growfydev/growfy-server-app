import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { jwtConstants } from 'src/modules/auth/utils/jwt';
import { PrismaService } from 'src/core/prisma.service';
import { TwoFactorAuthService } from './two-factor-auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: jwtConstants(configService).secret,
        signOptions: { expiresIn: '30d' },
      }),
    })
  ],
  providers: [AuthService, PrismaService, TwoFactorAuthService],
  controllers: [AuthController]
})
export class AuthModule { }
