import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum ContactType {
  EMAIL = 'email',
  PHONE = 'phone',
  MEETING = 'meeting',
  LINKEDIN = 'linkedin'
}

export enum MeetingType {
  PHYSICAL = 'physical',
  VIRTUAL = 'virtual'
}

export class ContactRequestDto {
  @IsString()
  companyId!: string;

  @IsEnum(ContactType)
  contactType!: ContactType;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class MeetingRequestDto {
  @IsString()
  companyId!: string;

  @IsEnum(MeetingType)
  type!: MeetingType;

  @IsDateString()
  date!: string;

  @IsString()
  time!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class OpportunityFiltersDto {
  @IsOptional()
  @IsEnum(['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'])
  status?: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  searchTerm?: string;
}