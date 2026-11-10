# =============================================================================
# UTARE ZIMEDU AI — Team Convenience Commands
# =============================================================================

.PHONY: help setup up down restart logs shell test lint typecheck ci clean

help:
	@echo "Utare ZIMEDU AI — Available Commands:"
	@echo "  make setup      - Copy .env.example to .env.local if not present"
	@echo "  make up         - Build and start the Docker container (http://localhost:3000)"
	@echo "  make down       - Stop running containers"
	@echo "  make restart    - Restart the web container"
	@echo "  make logs       - Tail live logs from the web container"
	@echo "  make shell      - Open an interactive bash shell inside the running container"
	@echo "  make lint       - Run ESLint inside the Docker container"
	@echo "  make typecheck  - Run TypeScript compiler checks inside the Docker container"
	@echo "  make test       - Run Vitest unit & integration tests inside the Docker container"
	@echo "  make ci         - Run full CI suite (lint + typecheck + test + build) in container"
	@echo "  make clean      - Stop containers and remove cached Docker volumes (fresh install)"

setup:
	@if [ ! -f .env.local ]; then cp .env.example .env.local && echo "Created .env.local from .env.example"; else echo ".env.local already exists"; fi

up: setup
	docker compose up --build

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f web

shell:
	docker compose exec web bash

lint:
	docker compose run --rm web npm run lint

typecheck:
	docker compose run --rm web npm run typecheck

test:
	docker compose run --rm web npm run test:ci

ci:
	docker compose run --rm web npm run ci

clean:
	docker compose down -v
