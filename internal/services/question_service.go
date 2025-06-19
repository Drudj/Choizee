package services

import (
	"choizee/internal/database"
	"choizee/internal/models"
	"database/sql"
	"fmt"
	"time"
)

type QuestionService struct {
	db *database.DB
}

func NewQuestionService(db *database.DB) *QuestionService {
	return &QuestionService{db: db}
}

func (s *QuestionService) CreateQuestion(question *models.Question) (*models.Question, error) {
	query := `
		INSERT INTO questions (job_id, text, criterion, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := s.db.Exec(query, question.JobID, question.Text, question.Criterion, now, now)
	if err != nil {
		return nil, fmt.Errorf("failed to create question: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get question ID: %w", err)
	}

	question.ID = id
	question.CreatedAt = now
	question.UpdatedAt = now

	return question, nil
}

func (s *QuestionService) GetQuestionByID(id int64) (*models.Question, error) {
	query := `
		SELECT id, job_id, text, criterion, created_at, updated_at
		FROM questions
		WHERE id = ?
	`

	var question models.Question
	err := s.db.QueryRow(query, id).Scan(
		&question.ID, &question.JobID, &question.Text, &question.Criterion,
		&question.CreatedAt, &question.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("question not found")
		}
		return nil, fmt.Errorf("failed to get question: %w", err)
	}

	return &question, nil
}

func (s *QuestionService) GetQuestionsByJobID(jobID int64) ([]*models.Question, error) {
	query := `
		SELECT id, job_id, text, criterion, created_at, updated_at
		FROM questions
		WHERE job_id = ?
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query, jobID)
	if err != nil {
		return nil, fmt.Errorf("failed to get questions: %w", err)
	}
	defer rows.Close()

	var questions []*models.Question
	for rows.Next() {
		var question models.Question
		err := rows.Scan(
			&question.ID, &question.JobID, &question.Text, &question.Criterion,
			&question.CreatedAt, &question.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan question: %w", err)
		}
		questions = append(questions, &question)
	}

	return questions, nil
}

func (s *QuestionService) UpdateQuestion(id int64, question *models.Question) (*models.Question, error) {
	query := `
		UPDATE questions
		SET job_id = ?, text = ?, criterion = ?, updated_at = ?
		WHERE id = ?
	`

	now := time.Now()
	result, err := s.db.Exec(query, question.JobID, question.Text, question.Criterion, now, id)
	if err != nil {
		return nil, fmt.Errorf("failed to update question: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return nil, fmt.Errorf("question not found")
	}

	// Получаем обновленный вопрос
	return s.GetQuestionByID(id)
}

func (s *QuestionService) DeleteQuestion(id int64) error {
	query := `DELETE FROM questions WHERE id = ?`

	result, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete question: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("question not found")
	}

	return nil
}
