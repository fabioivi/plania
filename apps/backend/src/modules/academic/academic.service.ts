import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AcademicCredential } from './academic-credential.entity';
import { Diary } from './diary.entity';
import { DiaryContent } from './diary-content.entity';
import { TeachingPlan } from './teaching-plan.entity';
import { TeachingPlanHistory } from './teaching-plan-history.entity';
import { SaveCredentialDto } from './academic.dto';
import { CryptoService } from '../../common/services/crypto.service';
import { ExtractionUtils } from '../scraping/extraction.utils';
import { ScrapingService } from '../scraping/scraping.service';

@Injectable()
export class AcademicService {
  private readonly logger = new Logger(AcademicService.name);

  // Track last request time per user to implement rate limiting
  private lastRequestTime: Map<string, number> = new Map();
  private readonly MIN_REQUEST_INTERVAL = 0; // Minimum time between requests (0 = disabled)

  constructor(
    @InjectRepository(AcademicCredential)
    private credentialRepository: Repository<AcademicCredential>,
    @InjectRepository(Diary)
    private diaryRepository: Repository<Diary>,
    @InjectRepository(DiaryContent)
    private diaryContentRepository: Repository<DiaryContent>,
    @InjectRepository(TeachingPlan)
    private teachingPlanRepository: Repository<TeachingPlan>,
    @InjectRepository(TeachingPlanHistory)
    private teachingPlanHistoryRepository: Repository<TeachingPlanHistory>,
    private cryptoService: CryptoService,
    private scrapingService: ScrapingService,
    @InjectQueue('auth-queue') private authQueue: Queue,
  ) { }

  async saveCredential(userId: string, dto: SaveCredentialDto) {
    // Check if credential already exists
    const existing = await this.credentialRepository.findOne({
      where: { userId, system: dto.system },
    });

    // Encrypt the password
    const encrypted = this.cryptoService.encrypt(dto.password);

    if (existing) {
      // Update existing credential
      existing.username = dto.username;
      existing.passwordEncrypted = encrypted.encrypted;
      existing.passwordIv = encrypted.iv;
      existing.passwordAuthTag = encrypted.authTag;
      existing.isVerified = false; // Reset verification
      existing.lastVerifiedAt = null;

      await this.credentialRepository.save(existing);

      // Queue verification job
      await this.authQueue.add('verify-credential', {
        credentialId: existing.id,
      });

      return {
        id: existing.id,
        system: existing.system,
        username: existing.username,
        isVerified: existing.isVerified,
      };
    } else {
      // Create new credential
      const credential = this.credentialRepository.create({
        userId,
        system: dto.system,
        username: dto.username,
        passwordEncrypted: encrypted.encrypted,
        passwordIv: encrypted.iv,
        passwordAuthTag: encrypted.authTag,
        isVerified: false,
      });

      await this.credentialRepository.save(credential);

      // Queue verification job
      await this.authQueue.add('verify-credential', {
        credentialId: credential.id,
      });

      return {
        id: credential.id,
        system: credential.system,
        username: credential.username,
        isVerified: credential.isVerified,
      };
    }
  }

  async getCredentials(userId: string) {
    const credentials = await this.credentialRepository.find({
      where: { userId },
    });

    return credentials.map((cred) => ({
      id: cred.id,
      system: cred.system,
      username: cred.username,
      isVerified: cred.isVerified,
      lastVerifiedAt: cred.lastVerifiedAt,
      lastTestedAt: cred.lastTestedAt,
      lastError: cred.lastError,
      createdAt: cred.createdAt,
    }));
  }

