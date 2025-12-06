import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

@Injectable()
export class AcademicService {
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
    @InjectQueue('auth-queue') private authQueue: Queue,
  ) {}

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

  // Sync diaries from IFMS (only non-approved)
  async syncDiaries(userId: string, diariesData: any[]) {
    const diariesToSave = [];

    for (const diaryData of diariesData) {
      // Skip approved diaries
      if (diaryData.aprovado) {
        continue;
      }

      // Check if diary already exists
      let diary = await this.diaryRepository.findOne({
        where: { 
          userId, 
          externalId: diaryData.externalId 
        },
      });

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

      plansToSave.push(plan);

      // Sync history entries if present
      if (planData.historico && Array.isArray(planData.historico)) {
        await this.syncTeachingPlanHistory(plan.id, planData.historico);
      }
    }

    if (plansToSave.length > 0) {
      await this.teachingPlanRepository.save(plansToSave);
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
  async syncDiaryContent(userId: string, diaryId: string, contentData: any[]) {
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

      await this.diaryContentRepository.save(contentsToSave);
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
}
