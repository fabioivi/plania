import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  SaveCredentialDto,
  TestCredentialDto,
} from './academic.dto';
import {
  CredentialResponseModel,
  TestResponseModel,
} from './academic.models';

// POST /academic/credentials
export function ApiSaveCredential(): MethodDecorator {
  return function (target: any, propertyKey: any, descriptor: any): void {
    ApiBearerAuth('JWT-auth')(target, propertyKey, descriptor);

    ApiOperation({
      summary: 'Salvar credencial acadêmica',
      description:
        'Salva ou atualiza as credenciais de acesso ao sistema acadêmico IFMS. A senha será criptografada antes de ser armazenada.',
    })(target, propertyKey, descriptor);

    ApiBody({
      type: SaveCredentialDto,
      description: 'Dados da credencial a ser salva',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: 201,
      description: 'Credencial salva com sucesso',
      type: CredentialResponseModel,
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: 400,
      description: 'Dados inválidos',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: 401,
      description: 'Não autenticado - Token JWT inválido ou ausente',
    })(target, propertyKey, descriptor);
  };
}

// GET /academic/credentials
export function ApiGetCredentials(): MethodDecorator {
  return function (target: any, propertyKey: any, descriptor: any): void {
    ApiBearerAuth('JWT-auth')(target, propertyKey, descriptor);

    ApiOperation({
      summary: 'Listar credenciais',
      description:
        'Retorna todas as credenciais acadêmicas do usuário autenticado',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: 200,
      description: 'Lista de credenciais',
      type: [CredentialResponseModel],
      isArray: true,
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: 401,
      description: 'Não autenticado',
    })(target, propertyKey, descriptor);
  };
}

// GET /academic/credentials/:id
export function ApiGetCredential(): MethodDecorator {
  return function (target: any, propertyKey: any, descriptor: any): void {
    ApiBearerAuth('JWT-auth')(target, propertyKey, descriptor);

    ApiOperation({
      summary: 'Buscar credencial específica',
      description: 'Retorna os detalhes de uma credencial específica',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'id',
      description: 'ID da credencial',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: 200,
      description: 'Credencial encontrada',
      type: CredentialResponseModel,
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: 404,
      description: 'Credencial não encontrada',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: 401,
      description: 'Não autenticado',
    })(target, propertyKey, descriptor);
  };
}

// POST /academic/credentials/:id/test
export function ApiTestCredential(): MethodDecorator {
  return function (target: any, propertyKey: any, descriptor: any): void {
    ApiBearerAuth('JWT-auth')(target, propertyKey, descriptor);

    ApiOperation({
      summary: 'Testar credencial',
      description:
        'Testa a conexão com o sistema acadêmico IFMS usando a credencial fornecida',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'id',
      description: 'ID da credencial a ser testada',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: 200,
      description: 'Teste realizado com sucesso',
      type: TestResponseModel,
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: 404,
      description: 'Credencial não encontrada',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: 401,
      description: 'Não autenticado',
    })(target, propertyKey, descriptor);
  };
}

// DELETE /academic/credentials/:id
export function ApiDeleteCredential(): MethodDecorator {
  return function (target: any, propertyKey: any, descriptor: any): void {
    ApiBearerAuth('JWT-auth')(target, propertyKey, descriptor);

    ApiOperation({
      summary: 'Remover credencial',
      description: 'Remove uma credencial acadêmica',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'id',
      description: 'ID da credencial a ser removida',
      type: String,
      example: '123e4567-e89b-12d3-a456-426614174000',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: 200,
      description: 'Credencial removida com sucesso',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: 404,
      description: 'Credencial não encontrada',
    })(target, propertyKey, descriptor);

    ApiResponse({
      status: 401,
      description: 'Não autenticado',
    })(target, propertyKey, descriptor);
  };
}
