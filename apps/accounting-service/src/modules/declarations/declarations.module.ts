import { Module } from '@nestjs/common';
import { DeclarationController } from './declaration.controller';
import { TaxesModule } from '../taxes/taxes.module';

@Module({
  imports: [TaxesModule],
  controllers: [DeclarationController],
})
export class DeclarationModule {}
