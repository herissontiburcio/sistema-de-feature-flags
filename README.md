# Sistema de Feature Flags

Plataforma para gerenciar feature flags, com foco em rollout percentual, controle por ambiente e auditoria de mudanças.

OBS: substitua `OWNER/REPO` no badge se for adicionar integração de CI.

Por que usar feature flags

- Ativação e desativação de funcionalidades sem novo deploy.
- Rollout percentual determinístico por usuário.
- Controle por ambiente (`dev`, `staging`, `prod`).
- Auditoria de mudanças para rastreabilidade.

Exemplo prático

1. Cria-se a flag `nova-homepage = OFF`.
2. Libera para 10% dos usuários (`rollout = 10`).
3. Se houver problema, desativa imediatamente.

Funcionalidades sugeridas

- Criação de flags
- Ativar / desativar (on/off)
- Rollout percentual (por usuário ou por key)
- Controle por ambiente
- Auditoria e histórico de alterações

Como rodar localmente (exemplo com SQLite para desenvolvimento)

```bash
copy infra/.env.example infra/.env
docker compose --env-file infra/.env -f infra/docker-compose.yml up -d
cd backend
copy .env.example .env
# Ajuste backend/.env para apontar para seu Postgres ou deixe em branco para usar SQLite
python -m pip install -r requirements.txt
pytest
```

Arquitetura recomendada

Frontend (React)
→ API (FastAPI / Node)
→ PostgreSQL
→ Redis (cache)

Estrutura do repositório

- `backend/` — código da API.
- `frontend/` — dashboard em React + Vite.
- `infra/` — compose e exemplos para rodar PostgreSQL + Redis localmente.

Próximos passos

- Implementar endpoints para criação/alteração/avaliação de flags e auditoria.
- Adicionar testes de integração.
- Preparar CI/CD e variáveis de ambiente para produção.

Se quiser, eu posso ajustar o backend para `FastAPI` ou `NestJS` conforme sua preferência.

Contribuição e segurança

- Este repositório inclui um arquivo de configuração para `pre-commit` que previne
	commits contendo chaves privadas, credenciais AWS e arquivos muito grandes.

Para habilitar localmente, rode:

```bash
python -m pip install --user pre-commit
pre-commit install
# (opcional) checar todo o repositório agora:
pre-commit run --all-files
```

Isso ajuda a evitar vazamento de segredos em commits futuros.

