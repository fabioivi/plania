import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { BrowserContext, Page } from 'playwright';
import { AcademicService } from '../academic/academic.service';
import { ScrapingService } from '../scraping/scraping.service';
import { ScrapingPoolService } from '../scraping/scraping-pool.service';
import { SyncEventsService } from '../sync/sync-events.service';

@Processor('auth-queue')
export class AuthQueueProcessor {
  constructor(
    private academicService: AcademicService,
    private scrapingService: ScrapingService,
    private scrapingPool: ScrapingPoolService,
    private syncEventsService: SyncEventsService,
  ) { }

  @Process('verify-credential')
  async handleVerifyCredential(job: Job) {
    const { credentialId } = job.data;

    try {
      // Get decrypted credential
      const credential = await this.academicService.getDecryptedCredential(
        credentialId,
      );

      // Test login based on system
      let isValid = false;
      if (credential.system === 'ifms') {
        isValid = await this.scrapingService.testIFMSLogin(
          credential.username,
          credential.password,
        );
      }

      // Update credential status
      await this.academicService.markAsVerified(credentialId, isValid, null);

      return { success: true, isValid };
    } catch (error) {
      console.error('Credential verification failed:', error);
      const errorMessage = error.message || 'Erro desconhecido ao verificar credenciais';
      await this.academicService.markAsVerified(credentialId, false, errorMessage);
      throw error;
    }
  }

  @Process('test-credential')
  async handleTestCredential(job: Job) {
    const { credentialId } = job.data;

    try {
      const credential = await this.academicService.getDecryptedCredential(
        credentialId,
      );

      let isValid = false;
      if (credential.system === 'ifms') {
        isValid = await this.scrapingService.testIFMSLogin(
          credential.username,
          credential.password,
        );
      }

      // Update credential status
      await this.academicService.markAsVerified(credentialId, isValid, null);

      return { success: true, isValid };
    } catch (error) {
      console.error('Credential test failed:', error);
      const errorMessage = error.message || 'Erro ao testar credenciais';
      await this.academicService.markAsVerified(credentialId, false, errorMessage);
      return { success: false, isValid: false, error: errorMessage };
    }
  }

