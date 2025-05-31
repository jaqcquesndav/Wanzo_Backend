import { Controller, Get, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { WorkflowService } from '../services/workflow.service';
import { UpdateWorkflowDto, UpdateWorkflowStepDto, ManagerValidationDto, SystemCheckDto } from '../dtos/workflow.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('workflows')
@Controller('workflows')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('operation/:operationId')
  @ApiOperation({ summary: 'Get workflow by operation ID' })
  @ApiParam({ name: 'operationId', description: 'Operation ID' })
  @ApiResponse({ status: 200, description: 'Workflow retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async findByOperation(@Param('operationId') operationId: string) {
    const workflow = await this.workflowService.findByOperationId(operationId);
    return {
      success: true,
      workflow,
    };
  }

  @Get(':id/steps')
  @ApiOperation({ summary: 'Get workflow steps' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Workflow steps retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async getSteps(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const workflow = await this.workflowService.findById(id);
    const steps = workflow.steps;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      success: true,
      page,
      limit,
      totalItems: steps.length,
      totalPages: Math.ceil(steps.length / limit),
      steps: steps.slice(start, end),
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow updated successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async update(
    @Param('id') id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
  ) {
    const workflow = await this.workflowService.update(id, updateWorkflowDto);
    return {
      success: true,
      workflow,
    };
  }

  @Put(':id/steps/:stepId')
  @ApiOperation({ summary: 'Update workflow step' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiParam({ name: 'stepId', description: 'Step ID' })
  @ApiResponse({ status: 200, description: 'Workflow step updated successfully' })
  @ApiResponse({ status: 404, description: 'Workflow or step not found' })
  async updateStep(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() updateStepDto: UpdateWorkflowStepDto,
  ) {
    const step = await this.workflowService.updateStep(id, stepId, updateStepDto);
    return {
      success: true,
      step,
    };
  }

  @Put(':id/steps/:stepId/manager-validation')
  @Roles('manager')
  @ApiOperation({ summary: 'Manager validation for step' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiParam({ name: 'stepId', description: 'Step ID' })
  @ApiResponse({ status: 200, description: 'Manager validation completed successfully' })
  @ApiResponse({ status: 404, description: 'Workflow or step not found' })
  async managerValidation(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() validationDto: ManagerValidationDto,
  ) {
    const step = await this.workflowService.managerValidation(id, stepId, validationDto);
    return {
      success: true,
      step,
    };
  }

  @Put(':id/steps/:stepId/system-check')
  @ApiOperation({ summary: 'System check for step' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiParam({ name: 'stepId', description: 'Step ID' })
  @ApiResponse({ status: 200, description: 'System check completed successfully' })
  @ApiResponse({ status: 404, description: 'Workflow or step not found' })
  async systemCheck(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() checkDto: SystemCheckDto,
  ) {
    const step = await this.workflowService.systemCheck(id, stepId, checkDto);
    return {
      success: true,
      step,
    };
  }

  @Put(':id/refresh')
  @ApiOperation({ summary: 'Refresh workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow refreshed successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async refresh(@Param('id') id: string) {
    const workflow = await this.workflowService.refresh(id);
    return {
      success: true,
      message: 'Workflow refreshed successfully',
      workflow,
    };
  }
}