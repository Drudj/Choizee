# Choizee - Makefile для упрощения работы с проектом

.PHONY: help start dev build clean install test deps

# Цвета для вывода
YELLOW := \033[33m
GREEN := \033[32m
BLUE := \033[34m
RED := \033[31m
RESET := \033[0m

help: ## Показать справку по командам
	@echo "$(BLUE)🎯 Choizee - Инструмент для оценки кандидатов$(RESET)"
	@echo ""
	@echo "$(YELLOW)Доступные команды:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-12s$(RESET) %s\n", $$1, $$2}'
	@echo ""

start: ## Запустить приложение (production режим)
	@echo "$(BLUE)🚀 Запуск Choizee...$(RESET)"
	@./start.sh

dev: ## Запустить в режиме разработки
	@echo "$(BLUE)🔧 Запуск в режиме разработки...$(RESET)"
	@./dev.sh

build: ## Собрать проект
	@echo "$(BLUE)🔨 Сборка проекта...$(RESET)"
	@echo "$(YELLOW)⚙️  Сборка Go backend...$(RESET)"
	@go build -o choizee cmd/main.go
	@echo "$(YELLOW)📦 Сборка React frontend...$(RESET)"
	@cd web && npm run build
	@echo "$(GREEN)✅ Сборка завершена$(RESET)"

install: deps ## Установить все зависимости
	
deps: ## Установить зависимости
	@echo "$(BLUE)📦 Установка зависимостей...$(RESET)"
	@echo "$(YELLOW)⚙️  Go модули...$(RESET)"
	@go mod download
	@go mod tidy
	@echo "$(YELLOW)📦 npm пакеты...$(RESET)"
	@cd web && npm install
	@echo "$(GREEN)✅ Зависимости установлены$(RESET)"

test: ## Запустить тесты
	@echo "$(BLUE)🧪 Запуск тестов...$(RESET)"
	@echo "$(YELLOW)⚙️  Go тесты...$(RESET)"
	@go test ./...
	@echo "$(YELLOW)📦 Frontend тесты...$(RESET)"
	@cd web && npm test
	@echo "$(GREEN)✅ Тесты пройдены$(RESET)"

clean: ## Очистить временные файлы
	@echo "$(BLUE)🧹 Очистка проекта...$(RESET)"
	@rm -f choizee main backend.log
	@rm -rf web/node_modules web/dist
	@echo "$(GREEN)✅ Проект очищен$(RESET)"

stop: ## Остановить все процессы Choizee
	@echo "$(BLUE)🛑 Остановка Choizee...$(RESET)"
	@pkill -f "choizee" || true
	@pkill -f "vite" || true
	@echo "$(GREEN)✅ Процессы остановлены$(RESET)"

check: ## Проверить установленные зависимости
	@echo "$(BLUE)🔍 Проверка системных требований...$(RESET)"
	@printf "$(YELLOW)Go: $(RESET)"
	@go version 2>/dev/null || echo "$(RED)❌ Не установлен$(RESET)"
	@printf "$(YELLOW)Node.js: $(RESET)"
	@node --version 2>/dev/null || echo "$(RED)❌ Не установлен$(RESET)"
	@printf "$(YELLOW)npm: $(RESET)"
	@npm --version 2>/dev/null || echo "$(RED)❌ Не установлен$(RESET)"

logs: ## Показать логи backend
	@echo "$(BLUE)📋 Логи backend:$(RESET)"
	@tail -f backend.log

# Значение по умолчанию
.DEFAULT_GOAL := help 