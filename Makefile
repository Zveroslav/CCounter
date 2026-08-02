.PHONY: app

up:
	@echo "Starting application..."
	@cd apps/server && npm run dev
