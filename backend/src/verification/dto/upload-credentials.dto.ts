import { IsArray, IsString, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CredentialFileDto {
  @IsString()
  declare name: string;

  @IsString()
  declare data: string;
}

export class UploadCredentialsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => CredentialFileDto)
  declare files: CredentialFileDto[];
}
