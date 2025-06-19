import { Controller, Post, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('validate-token')
  @ApiOperation({
    summary: 'Validation du token et enrichissement du profil', 
    description: 'Valide le token JWT fourni par Auth0 et enrichit le profil utilisateur avec des informations supplémentaires'
  })
  @ApiResponse({
    status: 200,
    description: 'Token valide',
  })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré' })
  async validateToken(@Headers('authorization') authHeader: string): Promise<any> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant ou format invalide');
    }
    
    const token = authHeader.substring(7); // Enlève 'Bearer ' du header
    return this.authService.validateToken(token);
  }
}
