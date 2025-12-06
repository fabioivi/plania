import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AcademicService } from '../academic/academic.service';
import { ScrapingService } from '../scraping/scraping.service';
import { SyncEventsService } from '../sync/sync-events.service';

@Processor('auth-queue')
export class AuthQueueProcessor {
  constructor(
    private academicService: AcademicService,
    private scrapingService: ScrapingService,
    private syncEventsService: SyncEventsService,
  ) {}

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

      // Now sync teaching plans for each diary
      let totalPlans = 0;
      const diaries = await this.academicService.getUserDiaries(userId);

      // Create a single browser context for all teaching plan scraping
      const context = await this.scrapingService.createContext();
      const page = await context.newPage();

      try {
        // Login to IFMS
        const loginUrl = 'https://academico.ifms.edu.br/administrativo/usuarios/login';
        await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector('#UsuarioLoginForm', { state: 'visible', timeout: 10000 });
        await page.fill('input[name="data[Usuario][login]"]', credential.username);
        await page.fill('input[name="data[Usuario][senha]"]', credential.password);
        await page.click('input[type="submit"].btn-primary');
        await page.waitForTimeout(3000);

        // Scrape teaching plans for each diary
        let totalPlanItems = 0; // Total de itens a processar (diários + planos)
        
        // Primeiro, conta quantos planos existem no total
        for (const diary of diaries) {
          const plansListResult = await this.scrapingService.getAllTeachingPlans(
            page,
            diary.externalId,
          );
          if (plansListResult.success && plansListResult.data) {
            totalPlanItems += plansListResult.data.length;
          }
        }
        
        console.log(`📊 Total de itens a processar: ${diaries.length} diários + ${totalPlanItems} planos = ${diaries.length + totalPlanItems} itens`);
        
        const totalItems = diaries.length + totalPlanItems;
        let processedItems = 0;
        
        for (let i = 0; i < diaries.length; i++) {
          const diary = diaries[i];
          const diaryName = (diary as any).unidadeCurricular || `Diário ${diary.externalId}`;
          
          console.log(`📚 Processando diário ${i + 1}/${diaries.length}: ${diaryName}`);
          
          // Incrementa progresso ao processar diário
          processedItems++;
          
          // Enviar evento: processando diário específico
          this.syncEventsService.sendEvent(userId, {
            userId,
            stage: 'plans',
            message: `Processando: ${diaryName}`,
            diaryName,
            current: processedItems,
            total: totalItems,
          });
          
          // Scrape diary content (conteúdo das aulas)
          console.log(`📖 Extraindo conteúdo das aulas de: ${diaryName}`);
          const contentResult = await this.scrapingService.scrapeClassContent(
            page,
            diary.externalId,
          );
          
          if (contentResult.success && contentResult.data && contentResult.data.length > 0) {
            // Save content to database
            await this.academicService.syncDiaryContent(
              userId,
              diary.id,
              contentResult.data,
            );
            console.log(`✅ ${contentResult.data.length} conteúdos de aula salvos para ${diaryName}`);
          } else {
            console.log(`⚠️ Nenhum conteúdo de aula encontrado para ${diaryName}`);
          }
          
          // Get teaching plans list
          const plansListResult = await this.scrapingService.getAllTeachingPlans(
            page,
            diary.externalId,
          );

          if (!plansListResult.success || !plansListResult.data) {
            console.log(`⚠️ Nenhum plano de ensino encontrado para ${diaryName}`);
            continue;
          }

          // For each plan, get details and save
          const plans = plansListResult.data;
          for (let j = 0; j < plans.length; j++) {
            const planSummary = plans[j];
            const planName = `Plano #${planSummary.externalId}`;
            
            // Incrementa progresso ao processar plano
            processedItems++;
            
            // Enviar evento: processando plano específico
            this.syncEventsService.sendEvent(userId, {
              userId,
              stage: 'plans',
              message: `Extraindo plano de ensino ${j + 1}/${plans.length} de ${diaryName}`,
              diaryName,
              planName,
              current: processedItems,
              total: totalItems,
            });
            
            const planDetailsResult = await this.scrapingService.getTeachingPlanDetails(
              page,
              diary.externalId,
              planSummary.externalId,
            );

            if (planDetailsResult.success && planDetailsResult.data) {
              // Merge summary and details
              const fullPlanData = {
                ...planSummary,
                ...planDetailsResult.data,
              };

              // Save to database
              await this.academicService.syncTeachingPlans(
                userId,
                diary.id,
                diary.externalId,
                [fullPlanData],
              );

              totalPlans++;
              console.log(`✅ Plano de ensino salvo: ${planName}`);
            }
          }
        }

        console.log(`✅ Total de planos de ensino sincronizados: ${totalPlans}`);

        // Enviar evento: concluído
        this.syncEventsService.sendEvent(userId, {
          userId,
          stage: 'completed',
          message: `Sincronização concluída com sucesso! ${syncResult.synced} ${syncResult.synced === 1 ? 'diário' : 'diários'} e ${totalPlans} ${totalPlans === 1 ? 'plano de ensino' : 'planos de ensino'} sincronizados.`,
          current: totalItems,
          total: totalItems,
        });

        return { 
          success: true, 
          synced: syncResult.synced,
          plansSynced: totalPlans,
          message: `${syncResult.synced} diários e ${totalPlans} planos de ensino sincronizados com sucesso` 
        };
      } finally {
        await context.close();
      }
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

      const decryptedCred = await this.academicService.getDecryptedCredential(credential.id);

      // Create browser context and login
      const context = await this.scrapingService.createContext();
      const page = await context.newPage();

      try {
        // Login to IFMS
        const loginUrl = 'https://academico.ifms.edu.br/administrativo/usuarios/login';
        await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector('#UsuarioLoginForm', { state: 'visible', timeout: 10000 });
        await page.fill('input[name="data[Usuario][login]"]', decryptedCred.username);
        await page.fill('input[name="data[Usuario][senha]"]', decryptedCred.password);
        await page.click('input[type="submit"].btn-primary');
        await page.waitForTimeout(3000);

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
        const result = await this.academicService.syncDiaryContent(userId, diary.id, contentsResult.data);
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

      const decryptedCred = await this.academicService.getDecryptedCredential(credential.id);

      // Create browser context and login
      const context = await this.scrapingService.createContext();
      const page = await context.newPage();

      try {
        // Login to IFMS
        const loginUrl = 'https://academico.ifms.edu.br/administrativo/usuarios/login';
        await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector('#UsuarioLoginForm', { state: 'visible', timeout: 10000 });
        await page.fill('input[name="data[Usuario][login]"]', decryptedCred.username);
        await page.fill('input[name="data[Usuario][senha]"]', decryptedCred.password);
        await page.click('input[type="submit"].btn-primary');
        await page.waitForTimeout(3000);

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

        // Atualiza no banco
        await this.academicService.updateTeachingPlan(plan.id, fullPlanData.data);
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
}