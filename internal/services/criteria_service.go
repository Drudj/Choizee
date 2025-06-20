package services

import (
	"choizee/internal/database"
	"choizee/internal/models"
	"database/sql"
	"fmt"
)

type CriteriaService struct {
	db *database.DB
}

func NewCriteriaService(db *database.DB) *CriteriaService {
	return &CriteriaService{db: db}
}

// GetJobCriteria получает все критерии для вакансии
func (s *CriteriaService) GetJobCriteria(jobID int64) ([]models.Criterion, error) {
	query := `
		SELECT id, job_id, name, display_order, created_at, updated_at 
		FROM criteria 
		WHERE job_id = ? 
		ORDER BY display_order ASC, created_at ASC
	`

	rows, err := s.db.Query(query, jobID)
	if err != nil {
		return nil, fmt.Errorf("failed to get criteria: %w", err)
	}
	defer rows.Close()

	var criteria []models.Criterion
	for rows.Next() {
		var c models.Criterion
		err := rows.Scan(&c.ID, &c.JobID, &c.Name, &c.DisplayOrder, &c.CreatedAt, &c.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan criterion: %w", err)
		}
		criteria = append(criteria, c)
	}

	return criteria, nil
}

// CreateCriterion создает новый критерий
func (s *CriteriaService) CreateCriterion(criterion models.Criterion) (*models.Criterion, error) {
	// Если display_order не указан, ставим в конец
	if criterion.DisplayOrder == 0 {
		var maxOrder int
		err := s.db.QueryRow("SELECT COALESCE(MAX(display_order), -1) FROM criteria WHERE job_id = ?", criterion.JobID).Scan(&maxOrder)
		if err != nil && err != sql.ErrNoRows {
			return nil, fmt.Errorf("failed to get max display order: %w", err)
		}
		criterion.DisplayOrder = maxOrder + 1
	}

	query := `
		INSERT INTO criteria (job_id, name, display_order) 
		VALUES (?, ?, ?) 
		RETURNING id, created_at, updated_at
	`

	err := s.db.QueryRow(query, criterion.JobID, criterion.Name, criterion.DisplayOrder).Scan(
		&criterion.ID, &criterion.CreatedAt, &criterion.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create criterion: %w", err)
	}

	return &criterion, nil
}

// UpdateCriterion обновляет критерий
func (s *CriteriaService) UpdateCriterion(id int64, update models.CriterionUpdate) (*models.Criterion, error) {
	query := `
		UPDATE criteria 
		SET name = ?, display_order = ? 
		WHERE id = ? 
		RETURNING id, job_id, name, display_order, created_at, updated_at
	`

	var criterion models.Criterion
	err := s.db.QueryRow(query, update.Name, update.DisplayOrder, id).Scan(
		&criterion.ID, &criterion.JobID, &criterion.Name, &criterion.DisplayOrder,
		&criterion.CreatedAt, &criterion.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("criterion not found")
		}
		return nil, fmt.Errorf("failed to update criterion: %w", err)
	}

	return &criterion, nil
}

// DeleteCriterion удаляет критерий
func (s *CriteriaService) DeleteCriterion(id int64) error {
	// Проверяем, есть ли связанные вопросы
	var questionCount int
	err := s.db.QueryRow("SELECT COUNT(*) FROM questions WHERE criterion_id = ?", id).Scan(&questionCount)
	if err != nil {
		return fmt.Errorf("failed to check questions count: %w", err)
	}

	if questionCount > 0 {
		return fmt.Errorf("cannot delete criterion: %d questions are associated with it", questionCount)
	}

	// Проверяем, есть ли связанные оценки
	var evaluationCount int
	err = s.db.QueryRow("SELECT COUNT(*) FROM evaluations WHERE criterion_id = ?", id).Scan(&evaluationCount)
	if err != nil {
		return fmt.Errorf("failed to check evaluations count: %w", err)
	}

	if evaluationCount > 0 {
		return fmt.Errorf("cannot delete criterion: %d evaluations are associated with it", evaluationCount)
	}

	query := "DELETE FROM criteria WHERE id = ?"
	result, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete criterion: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("criterion not found")
	}

	return nil
}

