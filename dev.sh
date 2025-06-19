#!/bin/bash

# Choizee - Скрипт для режима разработки
# Запускает Go backend и React frontend в dev режиме с hot reload

set -e

echo "🔧 Запуск Choizee в режиме разработки..."
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

echo "📦 Установка зависимостей frontend (если нужно)..."
cd web
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

echo ""
echo "🚀 Запуск сервисов в режиме разработки..."
echo ""

# Запуск backend в режиме разработки
echo "⚙️  Запуск Go backend на http://localhost:8080..."
go run cmd/main.go > backend.log 2>&1 &
BACKEND_PID=$!

# Ожидание запуска backend
sleep 3

# Проверка, что backend запустился
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Ошибка запуска backend. Проверьте backend.log"
    exit 1
fi

echo "✅ Backend запущен (PID: $BACKEND_PID)"

# Запуск frontend в dev режиме
echo "🎨 Запуск React frontend в dev режиме на http://localhost:5173..."
cd web
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Ожидание запуска frontend
sleep 3

# Проверка, что frontend запустился
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Ошибка запуска frontend. Проверьте frontend.log"
    cleanup
fi

echo "✅ Frontend запущен (PID: $FRONTEND_PID)"
echo ""
echo "🌐 Приложения доступны на:"
echo "   • Backend API: http://localhost:8080"
echo "   • Frontend Dev: http://localhost:5173"
echo ""
echo "📋 Логи:"
echo "   • Backend: backend.log"
echo "   • Frontend: frontend.log"
echo ""
echo "💡 Для остановки нажмите Ctrl+C"
echo "🔄 Frontend перезагружается автоматически при изменениях"
echo ""

# Ожидание завершения
wait $BACKEND_PID $FRONTEND_PID 