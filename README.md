# IgaraDrama — MVP Web/PWA

Interface de doramas curtos com catálogo demonstrativo, favoritos, histórico, painel de diagnóstico e adaptador de consulta à APIShort/ShortMax.

## Requisitos
- Node.js 20 ou superior

## Instalação
```bash
npm install
cp .env.example .env
```
No Windows, use `copy .env.example .env`. Edite `.env` e substitua a chave por **uma chave nova**. A chave compartilhada anteriormente deve ser revogada.

## Executar
Em um terminal:
```bash
npm run server
```
Em outro terminal:
```bash
npm run dev
```
Abra http://localhost:5173

## Produção
`npm run build` gera o frontend estático em `dist/`. O servidor Express é necessário para a API; hospede-o em ambiente compatível. HTTPS é necessário para instalação PWA fora do localhost. O app ainda não tem service worker/offline cache.

## Integração
- `GET /api/health`: status do backend.
- `GET /api/catalog?category=1`: consulta o endpoint `/v1/shortmax/api/v1/category/1` no servidor, usando a chave em `.env`.
- `GET /api/playback/:id`: bloqueado até validação de licenças e implementação do adaptador.

**Importante:** a API de catálogo está em modo diagnóstico. Como o esquema real de resposta não foi validado, seus dados não são importados para a interface automaticamente. O catálogo exibido é ilustrativo, sem episódios reais, e não representa obras licenciadas. Os números de audiência e avaliações são fictícios. A área Admin é apenas painel de diagnóstico, sem autenticação ou edição real; não deve ser exposta como administração de produção.

## Direitos autorais e segurança
Acesso à API não equivale a licença de exibição. Antes de publicar episódios comerciais, obtenha autorização escrita para streaming, distribuição e monetização no Brasil. Nunca coloque segredos no frontend ou em repositórios públicos. Não habilite `CONTENT_LICENSE_CONFIRMED=true` sem documentação; mesmo habilitada, a rota de playback retorna 501 porque o adaptador de vídeo ainda não existe.

## Próximas etapas
1. Validar a resposta real da APIShort e criar normalizador de catálogo.
2. Integrar Supabase com autenticação, banco e políticas RLS.
3. Criar administração protegida e sincronização agendada.
4. Implementar player de vídeos próprios/licenciados e legendas.
5. Testes E2E, monitoramento, rate limiting, política de privacidade/LGPD e publicação.
