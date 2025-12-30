import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveCredentialDto {
  @ApiProperty({
    description: 'Sistema acadêmico (ifms ou suap)',
    example: 'ifms',
    enum: ['ifms', 'suap'],
  })
  @IsString()
  @IsNotEmpty()
  system: string;

  @ApiProperty({
    description: 'Nome de usuário do sistema acadêmico',
    example: 'fabio.oliveira',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Senha do sistema acadêmico (será criptografada)',
    example: 'senha123',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class TestCredentialDto {
  @ApiProperty({
    description: 'ID da credencial a ser testada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  credentialId: string;
}
