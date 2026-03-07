# Sistema de Feature Flags

Projeto que simula um sistema de gestao de feature flags usado em produtos de grande escala.

## O que o sistema demonstra

- Ativação e desativação de funcionalidades sem novo deploy.
- Rollout percentual deterministico por usuario.
- Controle por ambiente (`DEV`, `STAGING`, `PROD`).
- Auditoria completa de mudancas para rastreabilidade.
- Dashboard operacional para time de produto e engenharia.

## Stack

- Backend: Node.js + Fastify + Prisma + PostgreSQL + Redis
- Frontend: React + Vite + TypeScript
- Infra local: Docker Compose

## Arquitetura

- `backend`: API REST para criar, listar, atualizar e avaliar flags.
- `frontend`: Dashboard React para operacao de flags e consulta de historico.
- `infra`: Banco e cache para ambiente local.

## Principais endpoints

- `POST /api/flags`: cria uma feature flag.
- `GET /api/flags`: lista flags, com filtro opcional por ambiente.
- `PATCH /api/flags/:id`: altera status, rollout, descricao e/ou ambiente.
- `GET /api/flags/:id/audit`: historico de mudancas da flag.
- `POST /api/flags/evaluate`: resolve se usuario entra no rollout.
- `GET /health`: healthcheck da API.

## Como rodar localmente

### 1. Subir banco e cache

No diretorio raiz:

```bash
copy infra/.env.example infra/.env
docker compose --env-file infra/.env -f infra/docker-compose.yml up -d
```

### 2. Configurar backend

```bash
cd backend
copy .env.example .env
## Edite o arquivo backend/.env e substitua <SENHA_DO_POSTGRES>
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

API tenta subir em `http://localhost:3333`.
Se a porta estiver ocupada, faz fallback automatico para as proximas (`3334`, `3335`, ...).

### 3. Configurar frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Dashboard em `http://localhost:5173`.
Se a porta estiver ocupada, o Vite escolhe a proxima porta disponivel automaticamente.

Se quiser apontar para outra URL da API, crie `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:3333/api
```

## Fluxo de uso sugerido

1. Criar uma flag com `enabled = false`.
2. Ativar flag e definir rollout em 10%.
3. Usar o simulador para validar quais usuarios entram no rollout.
4. Verificar auditoria para rastrear quem mudou o que.
5. Em caso de incidente, desativar instantaneamente pelo dashboard.

## Ideias de evolução

- Segmentacao por pais/plano/dispositivo.
- Regras por data e horario.
- Circuit breaker automatico por taxa de erro.
- Integracao com OpenTelemetry e alertas.
- Controle de permissao por perfis (RBAC).

