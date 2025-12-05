#!/usr/bin/env node

/**
 * Script para iniciar o ambiente de desenvolvimento
 * Funciona em Windows, Linux e macOS
 */

const { spawn } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';

console.log('🚀 Iniciando ambiente de desenvolvimento PlanIA...\n');

// 1. Iniciar Docker Compose (postgres e redis)
console.log('📦 Subindo PostgreSQL e Redis...');
const dockerCompose = spawn(
  isWindows ? 'docker-compose.exe' : 'docker-compose',
  ['up', '-d', 'postgres', 'redis'],
  { stdio: 'inherit', shell: true }
);

dockerCompose.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Erro ao iniciar Docker Compose');
    process.exit(code);
  }

  console.log('✅ Docker Compose iniciado\n');
  console.log('⏳ Aguardando 5 segundos para os containers iniciarem...\n');

  // 2. Aguardar containers iniciarem
  setTimeout(() => {
    console.log('🔧 Iniciando Backend e Frontend...\n');

    // 3. Iniciar backend e frontend com concurrently
    const dev = spawn('npm', ['run', 'dev:concurrent'], {
      stdio: 'inherit',
      shell: true,
    });

    dev.on('close', (code) => {
      process.exit(code);
    });

    // Capturar Ctrl+C para encerrar graciosamente
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Encerrando serviços...');
      dev.kill('SIGINT');
      process.exit(0);
    });
  }, 5000);
});
