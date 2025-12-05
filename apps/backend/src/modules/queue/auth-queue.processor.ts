import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AcademicService } from '../academic/academic.service';
import { ScrapingService } from '../scraping/scraping.service';

@Processor('auth-queue')
export class AuthQueueProcessor {
  constructor(
    private academicService: AcademicService,
    private scrapingService: ScrapingService,
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
      console.log(`Syncing diaries for user ${userId}`);
      
      // Get decrypted credential
      const credential = await this.academicService.getDecryptedCredential(
        credentialId,
      );

      if (credential.system !== 'ifms') {
        throw new Error('Only IFMS system is supported');
      }

      // Scrape diaries from IFMS
      const result = await this.scrapingService.getAllDiaries(
        credential.username,
        credential.password,
      );

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch diaries');
      }

      // Save diaries to database (only non-approved ones)
      const syncResult = await this.academicService.syncDiaries(
        userId,
        result.data,
      );

      console.log(`Diaries synced: ${syncResult.synced}`);

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
        for (const diary of diaries) {
          console.log(`Syncing teaching plans for diary ${diary.externalId}`);
          
          // Get teaching plans list
          const plansListResult = await this.scrapingService.getAllTeachingPlans(
            page,
            diary.externalId,
          );

          if (!plansListResult.success || !plansListResult.data) {
            console.log(`No teaching plans found for diary ${diary.externalId}`);
            continue;
          }

          // For each plan, get details and save
          for (const planSummary of plansListResult.data) {
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
              console.log(`Saved teaching plan #${planSummary.externalId}`);
            }
          }
        }

        console.log(`Total teaching plans synced: ${totalPlans}`);

        return { 
          success: true, 
          synced: syncResult.synced,
          plansSynced: totalPlans,
          message: `${syncResult.synced} diários e ${totalPlans} planos de ensino sincronizados` 
        };
      } finally {
        await context.close();
      }
    } catch (error) {
      console.error('Diaries sync failed:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao sincronizar diários' 
      };
    }
  }
}