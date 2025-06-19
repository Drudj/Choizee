package services

import (
	"choizee/internal/database"
	"choizee/internal/models"
	"database/sql"
	"fmt"
)

type CandidateService struct {
	db *database.DB
}

func NewCandidateService(db *database.DB) *CandidateService {
	return &CandidateService{db: db}
}

// CreateCandidate создает нового кандидата
func (s *CandidateService) CreateCandidate(candidate *models.Candidate) (*models.Candidate, error) {
	query := `
		INSERT INTO candidates (job_id, name, email, phone, description) 
		VALUES (?, ?, ?, ?, ?)
	`

	result, err := s.db.Exec(query, candidate.JobID, candidate.Name, candidate.Email, candidate.Phone, candidate.Description)
	if err != nil {
		return nil, fmt.Errorf("failed to create candidate: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get last insert id: %w", err)
	}

	candidate.ID = id
	return s.GetCandidateByID(id)
}

// GetCandidateByID получает кандидата по ID
func (s *CandidateService) GetCandidateByID(id int64) (*models.Candidate, error) {
	query := `
		SELECT id, job_id, name, email, phone, description, created_at, updated_at 
		FROM candidates 
		WHERE id = ?
	`

	var candidate models.Candidate
	err := s.db.QueryRow(query, id).Scan(
		&candidate.ID, &candidate.JobID, &candidate.Name, &candidate.Email,
		&candidate.Phone, &candidate.Description, &candidate.CreatedAt, &candidate.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("candidate not found")
		}
		return nil, fmt.Errorf("failed to get candidate: %w", err)
	}

	return &candidate, nil
}

// GetCandidatesByJobID получает всех кандидатов для вакансии
func (s *CandidateService) GetCandidatesByJobID(jobID int64) ([]models.CandidateWithJob, error) {
	query := `
		SELECT c.id, c.job_id, c.name, c.email, c.phone, c.description, 
		       c.created_at, c.updated_at, j.title as job_title
		FROM candidates c
		JOIN jobs j ON c.job_id = j.id
		WHERE c.job_id = ?
		ORDER BY c.created_at DESC
	`

	rows, err := s.db.Query(query, jobID)
	if err != nil {
		return nil, fmt.Errorf("failed to get candidates: %w", err)
	}
	defer rows.Close()

	var candidates []models.CandidateWithJob
	for rows.Next() {
		var candidate models.CandidateWithJob
		err := rows.Scan(
			&candidate.ID, &candidate.JobID, &candidate.Name, &candidate.Email,
			&candidate.Phone, &candidate.Description, &candidate.CreatedAt,
			&candidate.UpdatedAt, &candidate.JobTitle,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan candidate: %w", err)
		}
		candidates = append(candidates, candidate)
	}

	return candidates, nil
}

// UpdateCandidate обновляет кандидата
func (s *CandidateService) UpdateCandidate(id int64, candidate *models.Candidate) (*models.Candidate, error) {
	query := `
		UPDATE candidates 
		SET job_id = ?, name = ?, email = ?, phone = ?, description = ?
		WHERE id = ?
	`

	_, err := s.db.Exec(query, candidate.JobID, candidate.Name, candidate.Email, candidate.Phone, candidate.Description, id)
	if err != nil {
		return nil, fmt.Errorf("failed to update candidate: %w", err)
	}

	return s.GetCandidateByID(id)
}

// DeleteCandidate удаляет кандидата
func (s *CandidateService) DeleteCandidate(id int64) error {
	query := `DELETE FROM candidates WHERE id = ?`

	result, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete candidate: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("candidate not found")
	}

	return nil
}
