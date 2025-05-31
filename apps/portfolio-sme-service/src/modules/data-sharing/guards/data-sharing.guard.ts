import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { DataSharingService } from '../services/data-sharing.service';

@Injectable()
export class DataSharingGuard implements CanActivate {
  constructor(private dataSharingService: DataSharingService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const companyId = request.user?.companyId;
    const institutionId = request.headers['x-institution-id'];

    if (!companyId || !institutionId) {
      throw new UnauthorizedException('Missing required company or institution ID');
    }

    const sharingEnabled = await this.dataSharingService.checkSharingEnabled(
      companyId,
      institutionId,
    );

    if (!sharingEnabled) {
      throw new UnauthorizedException('Data sharing not enabled for this company');
    }

    return true;
  }
}