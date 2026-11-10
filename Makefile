# =============================================================================
# UTARE ZISEDU AI — Team Convenience Commands
# =============================================================================

.PHONY: help setup up down restart logs shell test lint typecheck ci ci-local install-hooks safe-merge clean

help:
	@echo "Utare ZISEDU AI — Available Commands:"
	@echo "  make setup          - Copy .env.example to .env.local if not present"
	@echo "  make up             - Build and start the Docker container (http://localhost:3000)"
	@echo "  make down           - Stop running containers"
	@echo "  make restart        - Restart the web container"
	@echo "  make logs           - Tail live logs from the web container"
	@echo "  make shell          - Open an interactive bash shell inside the running container"
	@echo "  make lint           - Run ESLint inside the Docker container"
	@echo "  make typecheck      - Run TypeScript compiler checks inside the Docker container"
	@echo "  make test           - Run Vitest unit & integration tests inside the Docker container"
	@echo "  make ci             - Run full CI suite (lint + typecheck + test + build) in container"
	@echo "  make ci-local       - Run pre-push/pre-merge local CI verification gate"
	@echo "  make install-hooks  - Enable automatic git pre-push local CI verification hook"
	@echo "  make safe-merge     - Run local CI, push branch, watch GitHub CI, and merge PR only if green"
	@echo "  make clean          - Stop containers and remove cached Docker volumes (fresh install)"

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
	docker compose exec -T web npm run lint

typecheck:
	docker compose exec -T web npm run typecheck

test:
	docker compose exec -T web npm run test:ci

ci:
	./scripts/pre-push-ci-check.sh

ci-local:
	./scripts/pre-push-ci-check.sh

install-hooks:
	chmod +x .githooks/pre-push scripts/pre-push-ci-check.sh scripts/safe-pr-merge.sh
	git config core.hooksPath .githooks
	@echo "✓ Git pre-push hook installed (.githooks/pre-push -> scripts/pre-push-ci-check.sh)"

safe-merge:
	./scripts/safe-pr-merge.sh

clean:
	docker compose down -v
