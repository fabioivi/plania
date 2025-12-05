import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Plan } from './plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plan]),
    BullModule.registerQueue({
      name: 'plans-queue',
    }),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class PlansModule {}
