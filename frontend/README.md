# Frontend (React + TypeScript + Vite)

Pequena introdução e instruções rápidas para rodar o dashboard localmente.

Como rodar em desenvolvimento

```powershell
cd frontend
npm install
npm run dev
```

O Vite inicia o servidor de desenvolvimento (HMR). Por padrão o dashboard abre em `http://localhost:5173`.

Configurar a URL da API

Crie `frontend/.env` ou `frontend/.env.local` com a variável:

```
VITE_API_BASE_URL=http://localhost:3333/api
```

Produção / build

```powershell
npm run build
npm run preview
```

Boas práticas

- Use `VITE_API_BASE_URL` em tempo de build para apontar para a API pública.
- Para cenários onde a URL da API precisa ser alterada em runtime, considere um pequeno proxy ou arquivo de configuração injetado no container.

Se desejar, posso adaptar este frontend para Next.js (SSR) ou adicionar exemplos de integração com a API (ex: hooks para avaliação de flags). 
