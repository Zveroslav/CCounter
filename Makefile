.PHONY: up client server clean

up: client server

client:
	@echo "Starting client on port 3031..."
	@cd apps/client && npm run dev -- --port 3031 &

server:
	@echo "Starting server..."
	@cd apps/server && npm run dev

clean:
	@echo "Stopping client and server..."
	@kill $$(lsof -ti :3031 -sTCP:LISTEN) 2>/dev/null || true
	@kill $$(lsof -ti :3000 -sTCP:LISTEN) 2>/dev/null || true
