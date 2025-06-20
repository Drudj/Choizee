package services

import (
	"choizee/internal/database"
	"choizee/internal/models"
	"database/sql"
	"fmt"
)

type QuestionService struct {
	db *database.DB
}

func NewQuestionService(db *database.DB) *QuestionService {
	return &QuestionService{db: db}
}

// CreateQuestion создает новый вопрос
func (s *QuestionService) CreateQuestion(question *models.Question) (*models.Question, error) {
	query := `
		INSERT INTO questions (job_id, criterion_id, text) 
		VALUES (?, ?, ?)
	`

	result, err := s.db.Exec(query, question.JobID, question.CriterionID, question.Text)
	if err != nil {
		return nil, fmt.Errorf("failed to create question: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get last insert id: %w", err)
	}

	question.ID = id
	return s.GetQuestionByID(id)
}

// GetQuestionByID получает вопрос по ID
func (s *QuestionService) GetQuestionByID(id int64) (*models.Question, error) {
	query := `
		SELECT q.id, q.job_id, q.criterion_id, q.text, q.created_at, q.updated_at,
		       c.name as criterion_name
		FROM questions q
		JOIN criteria c ON q.criterion_id = c.id
		WHERE q.id = ?
	`

	var question models.Question
	err := s.db.QueryRow(query, id).Scan(
		&question.ID, &question.JobID, &question.CriterionID, &question.Text,
		&question.CreatedAt, &question.UpdatedAt, &question.CriterionName,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("question not found")
		}
		return nil, fmt.Errorf("failed to get question: %w", err)
	}

	return &question, nil
}

// GetJobQuestions получает все вопросы для вакансии
func (s *QuestionService) GetJobQuestions(jobID int64) ([]models.Question, error) {
	query := `
		SELECT q.id, q.job_id, q.criterion_id, q.text, q.created_at, q.updated_at,
		       c.name as criterion_name, c.display_order
		FROM questions q
		JOIN criteria c ON q.criterion_id = c.id
		WHERE q.job_id = ?
		ORDER BY c.display_order ASC, q.created_at ASC
	`

	rows, err := s.db.Query(query, jobID)
	if err != nil {
		return nil, fmt.Errorf("failed to get questions: %w", err)
	}
	defer rows.Close()

	var questions []models.Question
	for rows.Next() {
		var question models.Question
		var displayOrder int
		err := rows.Scan(
			&question.ID, &question.JobID, &question.CriterionID, &question.Text,
			&question.CreatedAt, &question.UpdatedAt, &question.CriterionName, &displayOrder,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan question: %w", err)
		}
		questions = append(questions, question)
	}

	return questions, nil
}

// GetCriterionQuestions получает все вопросы для критерия
func (s *QuestionService) GetCriterionQuestions(criterionID int64) ([]models.Question, error) {
	query := `
		SELECT q.id, q.job_id, q.criterion_id, q.text, q.created_at, q.updated_at,
		       c.name as criterion_name
		FROM questions q
		JOIN criteria c ON q.criterion_id = c.id
		WHERE q.criterion_id = ?
		ORDER BY q.created_at ASC
	`

	rows, err := s.db.Query(query, criterionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get criterion questions: %w", err)
	}
	defer rows.Close()

	var questions []models.Question
	for rows.Next() {
		var question models.Question
		err := rows.Scan(
			&question.ID, &question.JobID, &question.CriterionID, &question.Text,
			&question.CreatedAt, &question.UpdatedAt, &question.CriterionName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan question: %w", err)
		}
		questions = append(questions, question)
	}

	return questions, nil
}

// UpdateQuestion обновляет вопрос
func (s *QuestionService) UpdateQuestion(id int64, question *models.Question) (*models.Question, error) {
	query := `
		UPDATE questions 
		SET criterion_id = ?, text = ?
		WHERE id = ?
	`

	_, err := s.db.Exec(query, question.CriterionID, question.Text, id)
	if err != nil {
		return nil, fmt.Errorf("failed to update question: %w", err)
	}

	return s.GetQuestionByID(id)
}

// DeleteQuestion удаляет вопрос
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

// GetQuestionsWithCriteria получает вопросы с полной информацией о критериях
func (s *QuestionService) GetQuestionsWithCriteria(jobID int64) ([]models.QuestionWithCriterion, error) {
	query := `
		SELECT q.id, q.job_id, q.criterion_id, q.text, q.created_at, q.updated_at,
		       c.id, c.job_id, c.name, c.display_order, c.created_at, c.updated_at
		FROM questions q
		JOIN criteria c ON q.criterion_id = c.id
		WHERE q.job_id = ?
		ORDER BY c.display_order ASC, q.created_at ASC
	`

	rows, err := s.db.Query(query, jobID)
	if err != nil {
		return nil, fmt.Errorf("failed to get questions with criteria: %w", err)
	}
	defer rows.Close()

	var questions []models.QuestionWithCriterion
	for rows.Next() {
		var qwc models.QuestionWithCriterion
		err := rows.Scan(
			&qwc.Question.ID, &qwc.Question.JobID, &qwc.Question.CriterionID, &qwc.Question.Text,
			&qwc.Question.CreatedAt, &qwc.Question.UpdatedAt,
			&qwc.Criterion.ID, &qwc.Criterion.JobID, &qwc.Criterion.Name, &qwc.Criterion.DisplayOrder,
			&qwc.Criterion.CreatedAt, &qwc.Criterion.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan question with criterion: %w", err)
		}
		questions = append(questions, qwc)
	}

	return questions, nil
}
