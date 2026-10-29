import { IsString, MaxLength } from 'class-validator';

export class SetAvatarDto {
  /** data:image/jpeg;base64,... -- resized in the browser before upload. */
  @IsString()
  @MaxLength(90_000)
  image!: string;
}