  @Process('sync-diaries')
  async handleSyncDiaries(job: Job) {
    const { userId, credentialId } = job.data;
    const startTime = Date.now();

    try {
      console.log(`🔄 Iniciando sincronização para usuário ${userId}`);

      // Enviar evento: iniciando
      this.syncEventsService.sendEvent(userId, {
        userId,
        stage: 'starting',
        message: 'Iniciando sincronização com o sistema acadêmico...',
      });

      // Get decrypted credential
      const credential = await this.academicService.getDecryptedCredential(
        credentialId,
      );

      if (credential.system !== 'ifms') {
        throw new Error('Apenas o sistema IFMS é suportado no momento');
      }

      // Enviar evento: buscando diários
      this.syncEventsService.sendEvent(userId, {
        userId,
        stage: 'diaries',
        message: 'Conectando ao sistema e buscando diários de classe...',
      });

      // Scrape diaries from IFMS
      const result = await this.scrapingService.getAllDiaries(
        credential.username,
        credential.password,
      );

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Falha ao buscar diários do sistema acadêmico');
      }

      // Save diaries to database (only non-approved ones)
      const syncResult = await this.academicService.syncDiaries(
        userId,
        result.data,
      );

      console.log(`✅ ${syncResult.synced} diários sincronizados`);

      // Enviar evento: diários sincronizados (SEM progress bar aqui)
      this.syncEventsService.sendEvent(userId, {
        userId,
        stage: 'diaries',
        message: `${syncResult.synced} ${syncResult.synced === 1 ? 'diário encontrado' : 'diários encontrados'}. Buscando planos de ensino...`,
      });

      // ============================================
      // 🚀 PARALLEL SCRAPING with Browser Pool
      // ============================================
      const diaries = await this.academicService.getUserDiaries(userId);
      console.log(`🚀 Iniciando scraping PARALELO de ${diaries.length} diários (máx 5 simultâneos)`);

      let totalPlans = 0;
      let processedItems = 0;

      // Estimate total items (will be updated as we discover plans)
      let totalItems = diaries.length;

      // Create parallel operations for each diary
      const diaryOperations = diaries.map((diary, index) => async (context: BrowserContext, page: Page) => {
        const diaryName = (diary as any).unidadeCurricular || `Diário ${diary.externalId}`;

        try {
          console.log(`📚 [${index + 1}/${diaries.length}] Processando ${diaryName} (paralelo)`);

          // Login with session cache
          await this.scrapingService.ensureLoggedIn(page, credential.username, credential.password);

          // Scrape diary content
          console.log(`📖 Extraindo conteúdo de: ${diaryName}`);
          const contentResult = await this.scrapingService.scrapeClassContent(page, diary.externalId);

          if (contentResult.success && contentResult.data && contentResult.data.length > 0) {
            await this.academicService.syncDiaryContent(userId, diary.id, {
              content: contentResult.data,
              metadata: contentResult.metadata
            });
            console.log(`✅ ${contentResult.data.length} conteúdos salvos - ${diaryName}`);
          }

          // Scrape teaching plans
          const plansListResult = await this.scrapingService.getAllTeachingPlans(page, diary.externalId);

          if (!plansListResult.success || !plansListResult.data) {
            console.log(`⚠️ Sem planos - ${diaryName}`);
            return { diary, plansScraped: 0 };
          }

          const plans = plansListResult.data;
          const plansData = [];

          // Scrape each plan's details
          for (let j = 0; j < plans.length; j++) {
            const planSummary = plans[j];
            const planName = `Plano #${planSummary.externalId}`;

            console.log(`📄 [${j + 1}/${plans.length}] Extraindo ${planName} de ${diaryName}`);

            const planDetailsResult = await this.scrapingService.getTeachingPlanDetails(
              page,
              diary.externalId,
              planSummary.externalId,
            );

            if (planDetailsResult.success && planDetailsResult.data) {
              plansData.push({
                ...planSummary,
                ...planDetailsResult.data,
              });
            }

            // Update progress
            processedItems++;
            this.syncEventsService.sendEvent(userId, {
              userId,
              stage: 'plans',
              message: `Processando plano ${j + 1}/${plans.length} de ${diaryName}`,
              diaryName,
              planName,
              current: processedItems,
              total: totalItems + plans.length, // Update estimate
            });
          }

          // ✅ BATCH SAVE: Save all plans at once (not one by one)
          if (plansData.length > 0) {
            await this.academicService.syncTeachingPlans(
              userId,
              diary.id,
              diary.externalId,
              plansData, // Save all plans in one operation
            );
            console.log(`✅ ${plansData.length} planos salvos - ${diaryName}`);
          }

          return { diary, plansScraped: plansData.length };
        } catch (error) {
          console.error(`❌ Erro ao processar ${diaryName}:`, error.message);
          return { diary, plansScraped: 0, error: error.message };
        }
      });

      // Execute all diary operations in parallel (max 5 concurrent)
      console.log(`⚡ Executando ${diaryOperations.length} operações em paralelo...`);
      const results = await this.scrapingPool.executeParallel(diaryOperations);

      // Calculate totals
      totalPlans = results.reduce((sum, r) => sum + r.plansScraped, 0);

      const durationMs = Date.now() - startTime;
      const durationSeconds = (durationMs / 1000).toFixed(1);
      console.log(`⏱️ Sincronização PARALELA finalizada em ${durationSeconds}s`);
      console.log(`✅ Total: ${totalPlans} planos de ensino sincronizados`);

      // Send completion event
      this.syncEventsService.sendEvent(userId, {
        userId,
        stage: 'completed',
        message: `Sincronização concluída em ${durationSeconds}s! ${syncResult.synced} ${syncResult.synced === 1 ? 'diário' : 'diários'} e ${totalPlans} ${totalPlans === 1 ? 'plano de ensino' : 'planos de ensino'} sincronizados.`,
        duration: durationMs
      });

      return {
        success: true,
        synced: syncResult.synced,
        plansSynced: totalPlans,
        message: `${syncResult.synced} diários e ${totalPlans} planos sincronizados (paralelo)`
      };
    } catch (error) {
      console.error('❌ Falha na sincronização de diários:', error);

      // Enviar evento: erro
      this.syncEventsService.sendEvent(userId, {
        userId,
        stage: 'error',
        message: error.message || 'Erro ao sincronizar diários. Por favor, tente novamente.',
      });

      return {
        success: false,
        error: error.message || 'Erro ao sincronizar diários'
      };
    }
  }

  /**
   * Sincroniza um diário específico
   */
  async syncSpecificDiary(userId: string, diaryId: string) {
    console.log(`🎯 Iniciando sincronização específica do diário ${diaryId}`);

    try {
      // Busca o diário específico
      const diary = await this.academicService.findDiaryById(userId, diaryId);
      if (!diary) {
        throw new Error(`Diário ${diaryId} não encontrado`);
      }

      // Get credential
      const credentials = await this.academicService.getCredentials(userId);
      const credential = credentials.find(c => c.system === 'ifms');
      if (!credential) {
        throw new Error('Credencial IFMS não encontrada');
      }

      if (!credential.isVerified) {
        throw new Error('Credencial não verificada. Por favor, revalide suas credenciais.');
      }

      const decryptedCred = await this.academicService.getDecryptedCredential(credential.id);

      // Create browser context and login
      const context = await this.scrapingService.createContext();
      const page = await context.newPage();

      try {
        // Login to IFMS (with session reuse)
        await this.scrapingService.ensureLoggedIn(page, decryptedCred.username, decryptedCred.password);

        // Extrai conteúdo do diário
        console.log(`📖 Extraindo conteúdo do diário: ${diary.disciplina}`);
        const contentsResult = await this.scrapingService.scrapeClassContent(
          page,
          diary.externalId,
        );

        if (!contentsResult.success || !contentsResult.data) {
          throw new Error(contentsResult.message || 'Falha ao extrair conteúdo do diário');
        }

        console.log(`📦 Dados extraídos: ${contentsResult.data.length} itens`);

        // Salva no banco
        const result = await this.academicService.syncDiaryContent(userId, diary.id, {
          content: contentsResult.data,
          metadata: contentsResult.metadata
        });
        console.log(`✅ Conteúdo do diário ${diary.disciplina} sincronizado: ${result.synced} salvos, ${result.realClasses} aulas, ${result.anticipations} antecipações, ${result.skipped} ignorados`);

        return { success: true, diary, ...result };
      } finally {
        await context.close();
      }
    } catch (error) {
      console.error(`❌ Erro ao sincronizar diário ${diaryId}:`, error.message);
      throw error;
    }
  }

  /**
   * Sincroniza um plano de ensino específico
   */
  async syncSpecificTeachingPlan(userId: string, planId: string) {
    console.log(`🎯 Iniciando sincronização específica do plano ${planId}`);

    try {
      // Busca o plano específico
      const plan = await this.academicService.findTeachingPlanById(userId, planId);
      if (!plan) {
        throw new Error(`Plano de ensino ${planId} não encontrado`);
      }

      // Get credential
      const credentials = await this.academicService.getCredentials(userId);
      const credential = credentials.find(c => c.system === 'ifms');
      if (!credential) {
        throw new Error('Credencial IFMS não encontrada');
      }

      if (!credential.isVerified) {
        throw new Error('Credencial não verificada. Por favor, revalide suas credenciais.');
      }

      const decryptedCred = await this.academicService.getDecryptedCredential(credential.id);

      // Create browser context and login
      const context = await this.scrapingService.createContext();
      const page = await context.newPage();

      try {
        // Login to IFMS (with session reuse)
        await this.scrapingService.ensureLoggedIn(page, decryptedCred.username, decryptedCred.password);

        // Extrai dados completos do plano
        console.log(`📚 Extraindo dados do plano: ${plan.unidadeCurricular}`);
        const fullPlanData = await this.scrapingService.getTeachingPlanDetails(
          page,
          plan.diary.externalId,
          plan.externalId,
        );

        if (!fullPlanData.success || !fullPlanData.data) {
          throw new Error(fullPlanData.message || 'Falha ao extrair dados do plano');
        }

        // Mapeia os dados extraídos para os campos da entidade
        const planData = fullPlanData.data;
        const updateData: any = {
          status: planData.status,
          statusCoord: planData.statusCoord,
          campus: planData.campus,
          anoSemestre: planData.anoSemestre,
          curso: planData.curso,
          unidadeCurricular: planData.unidadeCurricular,
          professores: planData.professores,
          cargaHorariaTotal: planData.cargaHorariaTotal,
          numSemanas: planData.numSemanas,
          numAulasTeorica: planData.numAulasTeorica,
          numAulasPraticas: planData.numAulasPraticas,
          ementa: planData.ementa,
          objetivoGeral: planData.objetivoGeral,
          objetivosEspecificos: planData.objetivosEspecificos,
          avaliacaoAprendizagem: planData.avaliacaoAprendizagem,
          observacoesAvaliacoes: planData.observacoesAvaliacoes,
          recuperacaoAprendizagem: planData.recuperacaoAprendizagem,
          propostaTrabalho: planData.propostaTrabalho,
        };

        // Combina bibliografias em um único campo de referências
        if (planData.bibliografiaBasica || planData.bibliografiaComplementar) {
          const referencias = [];
          if (planData.bibliografiaBasica?.length > 0) {
            referencias.push('BIBLIOGRAFIA BÁSICA:', ...planData.bibliografiaBasica, '');
          }
          if (planData.bibliografiaComplementar?.length > 0) {
            referencias.push('BIBLIOGRAFIA COMPLEMENTAR:', ...planData.bibliografiaComplementar);
          }
          updateData.referencias = referencias.join('\n');
        }

        // Atualiza no banco
        await this.academicService.updateTeachingPlan(plan.id, updateData);
        console.log(`✅ Plano ${plan.unidadeCurricular} sincronizado`);

        return { success: true, plan };
      } finally {
        await context.close();
      }
    } catch (error) {
      console.error(`❌ Erro ao sincronizar plano ${planId}:`, error.message);
      throw error;
    }
  }
  @Process('fill-teaching-plan')
  async handleFillTeachingPlan(job: Job) {
    const { userId, planId } = job.data;
    const startTime = Date.now();

    try {
      console.log(`🚀 Iniciando preenchimento de plano ${planId} para usuário ${userId}`);

      // Enviar evento: iniciando
      this.syncEventsService.sendEvent(userId, {
        userId,
        stage: 'starting',
        message: 'Iniciando preenchimento do plano de ensino...',
      });

      // Execute scraping with progress callback
      const result = await this.academicService.sendTeachingPlanToIFMS(
        userId,
        planId,
        (message: string) => {
          // Send progress message to frontend
          this.syncEventsService.sendEvent(userId, {
            userId,
            stage: 'starting', // Keep stage as starting/processing
            message: message,
          });
        }
      );

      const durationMs = Date.now() - startTime;
      const durationSeconds = (durationMs / 1000).toFixed(1);

      if (result.success) {
        // Send completion event
        this.syncEventsService.sendEvent(userId, {
          userId,
          stage: 'completed',
          message: `Plano preenchido com sucesso em ${durationSeconds}s!`,
          duration: durationMs
        });
      } else {
        // Send error event
        this.syncEventsService.sendEvent(userId, {
          userId,
          stage: 'error',
          message: result.message || 'Falha ao preencher plano',
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Falha ao preencher plano:', error);

      // Enviar evento: erro
      this.syncEventsService.sendEvent(userId, {
        userId,
        stage: 'error',
        message: error.message || 'Erro ao preencher plano. Por favor, tente novamente.',
      });

      return {
        success: false,
        error: error.message || 'Erro ao preencher plano'
      };
    }
  }
}