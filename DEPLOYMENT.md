Guia de deploy e recomendações

Este documento resume formas recomendadas de deploy e variáveis importantes para este projeto de Feature Flags.

Visão geral

- Frontend: aplicação React (Vite) ou Next.js — hospedagem estática em Vercel/GitHub Pages ou server-side em Vercel.
- Backend: API (pode ser FastAPI em Python — excelente para portfólio — ou NestJS em Node.js).
- Banco: PostgreSQL
- Cache: Redis (usado para leituras rápidas de flags)

Opções de deploy recomendadas

- Vercel (frontend estático/SSR) + Fly / Render / Railway (backend)
- Ou: frontend estático em CDN + backend containerizado (GHCR) em provedor de sua preferência

Variáveis essenciais

- `DATABASE_URL` — string de conexão com PostgreSQL
- `REDIS_URL` — string de conexão com Redis
- `VITE_API_BASE_URL` — URL pública da API usada pelo frontend em tempo de build

Rodando localmente (rápido)

1) Subir infraestrutura local (Postgres + Redis):

```powershell
docker compose -f infra/docker-compose.yml up -d
```

2) Backend (exemplo Node atual):

```powershell
cd backend
copy .env.example .env
npm install
npm run dev
```

Se optar por FastAPI (Python), os passos serão similares: criar virtualenv, instalar dependências e rodar `uvicorn`.

3) Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Deploy automático (CI)

- Recomendo workflows GitHub Actions para:
  - build e deploy do frontend (Vercel/GitHub Pages)
  - build/push da imagem do backend para GHCR e deploy ao provedor (Fly/Render)

Notas finais

- A `VITE_API_BASE_URL` é embutida no bundle em tempo de build; para ambientes dinâmicos considere um pequeno proxy/entrypoint que injete a URL em runtime.
- Se quiser, eu adiciono workflows específicos para Fly, Vercel ou Docker Hub/GHCR conforme sua preferência.
