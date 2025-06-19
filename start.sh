#!/bin/bash

# Choizee - Скрипт запуска приложения
# Запускает Go backend и React frontend одновременно

set -e

echo "🎯 Запуск Choizee..."
echo ""

# Функция для завершения всех процессов
cleanup() {
    echo ""
    echo "🛑 Завершение работы..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    exit 0
}

# Установка обработчика сигналов
trap cleanup SIGINT SIGTERM

# Проверка наличия Go
if ! command -v go &> /dev/null; then
    echo "❌ Go не установлен. Установите Go с https://golang.org/dl/"
    exit 1
fi

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js с https://nodejs.org/"
    exit 1
fi

# Проверка наличия npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен. Обычно идет в комплекте с Node.js"
    exit 1
fi

# Создание директории для данных, если не существует
mkdir -p data

echo "🔧 Сборка Go backend..."
go build -o choizee cmd/main.go

echo "📦 Установка зависимостей frontend..."
cd web
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "🎨 Сборка frontend..."
npm run build
cd ..

echo ""
echo "🚀 Запуск сервисов..."
echo ""

# Запуск backend
echo "⚙️  Запуск Go backend на http://localhost:8080..."
./choizee > backend.log 2>&1 &
BACKEND_PID=$!

# Ожидание запуска backend
sleep 3

# Проверка, что backend запустился
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Ошибка запуска backend. Проверьте backend.log"
    exit 1
fi

echo "✅ Backend запущен (PID: $BACKEND_PID)"
echo ""
echo "🌐 Приложение доступно на: http://localhost:8080"
echo ""
echo "📋 Логи backend: backend.log"
echo "💡 Для остановки нажмите Ctrl+C"
echo ""

# Ожидание завершения
wait $BACKEND_PID 