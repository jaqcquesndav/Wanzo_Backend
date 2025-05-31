import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxDeclaration } from './entities/tax-declaration.entity';
import { TaxService } from './services/tax.service';
import { TaxController } from './controllers/tax.controller';
import { JournalsModule } from '../journals/journals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaxDeclaration]),
    JournalsModule,
  ],
  providers: [TaxService],
  controllers: [TaxController],
  exports: [TaxService],
})
export class TaxesModule {}