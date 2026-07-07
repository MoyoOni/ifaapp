import { IsString, IsNotEmpty } from 'class-validator';

export class ResolveComplaintDto {
  @IsString()
  @IsNotEmpty()
  declare action: string;

  @IsString()
  @IsNotEmpty()
  declare resolutionNotes: string;

  @IsString()
  @IsNotEmpty()
  declare clientNotification: string;
}