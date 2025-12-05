import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { DiaryModel, SyncResponseModel } from './academic.models';
import { DiaryWithPlansModel, TeachingPlanModel } from './diary.models';

export function ApiSyncDiariesDecorator(): MethodDecorator {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Sincronizar diários de classe',
      description:
        'Inicia o processo de sincronização dos diários de classe do usuário a partir do sistema IFMS. Este processo é assíncrono e inclui a extração de todos os planos de ensino associados a cada diário.',
    }),
    ApiResponse({
      status: 200,
      description: 'Sincronização iniciada com sucesso',
      type: SyncResponseModel,
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
    }),
    ApiResponse({
      status: 404,
      description: 'Credencial acadêmica não encontrada',
    }),
  );
}

export function ApiGetDiariesDecorator(): MethodDecorator {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Listar diários de classe',
      description:
        'Retorna a lista de diários de classe sincronizados do usuário autenticado.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de diários retornada com sucesso',
      type: [DiaryModel],
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
    }),
  );
}

export function ApiGetDiaryDecorator(): MethodDecorator {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Obter diário específico',
      description:
        'Retorna os detalhes de um diário de classe específico do usuário autenticado.',
    }),
    ApiParam({
      name: 'id',
      description: 'ID do diário',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Diário retornado com sucesso',
      type: DiaryModel,
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
    }),
    ApiResponse({
      status: 404,
      description: 'Diário não encontrado',
    }),
  );
}

export function ApiGetDiaryTeachingPlansDecorator(): MethodDecorator {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Listar planos de ensino de um diário',
      description:
        'Retorna todos os planos de ensino associados a um diário específico, incluindo dados completos de identificação, ementa, objetivos, avaliações, cronograma e referências bibliográficas.',
    }),
    ApiParam({
      name: 'diaryId',
      description: 'ID do diário',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de planos de ensino retornada com sucesso',
      type: [TeachingPlanModel],
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
    }),
    ApiResponse({
      status: 404,
      description: 'Diário não encontrado',
    }),
  );
}

export function ApiGetDiaryWithPlansDecorator(): MethodDecorator {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Obter diário com planos de ensino',
      description:
        'Retorna os detalhes de um diário específico incluindo todos os seus planos de ensino associados.',
    }),
    ApiParam({
      name: 'diaryId',
      description: 'ID do diário',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Diário com planos retornado com sucesso',
      type: DiaryWithPlansModel,
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
    }),
    ApiResponse({
      status: 404,
      description: 'Diário não encontrado',
    }),
  );
}

export function ApiGetTeachingPlanDecorator(): MethodDecorator {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Obter plano de ensino específico',
      description:
        'Retorna os detalhes completos de um plano de ensino específico, incluindo ementa, objetivos, avaliações, cronograma e referências bibliográficas.',
    }),
    ApiParam({
      name: 'planId',
      description: 'ID do plano de ensino',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Plano de ensino retornado com sucesso',
      type: TeachingPlanModel,
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
    }),
    ApiResponse({
      status: 404,
      description: 'Plano de ensino não encontrado',
    }),
  );
}
