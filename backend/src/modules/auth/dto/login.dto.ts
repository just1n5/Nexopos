import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(120)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
