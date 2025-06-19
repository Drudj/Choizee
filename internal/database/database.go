package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

type DB struct {
	*sql.DB
}

// New создает новое подключение к SQLite базе данных
func New() (*DB, error) {
	// Создаем папку data если она не существует
	dataDir := "data"
	if _, err := os.Stat(dataDir); os.IsNotExist(err) {
		if err := os.MkdirAll(dataDir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create data directory: %w", err)
		}
	}

	dbPath := filepath.Join(dataDir, "choizee.db")
	
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Проверяем подключение
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	database := &DB{db}

	// Инициализируем схему
	if err := database.createSchema(); err != nil {
		return nil, fmt.Errorf("failed to create schema: %w", err)
	}

	return database, nil
}

// createSchema создает таблицы в базе данных
func (db *DB) createSchema() error {
	schema := `
	-- Таблица вакансий
	CREATE TABLE IF NOT EXISTS jobs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		description TEXT,
		requirements TEXT,
		criteria TEXT, -- JSON массив критериев оценки
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	-- Таблица кандидатов
	CREATE TABLE IF NOT EXISTS candidates (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		job_id INTEGER NOT NULL,
		name TEXT NOT NULL,
		email TEXT,
		phone TEXT,
		description TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
	);

	-- Таблица вопросов для интервью
	CREATE TABLE IF NOT EXISTS questions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		job_id INTEGER NOT NULL,
		text TEXT NOT NULL,
		criterion TEXT NOT NULL, -- Критерий, который проверяет вопрос
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
	);

	-- Таблица оценок кандидатов
	CREATE TABLE IF NOT EXISTS evaluations (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		candidate_id INTEGER NOT NULL,
		criterion TEXT NOT NULL,
		score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
		comments TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
		UNIQUE(candidate_id, criterion) -- Один критерий - одна оценка
	);

	-- Таблица ответов кандидатов на вопросы
	CREATE TABLE IF NOT EXISTS answers (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		candidate_id INTEGER NOT NULL,
		question_id INTEGER NOT NULL,
		answer_text TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
		FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
		UNIQUE(candidate_id, question_id) -- Один вопрос - один ответ
	);

	-- Индексы для производительности
	CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
	CREATE INDEX IF NOT EXISTS idx_questions_job_id ON questions(job_id);
	CREATE INDEX IF NOT EXISTS idx_evaluations_candidate_id ON evaluations(candidate_id);
	CREATE INDEX IF NOT EXISTS idx_answers_candidate_id ON answers(candidate_id);
	CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);

	-- Триггеры для автоматического обновления updated_at
	CREATE TRIGGER IF NOT EXISTS update_jobs_updated_at 
		AFTER UPDATE ON jobs
		BEGIN
			UPDATE jobs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
		END;

	CREATE TRIGGER IF NOT EXISTS update_candidates_updated_at 
		AFTER UPDATE ON candidates
		BEGIN
			UPDATE candidates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
		END;

	CREATE TRIGGER IF NOT EXISTS update_questions_updated_at 
		AFTER UPDATE ON questions
		BEGIN
			UPDATE questions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
		END;

	CREATE TRIGGER IF NOT EXISTS update_evaluations_updated_at 
		AFTER UPDATE ON evaluations
		BEGIN
			UPDATE evaluations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
		END;

	CREATE TRIGGER IF NOT EXISTS update_answers_updated_at 
		AFTER UPDATE ON answers
		BEGIN
			UPDATE answers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
		END;
	`

	_, err := db.Exec(schema)
	return err
}

// Close закрывает подключение к базе данных
func (db *DB) Close() error {
	return db.DB.Close()
} 