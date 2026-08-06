.PHONY: up client server build start\:prod start-prod clean

up: client server

client:
	@echo "Starting client on port 3031..."
	@cd apps/client && npm run dev -- --port 3031 &

server:
	@echo "Starting server..."
	@cd apps/server && npm run dev

build:
	@echo "Building client and server..."
	@cd apps/client && npm run build
	@cd apps/server && npm run build

start-prod: pm2-start
pm2-start:
	@echo "Starting app with PM2..."
	@pm2 start ecosystem.config.js

pm2-stop:
	@echo "Stopping PM2 app..."
	@pm2 stop ccounter-app

pm2-logs:
	@pm2 logs ccounter-app

clean:
	@echo "Stopping client and server..."
	@kill $$(lsof -ti :3031 -sTCP:LISTEN) 2>/dev/null || true
	@kill $$(lsof -ti :3000 -sTCP:LISTEN) 2>/dev/null || true
