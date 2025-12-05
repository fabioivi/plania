import { ApiProperty } from '@nestjs/swagger';

export class CredentialResponseModel {
  @ApiProperty({
    description: 'ID único da credencial',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Sistema acadêmico',
    example: 'ifms',
  })
  system: string;

  @ApiProperty({
    description: 'Nome de usuário',
    example: 'fabio.oliveira',
  })
  username: string;

  @ApiProperty({
    description: 'Indica se a credencial foi verificada',
    example: true,
  })
  isVerified: boolean;

  @ApiProperty({
    description: 'Data da última verificação',
    example: '2025-12-05T10:30:00Z',
    required: false,
  })
  lastVerifiedAt?: Date;

  @ApiProperty({
    description: 'Data do último teste',
    example: '2025-12-05T10:30:00Z',
    required: false,
  })
  lastTestedAt?: Date;

  @ApiProperty({
    description: 'Último erro encontrado',
    example: null,
    required: false,
  })
  lastError?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-12-05T10:30:00Z',
  })
  createdAt: Date;
}

export class DiaryModel {
  @ApiProperty({
    description: 'ID único do diário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID do diário no sistema IFMS',
    example: '79118',
  })
  externalId: string;

  @ApiProperty({
    description: 'Nome da disciplina',
    example: 'GERÊNCIA E CONFIGURAÇÕES DE SERVIÇOS DE INTERNET',
  })
  disciplina: string;

  @ApiProperty({
    description: 'Nome do curso',
    example: 'Técnico em Informática - Integrado',
  })
  curso: string;

  @ApiProperty({
    description: 'Código da turma',
    example: '20252055206B',
  })
  turma: string;

  @ApiProperty({
    description: 'Período letivo',
    example: '2025/2',
  })
  periodo: string;

  @ApiProperty({
    description: 'Quantidade de alunos aprovados',
    example: 0,
  })
  aprovados: number;

  @ApiProperty({
    description: 'Quantidade de alunos reprovados',
    example: 0,
  })
  reprovados: number;

  @ApiProperty({
    description: 'Quantidade de alunos em curso',
    example: 25,
  })
  emCurso: number;

  @ApiProperty({
    description: 'Indica se o diário está aprovado',
    example: false,
  })
  aprovado: boolean;

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-12-05T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-12-05T10:30:00Z',
  })
  updatedAt: Date;
}

export class SyncResponseModel {
  @ApiProperty({
    description: 'Indica se a sincronização foi enfileirada com sucesso',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensagem informativa',
    example: 'Diary sync has been queued. This may take a few moments.',
  })
  message: string;
}

export class TestResponseModel {
  @ApiProperty({
    description: 'Indica se o teste foi bem-sucedido',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensagem informativa',
    example: 'Credencial válida',
  })
  message: string;
}
