import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaService } from 'src/core/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'taskQueue',
        }),
        AuthModule
    ],
    controllers: [],
    providers: [PrismaService],
    exports: [],
})
export class TaskModule { }
