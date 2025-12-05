/**
 * Script para testar scraping com debug habilitado via API
 * 
 * Uso:
 * TOKEN="seu_token" npx ts-node scripts/test-scraping-debug.ts
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const TOKEN = process.env.TOKEN;

async function main() {
  console.log('🚀 Testando scraping com debug...\n');

  if (!TOKEN) {
    console.error('❌ Token não fornecido');
    console.log('Uso: TOKEN="seu_token" npx ts-node scripts/test-scraping-debug.ts\n');
    process.exit(1);
  }

  const headers = { Authorization: `Bearer ${TOKEN}` };

  try {
    console.log('📄 Sincronizando...\n');
    await axios.post(`${API_URL}/academic/diaries/sync`, {}, { headers });
    
    console.log('⏳ Aguardando 10s...\n');
    await new Promise(r => setTimeout(r, 10000));

    const { data: stats } = await axios.get(`${API_URL}/scraping-debug/stats?type=teaching_plan`, { headers });
    console.log(`📈 ${stats.successful}/${stats.total} sucesso (${stats.avgCompleteness.toFixed(2)}%)\n`);

    if (stats.commonMissingFields?.length) {
      console.log('⚠️  Campos faltantes:');
      stats.commonMissingFields.forEach((f: any) => console.log(`   ${f.field}: ${f.count}x`));
      console.log();
    }

    console.log('✅ Concluído! Use analyze-scraping-cache.ts para detalhes.\n');
  } catch (error: any) {
    console.error('❌', error.response?.data || error.message);
  }
}

main();