  async getCredential(userId: string, credentialId: string) {
    const credential = await this.credentialRepository.findOne({
      where: { id: credentialId, userId },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    return {
      id: credential.id,
      system: credential.system,
      username: credential.username,
      isVerified: credential.isVerified,
      lastVerifiedAt: credential.lastVerifiedAt,
      lastTestedAt: credential.lastTestedAt,
      lastError: credential.lastError,
    };
  }

  async testCredential(userId: string, credentialId: string) {
    const credential = await this.credentialRepository.findOne({
      where: { id: credentialId, userId },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    // Queue test job and wait for result
    const job = await this.authQueue.add('test-credential', {
      credentialId: credential.id,
    });

    // Wait for job to complete (timeout 60 seconds)
    const result = await job.finished();

    // Reload credential to get updated status
    const updatedCredential = await this.credentialRepository.findOne({
      where: { id: credentialId },
    });

    return {
      success: result.success,
      isVerified: result.isValid,
      lastError: updatedCredential?.lastError || null,
      lastTestedAt: updatedCredential?.lastTestedAt || null,
    };
  }

  async deleteCredential(userId: string, credentialId: string) {
    const credential = await this.credentialRepository.findOne({
      where: { id: credentialId, userId },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    await this.credentialRepository.remove(credential);

    return { message: 'Credential deleted' };
  }

  // Internal method for queue processors to decrypt and use credentials
  async getDecryptedCredential(credentialId: string): Promise<{
    system: string;
    username: string;
    password: string;
  }> {
    const credential = await this.credentialRepository.findOne({
      where: { id: credentialId },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    // Decrypt password
    const decryptedPassword = this.cryptoService.decrypt({
      encrypted: credential.passwordEncrypted,
      iv: credential.passwordIv,
      authTag: credential.passwordAuthTag,
    });

    return {
      system: credential.system,
      username: credential.username,
      password: decryptedPassword,
    };
  }

  // Mark credential as verified
  async markAsVerified(
    credentialId: string,
    isVerified: boolean,
    errorMessage: string | null = null,
  ) {
    const credential = await this.credentialRepository.findOne({
      where: { id: credentialId },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    credential.isVerified = isVerified;
    credential.lastVerifiedAt = isVerified ? new Date() : null;
    credential.lastTestedAt = new Date();
    credential.lastError = errorMessage;

    await this.credentialRepository.save(credential);

    return credential;
  }

  // Sync diaries from IFMS (only diaries without closing date and not deleted)
  async syncDiaries(userId: string, diariesData: any[]) {
    const diariesToSave = [];

    for (const diaryData of diariesData) {
      // Skip deleted diaries (inside <del> tag)
      if (diaryData.excluido) {
        continue;
      }

      // Skip diaries that have a closing date (data de fechamento)
      if (diaryData.dataFechamento) {
        continue;
      }

      // Check if diary already exists
      let diary = await this.diaryRepository.findOne({
        where: {
          userId,
          externalId: diaryData.externalId
        },
      });

      // Parse dates from ISO string to Date objects
      const dataAbertura = diaryData.dataAbertura ? new Date(diaryData.dataAbertura) : null;
      const dataFechamento = diaryData.dataFechamento ? new Date(diaryData.dataFechamento) : null;

      if (diary) {
        // Update existing diary
        diary.disciplina = diaryData.disciplina;
        diary.curso = diaryData.curso;
        diary.turma = diaryData.turma;
        diary.periodo = diaryData.periodo;
        diary.aprovados = diaryData.aprovados;
        diary.reprovados = diaryData.reprovados;
        diary.emCurso = diaryData.emCurso;
        diary.aprovado = diaryData.aprovado;
        diary.dataAbertura = dataAbertura;
        diary.dataFechamento = dataFechamento;
        // Force update timestamp to show accurate last sync time even if data hasn't changed
        diary.updatedAt = new Date();
      } else {
        // Create new diary
        diary = this.diaryRepository.create({
          userId,
          externalId: diaryData.externalId,
          disciplina: diaryData.disciplina,
          curso: diaryData.curso,
          turma: diaryData.turma,
          periodo: diaryData.periodo,
          aprovados: diaryData.aprovados,
          reprovados: diaryData.reprovados,
          emCurso: diaryData.emCurso,
          aprovado: diaryData.aprovado,
          dataAbertura: dataAbertura,
          dataFechamento: dataFechamento,
        });
      }

      diariesToSave.push(diary);
    }

    if (diariesToSave.length > 0) {
      await this.diaryRepository.save(diariesToSave);
    }

    return {
      synced: diariesToSave.length,
      message: `${diariesToSave.length} diários sincronizados`,
    };
  }

  // Get user diaries
  async getUserDiaries(userId: string) {
    return this.diaryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // Sync teaching plans for a specific diary
  async syncTeachingPlans(
    userId: string,
    diaryId: string,
    diaryExternalId: string,
    plansData: any[],
  ) {
    const plansToSave = [];

    for (const planData of plansData) {
      // Check if plan already exists
      let plan = await this.teachingPlanRepository.findOne({
        where: {
          userId,
          externalId: planData.externalId
        },
      });

      if (plan) {
        // Update existing plan with ALL fields including new ones
        Object.assign(plan, {
          diaryId,
          status: planData.status,
          statusCoord: planData.statusCoord,
          excluido: planData.excluido || false,
          // Diary header metadata
          classeCompleta: planData.classeCompleta,
          unidadeCurricularCodigo: planData.unidadeCurricularCodigo,
          aulasNormaisCriadas: planData.aulasNormaisCriadas,
          duracaoAula: planData.duracaoAula,
          // Identification
          campus: planData.campus,
          anoSemestre: planData.anoSemestre,
          curso: planData.curso,
          unidadeCurricular: planData.unidadeCurricular,
          professores: planData.professores,
          cargaHorariaTotal: planData.cargaHorariaTotal,
          numSemanas: planData.numSemanas,
          numAulasTeorica: planData.numAulasTeorica,
          numAulasPraticas: planData.numAulasPraticas,
          // Content sections
          ementa: planData.ementa,
          objetivoGeral: planData.objetivoGeral,
          objetivosEspecificos: planData.objetivosEspecificos,
          avaliacaoAprendizagem: planData.avaliacaoAprendizagem,
          observacoesAvaliacoes: planData.observacoesAvaliacoes,
          recuperacaoAprendizagem: planData.recuperacaoAprendizagem,
          referencias: planData.referencias,
          propostaTrabalho: planData.propostaTrabalho,
        });
      } else {
        // Create new plan
        plan = this.teachingPlanRepository.create({
          userId,
          diaryId,
          externalId: planData.externalId,
          status: planData.status,
          statusCoord: planData.statusCoord,
          excluido: planData.excluido || false,
          // Diary header metadata
          classeCompleta: planData.classeCompleta,
          unidadeCurricularCodigo: planData.unidadeCurricularCodigo,
          aulasNormaisCriadas: planData.aulasNormaisCriadas,
          duracaoAula: planData.duracaoAula,
          // Identification
          campus: planData.campus,
          anoSemestre: planData.anoSemestre,
          curso: planData.curso,
          unidadeCurricular: planData.unidadeCurricular,
          professores: planData.professores,
          cargaHorariaTotal: planData.cargaHorariaTotal,
          numSemanas: planData.numSemanas,
          numAulasTeorica: planData.numAulasTeorica,
          numAulasPraticas: planData.numAulasPraticas,
          // Content sections
          ementa: planData.ementa,
          objetivoGeral: planData.objetivoGeral,
          objetivosEspecificos: planData.objetivosEspecificos,
          avaliacaoAprendizagem: planData.avaliacaoAprendizagem,
          observacoesAvaliacoes: planData.observacoesAvaliacoes,
          recuperacaoAprendizagem: planData.recuperacaoAprendizagem,
          referencias: planData.referencias,
          propostaTrabalho: planData.propostaTrabalho,
        });
      }

      // Store historico data for later sync (after plan is saved and has id)
      (plan as any)._historicoData = planData.historico;
      plansToSave.push(plan);
    }

    if (plansToSave.length > 0) {
      // Save plans first to get IDs
      const savedPlans = await this.teachingPlanRepository.save(plansToSave);

      // Now sync history entries (after plans have IDs)
      for (const plan of savedPlans) {
        const historicoData = (plan as any)._historicoData;
        if (historicoData && Array.isArray(historicoData)) {
          await this.syncTeachingPlanHistory(plan.id, historicoData);
        }
      }
    }

    return plansToSave.length;
  }

  // Sync teaching plan history entries
  private async syncTeachingPlanHistory(
    teachingPlanId: string,
    historicoData: any[],
  ) {
    if (!historicoData || historicoData.length === 0) return;

    const historyToSave = [];

    for (const entry of historicoData) {
      // Check if history entry already exists
      const existing = await this.teachingPlanHistoryRepository.findOne({
        where: {
          teachingPlanId,
          eventId: entry.eventId,
        },
      });

      if (existing) {
        // Update existing entry
        Object.assign(existing, {
          situacao: entry.situacao,
          observacoes: entry.observacoes,
          usuario: entry.usuario,
          dataEvento: ExtractionUtils.parseBRDate(entry.dataEvento),
        });
        historyToSave.push(existing);
      } else {
        // Create new entry
        const historyEntry = this.teachingPlanHistoryRepository.create({
          teachingPlanId,
          eventId: entry.eventId,
          situacao: entry.situacao,
          observacoes: entry.observacoes,
          usuario: entry.usuario,
          dataEvento: ExtractionUtils.parseBRDate(entry.dataEvento),
        });
        historyToSave.push(historyEntry);
      }
    }

    if (historyToSave.length > 0) {
      await this.teachingPlanHistoryRepository.save(historyToSave);
    }
  }

  // Get teaching plans for a diary
  async getDiaryTeachingPlans(userId: string, diaryId: string) {
    return this.teachingPlanRepository.find({
      where: { userId, diaryId },
      order: { createdAt: 'DESC' },
    });
  }

  // Get a specific teaching plan by ID
  async getTeachingPlan(userId: string, planId: string) {
    const plan = await this.teachingPlanRepository.findOne({
      where: { id: planId, userId },
    });

    if (!plan) {
      throw new NotFoundException('Teaching plan not found');
    }

    return plan;
  }

  // Sync diary content (class content from diary page)
  async syncDiaryContent(userId: string, diaryId: string, payload: { content: any[], metadata?: any }) {
    const { content: contentData, metadata } = payload;

    console.log(`🔄 Sincronizando conteúdo do diário ${diaryId}: ${contentData.length} itens recebidos`);

    // Update Diary Metadata if available
    if (metadata) {
      try {
        const diary = await this.diaryRepository.findOne({ where: { id: diaryId, userId } });
        if (diary) {
          console.log(`📝 Atualizando metadados do diário ${diaryId} com base no conteúdo scrapeado`);
          if (metadata.code && metadata.name) {
            diary.disciplina = `${metadata.code} - ${metadata.name}`;
          }
          if (metadata.turma) {
            diary.turma = metadata.turma;
          }
          if (metadata.cargaHorariaRelogio) {
            diary.cargaHorariaRelogio = metadata.cargaHorariaRelogio;
          }
          if (metadata.cargaHorariaAulas) {
            diary.cargaHorariaAulas = metadata.cargaHorariaAulas;
          }
          await this.diaryRepository.save(diary);
        }
      } catch (error) {
        console.error('Erro ao atualizar metadados do diário:', error);
      }
    }

    const contentsToSave: DiaryContent[] = [];
    let skippedCount = 0;

    for (const item of contentData) {
      // Parse and validate date
      const parsedDate = ExtractionUtils.parseBRDateSimple(item.date);
      if (!parsedDate) {
        console.warn(`⚠️ Data inválida ignorada: "${item.date}" (contentId: ${item.contentId})`);
        skippedCount++;
        continue; // Skip this item if date is invalid
      }

      // Parse original date if present
      let parsedOriginalDate: Date | null = null;
      if (item.originalDate) {
        parsedOriginalDate = ExtractionUtils.parseBRDateSimple(item.originalDate);
        if (!parsedOriginalDate) {
          console.warn(`⚠️ Data original inválida: "${item.originalDate}" (contentId: ${item.contentId})`);
        }
      }

      // Check if content already exists by contentId
      const existing = await this.diaryContentRepository.findOne({
        where: {
          diaryId,
          contentId: item.contentId,
        },
      });

      if (existing) {
        // Update existing content
        console.log(`🔄 Atualizando conteúdo existente: ${item.contentId}`);
        Object.assign(existing, {
          obsId: item.obsId,
          date: parsedDate,
          timeRange: item.timeRange,
          type: item.type,
          isNonPresential: item.isNonPresential,
          content: item.content,
          observations: item.observations,
          isAntecipation: item.isAntecipation,
          originalContentId: item.originalContentId,
          originalDate: parsedOriginalDate,
        });
        contentsToSave.push(existing);
      } else {
        // Create new content
        console.log(`➕ Criando novo conteúdo: ${item.contentId}`);
        const content = this.diaryContentRepository.create({
          diaryId,
          contentId: item.contentId,
          obsId: item.obsId,
          date: parsedDate,
          timeRange: item.timeRange,
          type: item.type,
          isNonPresential: item.isNonPresential,
          content: item.content,
          observations: item.observations,
          isAntecipation: item.isAntecipation,
          originalContentId: item.originalContentId,
          originalDate: parsedOriginalDate,
        });

        // Double-check date is valid before adding to save list
        if (!content.date || isNaN(content.date.getTime())) {
          console.error(`❌ ERRO: Conteúdo criado com data inválida!`, {
            contentId: content.contentId,
            parsedDate,
            itemDate: item.date,
            resultingDate: content.date,
          });
          skippedCount++;
          continue;
        }

        contentsToSave.push(content);
      }
    }

    if (contentsToSave.length > 0) {
      // Validate all items before saving
      const invalidItems = contentsToSave.filter(item => !item.date || isNaN(item.date.getTime()));
      if (invalidItems.length > 0) {
        console.error('❌ Itens com data inválida detectados antes de salvar:');
        invalidItems.forEach(item => {
          console.error(`  - contentId: ${item.contentId}, date: ${item.date}, raw: ${JSON.stringify(item)}`);
        });
        throw new Error(`Encontrados ${invalidItems.length} itens com data inválida`);
      }

      console.log(`💾 Salvando ${contentsToSave.length} conteúdos no banco de dados...`);
      await this.diaryContentRepository.save(contentsToSave);
      console.log(`✅ ${contentsToSave.length} conteúdos salvos com sucesso`);
    }

    if (skippedCount > 0) {
      console.log(`⚠️ ${skippedCount} registro(s) ignorado(s) por data inválida`);
    }

    // Contar apenas aulas não-antecipação (para não duplicar contagem)
    const realClassesCount = contentsToSave.filter(item => !item.isAntecipation).length;
    const anticipationsCount = contentsToSave.filter(item => item.isAntecipation).length;

    console.log(`📊 Total: ${realClassesCount} aulas + ${anticipationsCount} antecipações`);

    return {
      synced: contentsToSave.length,
      realClasses: realClassesCount,
      anticipations: anticipationsCount,
      skipped: skippedCount,
    };
  }

  // Get diary content
  async getDiaryContent(userId: string, diaryId: string) {
    // Verify diary belongs to user
    const diary = await this.diaryRepository.findOne({
      where: { id: diaryId, userId },
    });

    if (!diary) {
      throw new NotFoundException('Diary not found');
    }

    return this.diaryContentRepository.find({
      where: { diaryId },
      order: { date: 'ASC', timeRange: 'ASC' },
    });
  }

  /**
   * Get diary content statistics
   * Returns count of real classes (excluding anticipations)
   */
  async getDiaryContentStats(userId: string, diaryId: string) {
    // Verify diary belongs to user
    const diary = await this.diaryRepository.findOne({
      where: { id: diaryId, userId },
    });

    if (!diary) {
      throw new NotFoundException('Diary not found');
    }

    const allContent = await this.diaryContentRepository.find({
      where: { diaryId },
    });

    const realClasses = allContent.filter(item => !item.isAntecipation).length;
    const anticipations = allContent.filter(item => item.isAntecipation).length;

    return {
      total: allContent.length,
      realClasses,
      anticipations,
    };
  }

  // Find diary by ID (for partial sync)
  async findDiaryById(userId: string, diaryId: string): Promise<Diary | null> {
    return await this.diaryRepository.findOne({
      where: { id: diaryId, userId },
    });
  }

  // Find teaching plan by ID (for partial sync)
  async findTeachingPlanById(userId: string, planId: string): Promise<TeachingPlan | null> {
    return await this.teachingPlanRepository.findOne({
      where: { id: planId },
      relations: ['diary'],
    });
  }

  // Update teaching plan (for partial sync)
  async updateTeachingPlan(planId: string, data: Partial<TeachingPlan>): Promise<TeachingPlan> {
    await this.teachingPlanRepository.update(planId, data);
    return await this.teachingPlanRepository.findOne({ where: { id: planId } });
  }

  /**
   * Save an AI-generated teaching plan
   */
  async saveAIGeneratedTeachingPlan(
    userId: string,
    diaryId: string,
    generatedPlan: any,
    basePlanId?: string,
    targetExternalId?: string,
  ): Promise<TeachingPlan> {
    // Verify diary exists and belongs to user
    const diary = await this.diaryRepository.findOne({
      where: { id: diaryId, userId },
    });

    if (!diary) {
      throw new NotFoundException('Diário não encontrado');
    }

    let basePlan: TeachingPlan | null = null;
    if (basePlanId) {
      basePlan = await this.teachingPlanRepository.findOne({
        where: { id: basePlanId, userId },
      });
      if (!basePlan) {
        throw new NotFoundException('Plano base não encontrado');
      }
    }

    // Determine if we are updating an existing plan (by externalId) or creating a new one
    let planToSave: TeachingPlan | undefined;

    if (targetExternalId) {
      // Check if a plan with this externalId already exists
      const existingPlan = await this.teachingPlanRepository.findOne({
        where: { externalId: targetExternalId },
      });

      if (existingPlan) {
        // Validation: Verify ownership
        if (existingPlan.userId !== userId) {
          throw new BadRequestException('O ID externo informado pertence a um plano de outro usuário.');
        }
        // Validation: Verify diary relationship (optional but good practice)
        if (existingPlan.diaryId !== diaryId) {
          // It might be possible to move a plan between diaries? Unlikely for IFMS.
          // But let's warn or block if contexts differ drastically.
          // For now, let's assume if it matches userId it's fair game to overwrite/update.
        }

        this.logger.log(`🔄 Atualizando plano existente (External ID: ${targetExternalId}) com conteúdo de IA`);
        planToSave = existingPlan;
      }
    }

    // Prepare data structure
    const planData: Partial<TeachingPlan> = {
      userId,
      diaryId,
      source: 'ai', // Mark as AI-generated/modified
      basePlanId: basePlanId || (planToSave?.basePlanId) || null,
      sentToIFMS: false, // Reset sent status as content changed
      status: 'Gerado por IA - Rascunho',
      excluido: false,
      externalId: targetExternalId || null, // Set the requested external ID

      // Copy identification fields from base plan or diary
      campus: basePlan?.campus || diary.curso,
      anoSemestre: basePlan?.anoSemestre || (diary.anoLetivo ? `${diary.anoLetivo}${diary.semestre ? `.${diary.semestre}` : ''}` : null),
      curso: basePlan?.curso || diary.curso,
      unidadeCurricular: basePlan?.unidadeCurricular || diary.disciplina,
      cargaHorariaTotal: basePlan?.cargaHorariaTotal || (diary.cargaHorariaRelogio || null),

      // Copy static fields from base plan (ementa, referencias)
      ementa: basePlan?.ementa || null,
      referencias: basePlan?.referencias || null,

      // AI-generated fields
      objetivoGeral: generatedPlan.objetivoGeral,
      objetivosEspecificos: generatedPlan.objetivosEspecificos,
      avaliacaoAprendizagem: generatedPlan.avaliacaoAprendizagem || [],
      recuperacaoAprendizagem: generatedPlan.recuperacaoAprrendizagem || generatedPlan.recuperacaoAprendizagem || '',

      // Copy quantity of classes from base plan (don't calculate, just copy)
      numSemanas: basePlan?.numSemanas || null,
      numAulasTeorica: basePlan?.numAulasTeorica || null,
      numAulasPraticas: basePlan?.numAulasPraticas || null,

      // Map propostaTrabalho from AI schema to entity schema
      propostaTrabalho: (generatedPlan.propostaTrabalho || []).map((item: any) => {
        // Extract month from dataInicial (format: "02/03/2025" or "02/03")
        const dataInicial = item.dataInicial || '';
        const dataFinal = item.dataFinal || '';

        let monthNumber = 1;
        const parts = dataInicial.split('/');
        if (parts.length >= 2) {
          // parts[0] is day, parts[1] is month
          monthNumber = parseInt(parts[1], 10);
        }

        const monthNames = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        // Ensure valid month
        if (monthNumber < 1 || monthNumber > 12) monthNumber = 1;

        const mes = `${monthNumber} - ${monthNames[monthNumber - 1]}`;

        // Build periodo from dataInicial and dataFinal (ex: "02 a 08")
        const dayInicial = dataInicial.split('/')[0] || '';
        const dayFinal = dataFinal.split('/')[0] || '';
        const periodo = `${dayInicial} a ${dayFinal}`;

        // Join arrays into comma-separated strings for metodologia
        const tecnicas = Array.isArray(item.tecnicasEnsino) ? item.tecnicasEnsino.join(', ') : '';
        const recursos = Array.isArray(item.recursosEnsino) ? item.recursosEnsino.join(', ') : '';

        return {
          mes,
          periodo,
          numAulas: String(item.numAulas || 0),
          observacoes: null,
          conteudo: item.tema || null, // Usa apenas o tema, não o conteúdo detalhado
          metodologia: tecnicas, // tecnicasEnsino como metodologia
          tecnicasEnsino: item.tecnicasEnsino || [],
          recursosEnsino: item.recursosEnsino || [],
        };
      }),
    };

    if (planToSave) {
      // Update existing plan
      Object.assign(planToSave, planData);
      return await this.teachingPlanRepository.save(planToSave);
    } else {
      // Create new plan
      const newPlan = this.teachingPlanRepository.create(planData);
      return await this.teachingPlanRepository.save(newPlan);
    }
  }

  /**
   * Delete a teaching plan (AI-generated plans only)
   */
  async deleteTeachingPlan(userId: string, planId: string): Promise<void> {
    // Find the teaching plan
    const plan = await this.teachingPlanRepository.findOne({
      where: { id: planId },
      relations: ['diary'],
    });

    if (!plan) {
      throw new NotFoundException('Plano de ensino não encontrado');
    }

    // Verify the plan belongs to a diary of this user
    if (plan.diary.userId !== userId) {
      throw new BadRequestException('Plano não pertence a este usuário');
    }

    // Only allow deletion of AI-generated plans
    if (plan.source !== 'ai') {
      throw new BadRequestException('Apenas planos gerados por IA podem ser excluídos. Planos do IFMS devem ser gerenciados no sistema acadêmico.');
    }


    // Delete the plan
    await this.teachingPlanRepository.remove(plan);
  }

  /**
   * Delete all academic data (diaries and teaching plans) for a user
   * Keeps credentials intact
   */
  async deleteAllData(userId: string): Promise<void> {
    this.logger.log(`⚠️ Deletando todos os dados acadêmicos do usuário ${userId}`);

    // 1. Get all user diaries to find related contents
    const diaries = await this.diaryRepository.find({
      where: { userId },
      select: ['id'],
    });
    const diaryIds = diaries.map(d => d.id);

    // 2. Get all user teaching plans to find related history
    const plans = await this.teachingPlanRepository.find({
      where: { userId },
      select: ['id'],
    });
    const planIds = plans.map(p => p.id);

    // 3. Delete Teaching Plan History
    if (planIds.length > 0) {
      const historyDeleteResult = await this.teachingPlanHistoryRepository
        .createQueryBuilder()
        .delete()
        .where('teaching_plan_id IN (:...planIds)', { planIds })
        .execute();
      this.logger.log(`- Histórico de planos excluídos: ${historyDeleteResult.affected}`);
    }

    // 4. Delete Teaching Plans
    if (planIds.length > 0) {
      const plansDeleteResult = await this.teachingPlanRepository.delete({ userId });
      this.logger.log(`- Planos de ensino excluídos: ${plansDeleteResult.affected}`);
    }

    // 5. Delete Diary Contents
    if (diaryIds.length > 0) {
      const contentsDeleteResult = await this.diaryContentRepository
        .createQueryBuilder()
        .delete()
        .where('diary_id IN (:...diaryIds)', { diaryIds })
        .execute();
      this.logger.log(`- Conteúdos de diário excluídos: ${contentsDeleteResult.affected}`);
    }

    // 6. Delete Diaries
    if (diaryIds.length > 0) {
      const diariesDeleteResult = await this.diaryRepository.delete({ userId });
      this.logger.log(`- Diários excluídos: ${diariesDeleteResult.affected}`);
    }

    this.logger.log(`✅ Dados acadêmicos removidos com sucesso para o usuário ${userId}`);
  }


  /**
   * Send a teaching plan to IFMS via scraping
   */
  /**
   * Queue a teaching plan to be filled in IFMS (background job)
   */
  async queueTeachingPlanFilling(userId: string, planId: string): Promise<{ success: boolean; message: string }> {
    // Basic validation before queuing
    const plan = await this.teachingPlanRepository.findOne({
      where: { id: planId, userId },
      relations: ['diary'],
    });

    if (!plan) {
      throw new NotFoundException('Plano de ensino não encontrado');
    }

    // Add to queue
    await this.authQueue.add('fill-teaching-plan', {
      userId,
      planId,
    });

    return {
      success: true,
      message: 'O preenchimento do plano foi iniciado em segundo plano. Acompanhe o progresso na tela.',
    };
  }

  /**
   * Send a teaching plan to IFMS via scraping
   * NOW accepts an onProgress callback for real-time updates
   */
  async sendTeachingPlanToIFMS(
    userId: string,
    planId: string,
    onProgress?: (message: string) => void,
  ): Promise<{ success: boolean; message?: string }> {
    this.logger.log(`🚀 [sendTeachingPlanToIFMS] INÍCIO - userId: ${userId}, planId: ${planId}`);

    if (onProgress) onProgress('Iniciando processo de envio...');

    this.logger.log(`📖 [Step 1/7] Buscando plano de ensino...`);
    const plan = await this.teachingPlanRepository.findOne({
      where: { id: planId, userId },
      relations: ['diary'],
    });
    this.logger.log(`✅ [Step 1/7] Plano encontrado: ${plan ? 'SIM' : 'NÃO'}`);

    if (!plan) {
      throw new NotFoundException('Plano de ensino não encontrado');
    }

    if (!plan.diary) {
      this.logger.error(`Plan ${planId} has no associated diary`);
      return {
        success: false,
        message: 'Erro: Plano de ensino não está associado a um diário'
      };
    }

    if (!plan.diary.externalId) {
      this.logger.error(`Diary for plan ${planId} has no externalId`);
      return {
        success: false,
        message: 'Erro: Diário não possui ID externo do IFMS'
      };
    }

    if (!plan.externalId) {
      this.logger.error(`Plan ${planId} has no externalId`);
      return {
        success: false,
        message: 'Erro: Plano não possui ID externo do IFMS. Use apenas planos sincronizados do IFMS.'
      };
    }


    this.logger.log(`🔐 [Step 2/7] Buscando credenciais IFMS (system: 'ifms')...`);
    if (onProgress) onProgress('Buscando credenciais...');

    // Get user IFMS credentials (same pattern as sendDiaryContentToSystem)
    const credential = await this.credentialRepository.findOne({
      where: { userId, system: 'ifms' },
    });
    this.logger.log(`✅ [Step 2/7] Credencial encontrada: ${credential ? 'SIM (id: ' + credential.id + ')' : 'NÃO'}`);

    if (!credential) {
      return {
        success: false,
        message: 'Credenciais IFMS não encontradas. Configure suas credenciais IFMS primeiro.'
      };
    }

    this.logger.log(`🔓 [Step 3/7] Descriptografando senha...`);
    // Decrypt password (same pattern as sendDiaryContentToSystem)
    const password = this.cryptoService.decrypt({
      encrypted: credential.passwordEncrypted,
      iv: credential.passwordIv,
      authTag: credential.passwordAuthTag,
    });
    this.logger.log(`✅ [Step 3/7] Senha descriptografada: ${password ? 'SIM' : 'NÃO'}`);

    // Validate decrypted credentials
    if (!credential.username || !password) {
      this.logger.error('Credentials validation failed: username or password is empty');
      return {
        success: false,
        message: 'Erro: Credenciais descriptografadas estão vazias'
      };
    }

    this.logger.log(`✅ [Step 4/7] Validação de credenciais passou`);
    // Log credential info for debugging (mask username for security)
    const maskedUsername = credential.username.substring(0, 3) + '***' + credential.username.substring(credential.username.length - 2);
    this.logger.log(`📋 [Step 5/7] Usando credenciais IFMS - username: ${maskedUsername}, system: ${credential.system}`);
    this.logger.log(`📊 [Step 5/7] Detalhes do plano - diaryId: ${plan.diary.externalId}, planId: ${plan.externalId}`);
    this.logger.log(`📝 [Step 5/7] Objetivo Geral presente: ${plan.objetivoGeral ? 'SIM' : 'NÃO'}`);

    this.logger.log(`💾 [Step 6/7] Atualizando status do plano...`);
    if (onProgress) onProgress('Atualizando status para envio...');

    // Update status to processing
    plan.status = 'Enviando para o IFMS...';
    await this.teachingPlanRepository.save(plan);
    this.logger.log(`✅ [Step 6/7] Status atualizado para 'Enviando para o IFMS...'`);

    try {
      this.logger.log(`🌐 [Step 7/7] Chamando scraping service...`);
      this.logger.log(`📤 Parâmetros: username=${maskedUsername}, diaryId=${plan.diary.externalId}, planId=${plan.externalId}`);

      // Call scraping service to fill the plan
      const result = await this.scrapingService.fillTeachingPlan(
        credential.username,
        password,  // Use local variable, not credential.password
        plan.diary.externalId, // diaryId in IFMS
        plan.externalId,     // planId in IFMS
        plan, // Pass the whole entity, the service will pick fields
        onProgress, // Pass the callback
      );

      if (result.success) {
        // If success, proceed to fill the proposal (Detalhamento da Proposta de Trabalho)
        if (plan.propostaTrabalho && plan.propostaTrabalho.length > 0) {
          this.logger.log(`🌐 [Step 7.1/7] Preenchendo proposta de trabalho...`);
          if (onProgress) onProgress('Preenchendo proposta de trabalho...');

          const proposalResult = await this.scrapingService.fillTeachingPlanProposal(
            credential.username,
            password,
            plan.diary.externalId,
            plan.externalId,
            plan.propostaTrabalho
          );

          if (!proposalResult.success) {
            this.logger.warn(`⚠️ Erro ao preencher proposta: ${proposalResult.message}`);
            // We consider the main plan filling a success, but warn about proposal
            result.message += `. Proposta não preenchida: ${proposalResult.message}`;
          } else {
            this.logger.log(`✅ Proposta de trabalho preenchida com sucesso`);
          }
        }

        plan.status = 'Sincronizado com Sucesso (Rascunho)';
        plan.sentToIFMS = true;
        plan.sentAt = new Date();
        await this.teachingPlanRepository.save(plan);
        this.logger.log(`✅ Plan ${planId} sent successfully to IFMS`);
        return { success: true, message: 'Plano e proposta preenchidos com sucesso no IFMS!' };
      } else {
        plan.status = 'Erro na Sincronização';
        await this.teachingPlanRepository.save(plan);
        this.logger.error(`❌ Failed to send plan ${planId}: ${result.message}`);
        return {
          success: false,
          message: result.message || 'Falha ao preencher plano no IFMS'
        };
      }

    } catch (error) {
      this.logger.error(`❌ Exception while sending plan ${planId}: ${error.message}`, error.stack);
      plan.status = 'Erro na Sincronização';
      await this.teachingPlanRepository.save(plan);

      // Return specific error message instead of throwing
      return {
        success: false,
        message: `Erro ao enviar plano: ${error.message}`
      };
    }
  }



  /**
   * Gera conteúdo do diário baseado no plano de ensino
   */
  async generateDiaryContentFromPlan(userId: string, diaryId: string, teachingPlanId: string) {
    // Buscar o diário e o plano de ensino
    const diary = await this.diaryRepository.findOne({
      where: { id: diaryId, userId },
    });

    if (!diary) {
      throw new NotFoundException('Diário não encontrado');
    }

    const teachingPlan = await this.teachingPlanRepository.findOne({
      where: { id: teachingPlanId, diaryId },
    });

    if (!teachingPlan) {
      throw new NotFoundException('Plano de ensino não encontrado para este diário');
    }

    // Buscar conteúdos já existentes do diário (para pegar IDs e datas)
    const existingContents = await this.diaryContentRepository.find({
      where: { diaryId },
      order: { date: 'ASC', timeRange: 'ASC' },
    });

    // Filtrar conteúdos: remover aulas canceladas que têm antecipação
    // (porque antecipação + aula cancelada = 1 aula só no plano)
    const contentsForMapping = existingContents.filter(content => {
      // Se for antecipação, incluir
      if (content.isAntecipation) {
        return true;
      }

      // Se for aula normal, verificar se NÃO tem antecipação correspondente
      const hasAnticipation = existingContents.some(
        c => c.isAntecipation && c.originalContentId === content.contentId
      );

      // Incluir apenas se NÃO tem antecipação (senão é uma aula cancelada)
      return !hasAnticipation;
    });

    // Gerar conteúdo baseado na proposta de trabalho do plano
    const generatedContents = [];

    if (teachingPlan.propostaTrabalho && Array.isArray(teachingPlan.propostaTrabalho)) {
      let contentIndex = 0;

      for (const proposta of teachingPlan.propostaTrabalho) {
        const numAulas = parseInt(proposta.numAulas) || 0;

        for (let i = 0; i < numAulas && contentIndex < contentsForMapping.length; i++) {
          const existingContent = contentsForMapping[contentIndex];

          // Criar conteúdo gerado mantendo data/horário/tipo do conteúdo existente
          const generatedContent = {
            id: existingContent.id,
            contentId: existingContent.contentId,
            obsId: existingContent.obsId,
            date: existingContent.date,
            timeRange: existingContent.timeRange,
            type: existingContent.type,
            isNonPresential: existingContent.isNonPresential,
            isAntecipation: existingContent.isAntecipation,
            originalContentId: existingContent.originalContentId,
            originalDate: existingContent.originalDate,
            // Conteúdo gerado a partir do plano
            content: proposta.conteudo || '',
            observations: proposta.observacoes || '',
          };

          generatedContents.push(generatedContent);

          // Se esta é uma antecipação, também gerar para a aula cancelada original
          if (existingContent.isAntecipation && existingContent.originalContentId) {
            const originalContent = existingContents.find(
              c => c.contentId === existingContent.originalContentId
            );

            if (originalContent) {
              generatedContents.push({
                id: originalContent.id,
                contentId: originalContent.contentId,
                obsId: originalContent.obsId,
                date: originalContent.date,
                timeRange: originalContent.timeRange,
                type: originalContent.type,
                isNonPresential: originalContent.isNonPresential,
                isAntecipation: originalContent.isAntecipation,
                originalContentId: originalContent.originalContentId,
                originalDate: originalContent.originalDate,
                // Mesmo conteúdo da antecipação
                content: proposta.conteudo || '',
                observations: proposta.observacoes || '',
              });
            }
          }

          contentIndex++;
        }
      }
    }

    return {
      success: true,
      generatedCount: generatedContents.length,
      contents: generatedContents,
      diary: {
        id: diary.id,
        disciplina: diary.disciplina,
        turma: diary.turma,
      },
      teachingPlan: {
        id: teachingPlan.id,
        unidadeCurricular: teachingPlan.unidadeCurricular,
      },
    };
  }

  /**
   * Salva múltiplos conteúdos do diário de uma vez
   */
  async saveDiaryContentBulk(userId: string, diaryId: string, contents: any[]) {
    // Verificar se o diário pertence ao usuário
    const diary = await this.diaryRepository.findOne({
      where: { id: diaryId, userId },
    });

    if (!diary) {
      throw new NotFoundException('Diário não encontrado');
    }

    const savedContents = [];

    // Criar um mapa de conteúdos por contentId para facilitar lookup
    const contentsByContentId = new Map<string, any>();
    for (const contentData of contents) {
      if (contentData.contentId) {
        contentsByContentId.set(contentData.contentId, contentData);
      }
    }

    for (const contentData of contents) {
      // Buscar conteúdo existente pelo ID
      const existing = await this.diaryContentRepository.findOne({
        where: { id: contentData.id, diaryId },
      });

      if (existing) {
        // Atualizar conteúdo existente
        Object.assign(existing, {
          content: contentData.content,
          observations: contentData.observations,
        });
        const saved = await this.diaryContentRepository.save(existing);
        savedContents.push(saved);

        // Se este é um conteúdo de antecipação, copiar para a aula cancelada original
        if (existing.isAntecipation && existing.originalContentId) {
          // Buscar a aula cancelada original
          const originalContent = await this.diaryContentRepository.findOne({
            where: {
              diaryId,
              contentId: existing.originalContentId
            },
          });

          if (originalContent) {
            // Copiar o conteúdo e observações para a aula original
            Object.assign(originalContent, {
              content: contentData.content,
              observations: contentData.observations,
            });
            await this.diaryContentRepository.save(originalContent);
            console.log(`Conteúdo da antecipação ${existing.contentId} copiado para aula original ${originalContent.contentId}`);
          }
        }
      }
    }

    return {
      success: true,
      savedCount: savedContents.length,
      contents: savedContents,
    };
  }

  /**
   * Send diary content to IFMS academic system
   */
  async sendDiaryContentToSystem(
    userId: string,
    diaryId: string,
    contentId: string,
  ): Promise<{ success: boolean; message?: string }> {
    // Rate limiting: Check if user is making requests too frequently
    const now = Date.now();
    const lastRequest = this.lastRequestTime.get(userId);

    if (lastRequest) {
      const timeSinceLastRequest = now - lastRequest;
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`⏳ Rate limiting: aguardando ${waitTime}ms antes de enviar...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Update last request time
    this.lastRequestTime.set(userId, Date.now());

    // Get diary to verify ownership
    const diary = await this.diaryRepository.findOne({
      where: { id: diaryId, userId },
    });

    if (!diary) {
      throw new NotFoundException('Diário não encontrado');
    }

    // Get diary content
    const diaryContent = await this.diaryContentRepository.findOne({
      where: { diaryId, contentId },
    });

    if (!diaryContent) {
      throw new NotFoundException('Conteúdo do diário não encontrado');
    }

    // Get user credentials
    const credential = await this.credentialRepository.findOne({
      where: { userId, system: 'IFMS' },
    });

    if (!credential) {
      throw new NotFoundException('Credenciais IFMS não encontradas');
    }

    // Decrypt password
    const password = this.cryptoService.decrypt({
      encrypted: credential.passwordEncrypted,
      iv: credential.passwordIv,
      authTag: credential.passwordAuthTag,
    });

    console.log(`📤 Enviando conteúdo ${contentId} para o sistema IFMS...`);

    // Send content to system
    const result = await this.scrapingService.sendDiaryContentToSystem(
      credential.username,
      password,
      contentId,
      diaryContent.content || '',
    );

    return result;
  }

  /**
   * Send multiple diary contents to IFMS academic system with SSE progress
   */
  async sendDiaryContentBulkToSystemSSE(
    userId: string,
    diaryId: string,
    contentIds: string[],
  ): Promise<{
    stream: any;
  }> {
    const { PassThrough } = require('stream');
    const stream = new PassThrough();

    // Execute async and stream progress
    setImmediate(async () => {
      try {
        const result = await this.sendDiaryContentBulkToSystem(
          userId,
          diaryId,
          contentIds,
          (current: number, total: number, contentId: string, success: boolean, message: string) => {
            stream.write(`data: ${JSON.stringify({
              type: 'progress',
              current,
              total,
              contentId,
              success,
              message,
            })}\n\n`);
          },
        );

        stream.write(`data: ${JSON.stringify({
          type: 'complete',
          ...result,
        })}\n\n`);
        stream.end();
      } catch (error) {
        stream.write(`data: ${JSON.stringify({
          type: 'error',
          message: error.message,
        })}\n\n`);
        stream.end();
      }
    });

    return { stream };
  }

  /**
   * Send multiple diary contents to IFMS academic system (batch operation)
   */
  async sendDiaryContentBulkToSystem(
    userId: string,
    diaryId: string,
    contentIds: string[],
    onProgress?: (current: number, total: number, contentId: string, success: boolean, message: string) => void,
  ): Promise<{
    success: boolean;
    total: number;
    succeeded: number;
    failed: number;
    results: Array<{
      contentId: string;
      success: boolean;
      message?: string;
    }>;
  }> {
    const results = [];
    let succeeded = 0;
    let failed = 0;

    console.log(`📦 Enviando ${contentIds.length} conteúdos em lote...`);
    console.log(`🔍 Buscando credenciais para userId: ${userId}`);

    // Get diary to verify ownership (once)
    const diary = await this.diaryRepository.findOne({
      where: { id: diaryId, userId },
    });

    if (!diary) {
      throw new NotFoundException('Diário não encontrado');
    }

    // Get user credentials (once) - try both uppercase and lowercase
    let credential = await this.credentialRepository.findOne({
      where: { userId, system: 'IFMS' },
    });

    // If not found, try lowercase
    if (!credential) {
      console.log(`⚠️ Credenciais não encontradas com 'IFMS', tentando 'ifms'...`);
      credential = await this.credentialRepository.findOne({
        where: { userId, system: 'ifms' },
      });
    }

    // If still not found, list all credentials for debugging
    if (!credential) {
      const allCredentials = await this.credentialRepository.find({
        where: { userId },
      });
      console.error(`❌ Nenhuma credencial IFMS encontrada para o usuário ${userId}`);
      console.error(`📋 Credenciais disponíveis:`, allCredentials.map(c => ({ system: c.system, username: c.username })));
      throw new NotFoundException('Credenciais IFMS não encontradas');
    }

    // Decrypt password (once)
    const password = this.cryptoService.decrypt({
      encrypted: credential.passwordEncrypted,
      iv: credential.passwordIv,
      authTag: credential.passwordAuthTag,
    });

    console.log(`🔐 Credenciais carregadas para o usuário`);

    // Prepare contents array
    const contentsToSend = [];
    for (const contentId of contentIds) {
      const diaryContent = await this.diaryContentRepository.findOne({
        where: { diaryId, contentId },
      });

      if (diaryContent) {
        contentsToSend.push({
          contentId,
          content: diaryContent.content || '',
        });
      } else {
        results.push({
          contentId,
          success: false,
          message: 'Conteúdo do diário não encontrado',
        });
        failed++;
      }
    }

    if (contentsToSend.length === 0) {
      return {
        success: false,
        total: contentIds.length,
        succeeded: 0,
        failed: contentIds.length,
        results,
      };
    }

    console.log(`📦 Enviando ${contentsToSend.length} conteúdos usando sessão única...`);

    // Send all contents using single login session
    const sendResults = await this.scrapingService.sendDiaryContentBulkToSystem(
      credential.username,
      password,
      contentsToSend,
      onProgress ? (current: number, total: number, contentId: string, success: boolean, message: string) => {
        onProgress(current, total, contentId, success, message);
      } : undefined,
    );

    // Process results
    let processedCount = 0;
    for (const result of sendResults) {
      results.push(result);
      if (result.success) {
        succeeded++;
      } else {
        failed++;
      }

      // Send final progress for this item
      processedCount++;
      if (onProgress) {
        onProgress(processedCount, sendResults.length, result.contentId, result.success, result.message || '');
      }
    }

    return {
      success: succeeded > 0,
      total: contentIds.length,
      succeeded,
      failed,
      results,
    };
  }
}
