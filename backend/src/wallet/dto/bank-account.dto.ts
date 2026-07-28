import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateBankAccountDto {
  @IsString()
  declare bankName: string;

  @IsString()
  declare bankCode: string;

  @IsString()
  declare accountNumber: string;

  @IsString()
  declare accountName: string;

  @IsBoolean()
  @IsOptional()
  declare isDefault?: boolean;
}
