import { IsString, IsNotEmpty } from 'class-validator';

export class RejectPostDto {
  @IsString()
  @IsNotEmpty()
  declare reason: string;
}
