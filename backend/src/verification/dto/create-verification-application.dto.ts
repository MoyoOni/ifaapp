import { IsString, IsArray, IsNumber, MinLength, IsUrl, ArrayMinSize } from 'class-validator';

export class CreateVerificationApplicationDto {
  @IsString()
  @MinLength(1)
  declare lineage: string; // Documented lineage traceable to recognized source

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  declare mentorEndorsements: string[]; // IDs of endorsing Babalawos

  @IsNumber()
  declare yearsOfService: number;

  @IsArray()
  @IsUrl({}, { each: true })
  declare documentation: string[]; // URLs to lineage documents, certificates

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  declare specialization: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  declare languages: string[];
}
