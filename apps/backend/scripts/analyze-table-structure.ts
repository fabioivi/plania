import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'node-html-parser';

async function analyzeTableStructure() {
  const htmlPath = path.join(
    process.cwd(),
    'storage',
    'scraping-debug',
    'html-exports',
    'plan_45737_20251205113652.html',
  );

  console.log('\n📁 Carregando HTML:', htmlPath);

  if (!fs.existsSync(htmlPath)) {
    console.error('❌ Arquivo não encontrado!');
    return;
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  const root = parse(htmlContent);

  console.log('\n🔍 ANÁLISE DE TABELAS:\n');

  // Todas as tabelas com classe .table
  const allTables = root.querySelectorAll('table.table');
  console.log(`Total de tabelas: ${allTables.length}\n`);

  allTables.forEach((table, index) => {
    const th = table.querySelector('th');
    const headerText = th?.text?.trim() || 'SEM CABEÇALHO';
    const hasPropostaTable = !!table.querySelector('table#proposta_trabalho');
    const hasBibliografia = table.innerHTML.includes('Bibliografia');

    console.log(`[${index}] ${headerText}`);
    if (hasPropostaTable) {
      console.log(`     ✅ Contém table#proposta_trabalho`);
    }
    if (hasBibliografia) {
      console.log(`     📚 Contém "Bibliografia"`);
    }
    console.log('');
  });

  // Buscar especificamente por table#proposta_trabalho
  console.log('\n🎯 BUSCA DIRETA:\n');
  const propostaTable = root.querySelector('table#proposta_trabalho');
  if (propostaTable) {
    console.log('✅ table#proposta_trabalho ENCONTRADA!');
    const rows = propostaTable.querySelectorAll('tr');
    console.log(`   Linhas: ${rows.length}`);

    // Mostrar primeiras 3 linhas
    rows.slice(0, 3).forEach((row, i) => {
      const cells = row.querySelectorAll('td');
      const text = Array.from(cells)
        .map((c: any) => c.text.trim())
        .join(' | ');
      console.log(`   [${i}] ${text.substring(0, 80)}...`);
    });
  } else {
    console.log('❌ table#proposta_trabalho NÃO encontrada!');
  }

  // Buscar tabela que contém "08 - DETALHAMENTO DA PROPOSTA"
  console.log('\n📋 BUSCA POR TEXTO "DETALHAMENTO DA PROPOSTA":\n');
  const detalheTable = allTables.find(
    (t) =>
      t.text.includes('DETALHAMENTO DA PROPOSTA') ||
      t.text.includes('08 -'),
  );

  if (detalheTable) {
    console.log('✅ Tabela encontrada!');
    const innerTables = detalheTable.querySelectorAll('table');
    console.log(`   Tabelas internas: ${innerTables.length}`);

    innerTables.forEach((inner, i) => {
      const id = inner.getAttribute('id');
      const rows = inner.querySelectorAll('tr');
      console.log(`   [${i}] ID: ${id || 'sem ID'}, Linhas: ${rows.length}`);
    });
  } else {
    console.log('❌ Tabela não encontrada!');
  }

  // Buscar por Bibliografia
  console.log('\n📚 BUSCA POR "BIBLIOGRAFIA":\n');
  const biblioTable = allTables.find(
    (t) =>
      t.text.includes('BIBLIOGRAFIA') ||
      t.text.includes('Bibliografia'),
  );

  if (biblioTable) {
    console.log('✅ Tabela encontrada!');
    const hasBasica = biblioTable.innerHTML.includes('Básica');
    const hasComplementar = biblioTable.innerHTML.includes('Complementar');
    console.log(`   Bibliografia Básica: ${hasBasica ? '✅' : '❌'}`);
    console.log(`   Bibliografia Complementar: ${hasComplementar ? '✅' : '❌'}`);

    // Extrair conteúdo
    const html = biblioTable.innerHTML;
    const basicaMatch = html.match(
      /Bibliografia\s+Básica\s*([\s\S]*?)(?=Bibliografia\s+Complementar|$)/i,
    );
    const complementarMatch = html.match(
      /Bibliografia\s+Complementar\s*([\s\S]*?)$/i,
    );

    if (basicaMatch) {
      const refs = basicaMatch[1]
        .split(/<br\s*\/?>/i)
        .map((r) => r.replace(/<[^>]*>/g, '').trim())
        .filter((r) => r.length > 5 && /^[A-Z]/.test(r));
      console.log(`\n   📖 Bibliografia Básica (${refs.length} refs):`);
      refs.slice(0, 2).forEach((r) => console.log(`      - ${r.substring(0, 60)}...`));
    }

    if (complementarMatch) {
      const refs = complementarMatch[1]
        .split(/<br\s*\/?>/i)
        .map((r) => r.replace(/<[^>]*>/g, '').trim())
        .filter((r) => r.length > 5 && /^[A-Z]/.test(r));
      console.log(`\n   📚 Bibliografia Complementar (${refs.length} refs):`);
      refs.slice(0, 2).forEach((r) => console.log(`      - ${r.substring(0, 60)}...`));
    }
  } else {
    console.log('❌ Tabela não encontrada!');
  }
}

analyzeTableStructure().catch(console.error);
