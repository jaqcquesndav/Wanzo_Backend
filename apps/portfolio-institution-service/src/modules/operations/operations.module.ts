import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operation } from './entities/operation.entity';
import { Workflow } from './entities/workflow.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { OperationService } from './services/operation.service';
import { WorkflowService } from './services/workflow.service';
import { OperationController } from './controllers/operation.controller';
import { WorkflowController } from './controllers/workflow.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Operation, Workflow, WorkflowStep]),
  ],
  providers: [OperationService, WorkflowService],
  controllers: [OperationController, WorkflowController],
  exports: [OperationService, WorkflowService],
})
export class OperationsModule {}