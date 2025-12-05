# Docker Watch - Desenvolvimento com Hot Reload

## ✅ Configuração Concluída

O projeto PlanIA está configurado com **Docker Watch** para desenvolvimento com hot reload instantâneo.

## 🚀 Como Usar

### Iniciar o ambiente de desenvolvimento:

```bash
docker compose watch
```

Este comando irá:
1. Construir a imagem Docker (se necessário)
2. Iniciar o container
3. Ativar o modo Watch para sincronização automática de arquivos
4. Manter o terminal ativo monitorando mudanças

### Acessar a aplicação:

Abra o navegador em: **http://localhost:3000**

## 📁 Arquivos Monitorados

O Docker Watch está configurado para sincronizar automaticamente:

- ✅ `app/` - Páginas e rotas do Next.js
- ✅ `src/` - Componentes, estilos e código fonte
- ✅ `public/` - Arquivos estáticos
- ✅ `tailwind.config.js` - Configuração do Tailwind
- ✅ `next.config.js` - Configuração do Next.js

### Mudanças que disparam rebuild:

- `package.json` - Instalação de novas dependências
- `package-lock.json` - Atualização de dependências

## 🔄 Hot Reload Instantâneo

Quando você edita um arquivo:
1. Docker Watch detecta a mudança
2. Sincroniza o arquivo para o container
3. Next.js detecta a mudança
4. Recompila automaticamente
5. O navegador atualiza em tempo real

**Tempo médio de reload**: ~100-300ms

## 📝 Testando o Hot Reload

1. Abra `app/page.tsx`
2. Faça uma mudança (adicione um comentário, altere um texto)
3. Salve o arquivo
4. Verifique o terminal - verá mensagens de compilação
5. O navegador atualizará automaticamente

## 🛑 Parar o Ambiente

Para parar o Docker Watch e o container:

```bash
Ctrl + C
```

Ou em outro terminal:

```bash
docker compose down
```

## 🔍 Verificar Logs

Para ver os logs do Next.js em tempo real:

```bash
docker logs plania-design-system -f
```

Para ver as últimas 50 linhas:

```bash
docker logs plania-design-system --tail 50
```

## ⚙️ Configuração Técnica

### docker-compose.yml

```yaml
develop:
  watch:
    - action: sync          # Sincronização instantânea
      path: ./app
      target: /app/app
    - action: sync
      path: ./src
      target: /app/src
    - action: rebuild       # Rebuild completo
      path: package.json
```

### Diferença entre sync e rebuild:

- **sync**: Copia arquivos instantaneamente (rápido, ~100ms)
- **rebuild**: Reconstrói a imagem Docker (lento, ~10-30s)

## 🎯 Vantagens do Docker Watch

✅ **Sem Bind Mounts**: Evita problemas de permissão e performance  
✅ **Sincronização Seletiva**: Apenas arquivos necessários são copiados  
✅ **Performance**: Mais rápido que polling tradicional  
✅ **Compatibilidade**: Funciona em Windows, Linux e macOS  
✅ **Produtividade**: Hot reload instantâneo como em desenvolvimento local  

## 🔧 Solução de Problemas

### Hot reload não funciona:

1. Verifique se o Docker Watch está ativo:
   ```bash
   docker ps
   ```
   Deve mostrar: `STATUS: Up X seconds`

2. Reinicie o Docker Watch:
   ```bash
   docker compose down
   docker compose watch
   ```

3. Verifique os logs:
   ```bash
   docker logs plania-design-system --tail 50
   ```

### Mudanças não aparecem:

1. Certifique-se de que salvou o arquivo (Ctrl+S)
2. Verifique se o arquivo está dentro de `app/`, `src/` ou `public/`
3. Aguarde a mensagem de compilação no terminal

### Performance lenta:

Se o hot reload estiver lento:
1. Verifique se não há múltiplos containers rodando
2. Limpe imagens antigas: `docker system prune -a`
3. Aumente recursos do Docker Desktop (CPU/RAM)

## 📚 Recursos Adicionais

- [Docker Watch Documentation](https://docs.docker.com/compose/file-watch/)
- [Next.js Fast Refresh](https://nextjs.org/docs/architecture/fast-refresh)
- [Docker Compose Specification](https://docs.docker.com/compose/compose-file/)

---

**Configurado em**: 04/12/2024  
**Versão Docker Compose**: 2.x  
**Versão Next.js**: 14.2.33  
**Node.js**: 20 Alpine
