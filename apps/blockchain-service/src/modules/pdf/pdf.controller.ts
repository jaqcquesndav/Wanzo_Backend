import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

class GenerateDto { content!: string; }

@ApiTags('pdf')
@Controller('pdf')
export class PdfController {
  @Get('health')
  health() { return { status: 'ok' }; }

  @Post('generate')
  @ApiOperation({
    summary: 'Deprecated: use POST /contracts/:id/documents/generate when tied to a contract',
    deprecated: true,
    description: 'This generic PDF generator is a placeholder. Prefer the contracts document workflow which uploads to IPFS and then anchors on Fabric.'
  })
  async generate(@Body() _dto: GenerateDto) {
    // Placeholder: real PDF generation can be integrated later
    return { ok: true, size: _dto.content?.length || 0 };
  }
}
