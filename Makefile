.PHONY: dev-up dev-down logs seed backend-shell

dev-up:
	docker compose -f infra/docker-compose.yml up -d --build

dev-down:
	docker compose -f infra/docker-compose.yml down

logs:
	docker compose -f infra/docker-compose.yml logs -f

seed:
	docker compose -f infra/docker-compose.yml exec backend python /app/seed.py

backend-shell:
	docker compose -f infra/docker-compose.yml exec backend /bin/sh