// ReorderCriteria обновляет порядок отображения критериев
func (s *CriteriaService) ReorderCriteria(jobID int64, criteriaIDs []int64) error {
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	query := "UPDATE criteria SET display_order = ? WHERE id = ? AND job_id = ?"

	for i, criterionID := range criteriaIDs {
		_, err := tx.Exec(query, i, criterionID, jobID)
		if err != nil {
			return fmt.Errorf("failed to update criterion order: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetCriterionByID получает критерий по ID
func (s *CriteriaService) GetCriterionByID(id int64) (*models.Criterion, error) {
	query := `
		SELECT id, job_id, name, display_order, created_at, updated_at 
		FROM criteria 
		WHERE id = ?
	`

	var criterion models.Criterion
	err := s.db.QueryRow(query, id).Scan(
		&criterion.ID, &criterion.JobID, &criterion.Name, &criterion.DisplayOrder,
		&criterion.CreatedAt, &criterion.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("criterion not found")
		}
		return nil, fmt.Errorf("failed to get criterion: %w", err)
	}

	return &criterion, nil
}

// UpdateJobCriteria полностью заменяет критерии вакансии
func (s *CriteriaService) UpdateJobCriteria(jobID int64, criteriaNames []string) ([]models.Criterion, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Получаем существующие критерии упорядоченные по display_order
	existingCriteria, err := s.GetJobCriteria(jobID)
	if err != nil {
		return nil, fmt.Errorf("failed to get existing criteria: %w", err)
	}

	var result []models.Criterion

	// Обрабатываем критерии по позициям
	for i, name := range criteriaNames {
		if i < len(existingCriteria) {
			// Обновляем существующий критерий (может изменяться название и порядок)
			existing := existingCriteria[i]
			_, err := tx.Exec("UPDATE criteria SET name = ?, display_order = ? WHERE id = ?",
				name, i, existing.ID)
			if err != nil {
				return nil, fmt.Errorf("failed to update criterion: %w", err)
			}

			// Обновляем данные для ответа
			existing.Name = name
			existing.DisplayOrder = i
			result = append(result, existing)
		} else {
			// Создаем новый критерий (если критериев стало больше)
			var newCriterion models.Criterion
			err := tx.QueryRow(
				"INSERT INTO criteria (job_id, name, display_order) VALUES (?, ?, ?) RETURNING id, created_at, updated_at",
				jobID, name, i,
			).Scan(&newCriterion.ID, &newCriterion.CreatedAt, &newCriterion.UpdatedAt)
			if err != nil {
				return nil, fmt.Errorf("failed to create criterion: %w", err)
			}
			newCriterion.JobID = jobID
			newCriterion.Name = name
			newCriterion.DisplayOrder = i
			result = append(result, newCriterion)
		}
	}

	// Удаляем лишние критерии (если критериев стало меньше)
	for i := len(criteriaNames); i < len(existingCriteria); i++ {
		criterion := existingCriteria[i]

		// Проверяем наличие связанных данных
		var questionCount, evaluationCount int
		err = tx.QueryRow("SELECT COUNT(*) FROM questions WHERE criterion_id = ?", criterion.ID).Scan(&questionCount)
		if err != nil {
			return nil, fmt.Errorf("failed to check questions count: %w", err)
		}
		err = tx.QueryRow("SELECT COUNT(*) FROM evaluations WHERE criterion_id = ?", criterion.ID).Scan(&evaluationCount)
		if err != nil {
			return nil, fmt.Errorf("failed to check evaluations count: %w", err)
		}

		if questionCount > 0 || evaluationCount > 0 {
			return nil, fmt.Errorf("cannot delete criterion '%s': it has %d questions and %d evaluations",
				criterion.Name, questionCount, evaluationCount)
		}

		_, err := tx.Exec("DELETE FROM criteria WHERE id = ?", criterion.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to delete criterion: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return result, nil
}
