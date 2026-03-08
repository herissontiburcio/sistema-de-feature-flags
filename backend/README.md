# Backend (FastAPI) — esqueleto

Passos rápidos para rodar o backend FastAPI localmente (esqueleto criado automaticamente).

1. Instale dependências (recomendado em virtualenv):

```powershell
cd backend
python -m pip install -r requirements.txt
```

2. Configure `.env` com a sua `DATABASE_URL` (veja `.env.example`).

3. Rode a API em desenvolvimento:

```powershell
cd backend
uvicorn app.main:app --reload --port 8000
```

Endpoints principais

- `POST /api/flags` — criar flag
- `GET /api/flags` — listar flags (filtro por `environment` opcional)
- `PATCH /api/flags/{id}` — atualizar flag
- `GET /api/flags/{id}/audit` — histórico da flag
- `POST /api/flags/evaluate` — avaliar se um usuário está no rollout

Seed de exemplo & comandos úteis

- Para popular uma flag de exemplo (`nova-homepage`):

```powershell
# usando o Makefile (repositório)
make seed

# ou diretamente no container (após docker compose up):
docker compose -f infra/docker-compose.yml exec backend python /app/seed.py
```

- Com o `Makefile` disponível na raiz, você também pode usar:
	- `make dev-up` — sobe infra e backend (build)
	- `make dev-down` — derruba os serviços
	- `make logs` — acompanhar logs

