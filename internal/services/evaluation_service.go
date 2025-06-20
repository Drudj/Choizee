package services

import (
	"choizee/internal/database"
	"choizee/internal/models"
	"fmt"
	"time"
)

type EvaluationService struct {
	db *database.DB
}

func NewEvaluationService(db *database.DB) *EvaluationService {
	return &EvaluationService{db: db}
}

// CreateEvaluation создает новую оценку
func (s *EvaluationService) CreateEvaluation(evaluation *models.Evaluation) (*models.Evaluation, error) {
	evaluation.CreatedAt = time.Now()
	evaluation.UpdatedAt = time.Now()

	query := `
		INSERT INTO evaluations (candidate_id, criterion_id, score, comments, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(candidate_id, criterion_id) DO UPDATE SET
			score = excluded.score,
			comments = excluded.comments,
			updated_at = excluded.updated_at
	`

	result, err := s.db.Exec(query,
		evaluation.CandidateID,
		evaluation.CriterionID,
		evaluation.Score,
		evaluation.Comments,
		evaluation.CreatedAt,
		evaluation.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create evaluation: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get last insert id: %w", err)
	}

	evaluation.ID = id
	return evaluation, nil
}

// GetEvaluationsByCandidate получает все оценки кандидата
func (s *EvaluationService) GetEvaluationsByCandidate(candidateID int64) ([]models.Evaluation, error) {
	query := `
		SELECT e.id, e.candidate_id, e.criterion_id, e.score, e.comments, e.created_at, e.updated_at,
		       c.name as criterion_name
		FROM evaluations e
		JOIN criteria c ON e.criterion_id = c.id
		WHERE e.candidate_id = ?
		ORDER BY c.display_order
	`

	rows, err := s.db.Query(query, candidateID)
	if err != nil {
		return nil, fmt.Errorf("failed to query evaluations: %w", err)
	}
	defer rows.Close()

	var evaluations []models.Evaluation
	for rows.Next() {
		var eval models.Evaluation
		err := rows.Scan(
			&eval.ID,
			&eval.CandidateID,
			&eval.CriterionID,
			&eval.Score,
			&eval.Comments,
			&eval.CreatedAt,
			&eval.UpdatedAt,
			&eval.CriterionName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan evaluation: %w", err)
		}
		evaluations = append(evaluations, eval)
	}

	return evaluations, nil
}

// UpdateEvaluation обновляет существующую оценку
func (s *EvaluationService) UpdateEvaluation(id int64, evaluation *models.Evaluation) (*models.Evaluation, error) {
	evaluation.UpdatedAt = time.Now()

	query := `
		UPDATE evaluations 
		SET score = ?, comments = ?, updated_at = ?
		WHERE id = ?
	`

	_, err := s.db.Exec(query,
		evaluation.Score,
		evaluation.Comments,
		evaluation.UpdatedAt,
		id,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update evaluation: %w", err)
	}

	evaluation.ID = id
	return evaluation, nil
}

// DeleteEvaluation удаляет оценку
func (s *EvaluationService) DeleteEvaluation(id int64) error {
	query := `DELETE FROM evaluations WHERE id = ?`

	_, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete evaluation: %w", err)
	}

	return nil
}

// SaveCandidateEvaluations сохраняет все оценки кандидата одной транзакцией
func (s *EvaluationService) SaveCandidateEvaluations(candidateID int64, evaluations []models.Evaluation) error {
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Удаляем существующие оценки кандидата
	_, err = tx.Exec("DELETE FROM evaluations WHERE candidate_id = ?", candidateID)
	if err != nil {
		return fmt.Errorf("failed to delete existing evaluations: %w", err)
	}

	// Вставляем новые оценки
	stmt, err := tx.Prepare(`
		INSERT INTO evaluations (candidate_id, criterion_id, score, comments, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	now := time.Now()
	for _, eval := range evaluations {
		_, err = stmt.Exec(
			candidateID,
			eval.CriterionID,
			eval.Score,
			eval.Comments,
			now,
			now,
		)
		if err != nil {
			return fmt.Errorf("failed to insert evaluation: %w", err)
		}
	}

	return tx.Commit()
}

// GetEvaluationsSummary получает сводку оценок для сравнения кандидатов
func (s *EvaluationService) GetEvaluationsSummary(jobID int64) ([]models.EvaluationSummary, error) {
	query := `
		SELECT 
			c.id,
			c.name,
			j.title,
			COALESCE(AVG(e.score), 0) as avg_score
		FROM candidates c
		JOIN jobs j ON c.job_id = j.id
		LEFT JOIN evaluations e ON c.id = e.candidate_id
		WHERE c.job_id = ?
		GROUP BY c.id, c.name, j.title
		ORDER BY avg_score DESC
	`

	rows, err := s.db.Query(query, jobID)
	if err != nil {
		return nil, fmt.Errorf("failed to query evaluation summary: %w", err)
	}
	defer rows.Close()

	var summaries []models.EvaluationSummary
	for rows.Next() {
		var summary models.EvaluationSummary
		err := rows.Scan(
			&summary.CandidateID,
			&summary.CandidateName,
			&summary.JobTitle,
			&summary.AverageScore,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan summary: %w", err)
		}

		// Получаем детальные оценки для каждого кандидата
		evaluations, err := s.GetEvaluationsByCandidate(summary.CandidateID)
		if err != nil {
			return nil, err
		}
		summary.Evaluations = evaluations

		// Формируем данные для диаграммы
		summary.ChartData = make(map[string]int)
		for _, eval := range evaluations {
			summary.ChartData[eval.CriterionName] = eval.Score
		}

		summaries = append(summaries, summary)
	}

	return summaries, nil
}
