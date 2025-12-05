import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Endereço de e-mail do usuário',
    example: 'professor@ifms.edu.br',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João da Silva',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Senha para acesso ao sistema',
    example: 'SenhaSegura123!',
    minLength: 6,
    format: 'password',
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'Endereço de e-mail do usuário',
    example: 'professor@ifms.edu.br',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Senha de acesso',
    example: 'SenhaSegura123!',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
