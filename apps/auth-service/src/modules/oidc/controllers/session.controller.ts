import { Controller, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SessionService } from '../services/session.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OIDCSession } from '../entities/session.entity';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    clientId: string;
  };
}

interface SessionResponse {
  success: boolean;
  sessions?: OIDCSession[];
  message?: string;
}

@ApiTags('sessions')
@ApiBearerAuth()
@Controller('oauth/sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get user sessions',
    description: 'Retrieve all active sessions for the authenticated user'
  })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async getUserSessions(@Req() req: AuthenticatedRequest): Promise<SessionResponse> {
    const sessions = await this.sessionService.findByUserAndClient(
      req.user.id,
      req.user.clientId,
    );
    return {
      success: true,
      sessions,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async revokeSession(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<SessionResponse> {
    const session = await this.sessionService.findById(id);
    
    if (session && session.userId === req.user.id) {
      await this.sessionService.delete(id);
      return {
        success: true,
        message: 'Session revoked successfully',
      };
    }

    return {
      success: false,
      message: 'Session not found or unauthorized',
    };
  }
}