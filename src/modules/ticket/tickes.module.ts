import { forwardRef, Module } from '@nestjs/common';
import { TicketsService } from './tickes.service';
import { TicketsController } from './tickes.controller';
import { PrismaService } from 'src/core/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
	imports: [forwardRef(() => AuthModule)],
	controllers: [TicketsController],
	providers: [TicketsService, PrismaService, JwtService],
})
export class TickesModule {}
