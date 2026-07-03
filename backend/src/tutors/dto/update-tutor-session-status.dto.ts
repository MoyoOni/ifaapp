import { IsString } from 'class-validator';

export class UpdateTutorSessionStatusDto {
  @IsString()
  declare status: string;
}
