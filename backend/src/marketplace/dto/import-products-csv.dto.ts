import { IsString, MinLength } from 'class-validator';

export class ImportProductsCsvDto {
  @IsString()
  @MinLength(1)
  declare csv: string;
}
