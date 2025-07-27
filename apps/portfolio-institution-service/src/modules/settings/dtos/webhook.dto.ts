import { IsString, IsBoolean, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWebhookDto {
  @ApiProperty({ description: 'Event type that triggers the webhook' })
  @IsString()
  event!: string;

  @ApiProperty({ description: 'URL to call when the event is triggered' })
  @IsUrl()
  url!: string;

  @ApiPropertyOptional({ description: 'Whether the webhook is active' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Secret used to sign the webhook payload' })
  @IsOptional()
  @IsString()
  secret?: string;
}

export class UpdateWebhookDto {
  @ApiPropertyOptional({ description: 'URL to call when the event is triggered' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ description: 'Whether the webhook is active' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Secret used to sign the webhook payload' })
  @IsOptional()
  @IsString()
  secret?: string;
}

export class WebhookResponseDto {
  @ApiProperty({ description: 'Webhook ID' })
  id!: string;

  @ApiProperty({ description: 'Event type that triggers the webhook' })
  event!: string;

  @ApiProperty({ description: 'URL to call when the event is triggered' })
  url!: string;

  @ApiProperty({ description: 'Whether the webhook is active' })
  active!: boolean;

  @ApiProperty({ description: 'Webhook creation date' })
  createdAt!: Date;

  @ApiPropertyOptional({ description: 'Last update date' })
  updatedAt?: Date;
}

export class WebhookTestResponseDto {
  @ApiProperty({ description: 'Success status' })
  success!: boolean;

  @ApiProperty({ description: 'Response message' })
  message!: string;

  @ApiProperty({ description: 'Test details' })
  details!: {
    statusCode: number;
    response: string;
    latency: number;
  };
}
