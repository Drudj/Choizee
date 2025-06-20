-- Миграция: Переход от строковых критериев к ID-based структуре
-- Дата: 2025-06-19
-- Описание: Создаем отдельную таблицу критериев с уникальными ID

BEGIN TRANSACTION;

-- 1. Создаем новую таблицу критериев
CREATE TABLE IF NOT EXISTS criteria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE(job_id, name) -- Уникальное название в рамках вакансии
);

-- 2. Заполняем таблицу критериев из существующих данных
-- Извлекаем уникальные критерии из questions
INSERT INTO criteria (job_id, name, display_order)
SELECT DISTINCT 
    job_id, 
    criterion as name,
    ROW_NUMBER() OVER (PARTITION BY job_id ORDER BY MIN(created_at)) - 1 as display_order
FROM questions 
GROUP BY job_id, criterion
ORDER BY job_id, MIN(created_at);

-- 3. Создаем новую таблицу questions с criterion_id
CREATE TABLE questions_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    criterion_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (criterion_id) REFERENCES criteria(id) ON DELETE CASCADE
);

-- 4. Переносим данные из старой таблицы questions в новую
INSERT INTO questions_new (id, job_id, criterion_id, text, created_at, updated_at)
SELECT 
    q.id,
    q.job_id,
    c.id as criterion_id,
    q.text,
    q.created_at,
    q.updated_at
FROM questions q
INNER JOIN criteria c ON (q.job_id = c.job_id AND q.criterion = c.name);

-- 5. Создаем новую таблицу evaluations с criterion_id
CREATE TABLE evaluations_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL,
    criterion_id INTEGER NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    comments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (criterion_id) REFERENCES criteria(id) ON DELETE CASCADE,
    UNIQUE(candidate_id, criterion_id) -- Один критерий - одна оценка
);

-- 6. Переносим данные из evaluations (если есть)
INSERT INTO evaluations_new (id, candidate_id, criterion_id, score, comments, created_at, updated_at)
SELECT 
    e.id,
    e.candidate_id,
    c.id as criterion_id,
    e.score,
    e.comments,
    e.created_at,
    e.updated_at
FROM evaluations e
INNER JOIN candidates cand ON e.candidate_id = cand.id
INNER JOIN criteria c ON (cand.job_id = c.job_id AND e.criterion = c.name);

-- 7. Удаляем старые таблицы и переименовываем новые
DROP TABLE questions;
ALTER TABLE questions_new RENAME TO questions;

DROP TABLE evaluations;
ALTER TABLE evaluations_new RENAME TO evaluations;

-- 8. Обновляем поле criteria в таблице jobs - теперь это будет просто флаг что критерии определены
-- Критерии теперь хранятся в отдельной таблице
UPDATE jobs 
SET criteria = '[]' 
WHERE id IN (SELECT DISTINCT job_id FROM criteria);

-- 9. Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_criteria_job_id ON criteria(job_id);
CREATE INDEX IF NOT EXISTS idx_questions_criterion_id ON questions(criterion_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_criterion_id ON evaluations(criterion_id);

-- 10. Создаем триггеры для автоматического обновления updated_at
CREATE TRIGGER IF NOT EXISTS update_criteria_updated_at 
    AFTER UPDATE ON criteria
    BEGIN
        UPDATE criteria SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Пересоздаем триггеры для обновленных таблиц
DROP TRIGGER IF EXISTS update_questions_updated_at;
CREATE TRIGGER update_questions_updated_at 
    AFTER UPDATE ON questions
    BEGIN
        UPDATE questions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

DROP TRIGGER IF EXISTS update_evaluations_updated_at;
CREATE TRIGGER update_evaluations_updated_at 
    AFTER UPDATE ON evaluations
    BEGIN
        UPDATE evaluations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

COMMIT; 