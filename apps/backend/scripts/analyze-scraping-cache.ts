/**
 * Script simples para análise de cache de scraping
 * 
 * Uso:
 * npx ts-node scripts/analyze-scraping-cache.ts [planId]
 * 
 * Exemplo:
 * npx ts-node scripts/analyze-scraping-cache.ts 46332
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ScrapingDebugService } from '../src/modules/scraping/scraping-debug.service';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const planId = process.argv[2];
  
  if (!planId) {
    console.error('❌ Erro: Informe o ID do plano de ensino');
    console.log('Uso: npx ts-node scripts/analyze-scraping-cache.ts [planId]');
    process.exit(1);
  }

  console.log(`🔍 Analisando cache do plano ${planId}...\n`);

  const app = await NestFactory.createApplicationContext(AppModule);
  const debugService = app.get(ScrapingDebugService);

  try {
    const cache = await debugService.getLatestCache(planId, 'teaching_plan');
    
    if (!cache) {
      console.log('❌ Nenhum cache encontrado para este plano.');
      console.log('Execute o scraping primeiro com test-scraping-debug.ts');
      process.exit(1);
    }

    console.log('✅ Cache encontrado!\n');
    console.log('📊 Informações:');
    console.log(`   ID: ${cache.id}`);
    console.log(`   External ID: ${cache.externalId}`);
    console.log(`   URL: ${cache.url}`);
    console.log(`   Sucesso: ${cache.success ? '✅' : '❌'}`);
    console.log(`   Duração: ${cache.scrapeDurationMs}ms`);
    console.log(`   Data: ${cache.createdAt}\n`);

    // Metrics
    if (cache.fieldMetrics) {
      console.log('📈 Métricas de Extração:');
      console.log(`   Total de campos: ${cache.fieldMetrics.total}`);
      console.log(`   Campos extraídos: ${cache.fieldMetrics.extracted}`);
      console.log(`   Completeness: ${cache.fieldMetrics.completeness.toFixed(2)}%\n`);
      
      if (cache.fieldMetrics.missing.length > 0) {
        console.log('   ❌ Campos faltantes:');
        cache.fieldMetrics.missing.forEach(field => {
          console.log(`      - ${field}`);
        });
        console.log();
      }
    }

    // Warnings
    if (cache.extractionWarnings.length > 0) {
      console.log('⚠️  Avisos:');
      cache.extractionWarnings.forEach(w => {
        console.log(`   - ${w}`);
      });
      console.log();
    }

    // Errors
    if (cache.extractionErrors.length > 0) {
      console.log('❌ Erros:');
      cache.extractionErrors.forEach(e => {
        console.log(`   - ${e}`);
      });
      console.log();
    }

    // Extracted data summary
    if (cache.extractedData) {
      console.log('📄 Dados Extraídos:');
      const data = cache.extractedData;
      
      Object.keys(data).forEach(key => {
        if (key.startsWith('_')) return; // Skip metadata
        
        const value = data[key];
        let status = '❌ NULL';
        
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            status = `✅ ${value.length} itens`;
          } else if (typeof value === 'string') {
            status = value.length > 0 ? `✅ ${value.length} chars` : '❌ Empty';
          } else {
            status = '✅ Extraído';
          }
        }
        
        console.log(`   ${key}: ${status}`);
      });
      console.log();
    }

    // Save HTML to file
    const outputDir = path.join(process.cwd(), 'storage', 'scraping-debug', 'html-exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const htmlFile = path.join(outputDir, `plan_${planId}_${Date.now()}.html`);
    fs.writeFileSync(htmlFile, cache.htmlSnapshot, 'utf-8');
    
    console.log('💾 HTML exportado:');
    console.log(`   ${htmlFile}\n`);

    // Screenshot
    if (cache.screenshotPath) {
      console.log('🖼️  Screenshot:');
      console.log(`   ${cache.screenshotPath}\n`);
      
      if (fs.existsSync(cache.screenshotPath)) {
        console.log('   ✅ Arquivo existe e pode ser aberto\n');
      } else {
        console.log('   ⚠️  Arquivo não encontrado no sistema\n');
      }
    }

    // Proposta de Trabalho analysis (se existir)
    if (cache.extractedData?.propostaTrabalho) {
      console.log('📋 Análise da Proposta de Trabalho:');
      const proposta = cache.extractedData.propostaTrabalho;
      
      if (Array.isArray(proposta) && proposta.length > 0) {
        console.log(`   ✅ ${proposta.length} registros encontrados\n`);
        console.log('   Amostra (primeiro registro):');
        const primeiro = proposta[0];
        Object.keys(primeiro).forEach(key => {
          console.log(`      ${key}: ${primeiro[key]}`);
        });
      } else {
        console.log('   ❌ Nenhum registro encontrado');
        console.log('   💡 Verifique o HTML exportado para encontrar a tabela\n');
      }
      console.log();
    } else {
      console.log('📋 Proposta de Trabalho:');
      console.log('   ❌ Não extraída');
      console.log('   💡 Abra o HTML exportado e procure por:');
      console.log('      - table#proposta_trabalho');
      console.log('      - table com th "Metodologia"');
      console.log('      - table com th "Período em dias"\n');
    }

    console.log('🔍 Próximos passos para debug:');
    console.log('   1. Abra o HTML exportado no navegador');
    console.log('   2. Inspecione a estrutura da tabela de proposta');
    console.log('   3. Teste seletores no console do browser:');
    console.log('      document.querySelector("table#proposta_trabalho")');
    console.log('   4. Ajuste seletores em ifms.selectors.config.ts');
    console.log('   5. Re-execute o scraping e compare\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

bootstrap();
