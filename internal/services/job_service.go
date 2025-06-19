package services

import (
	"choizee/internal/database"
	"choizee/internal/models"
	"database/sql"
	"fmt"
)

type JobService struct {
	db *database.DB
}

func NewJobService(db *database.DB) *JobService {
	return &JobService{db: db}
}

// CreateJob создает новую вакансию
func (s *JobService) CreateJob(job *models.Job) (*models.Job, error) {
	query := `
		INSERT INTO jobs (title, description, requirements, criteria) 
		VALUES (?, ?, ?, ?)
	`
	
	result, err := s.db.Exec(query, job.Title, job.Description, job.Requirements, job.Criteria)
	if err != nil {
		return nil, fmt.Errorf("failed to create job: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get last insert id: %w", err)
	}

	job.ID = id
	return s.GetJobByID(id)
}

// GetJobByID получает вакансию по ID
func (s *JobService) GetJobByID(id int64) (*models.Job, error) {
	query := `
		SELECT id, title, description, requirements, criteria, created_at, updated_at 
		FROM jobs 
		WHERE id = ?
	`
	
	var job models.Job
	err := s.db.QueryRow(query, id).Scan(
		&job.ID, &job.Title, &job.Description, &job.Requirements, 
		&job.Criteria, &job.CreatedAt, &job.UpdatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("job not found")
		}
		return nil, fmt.Errorf("failed to get job: %w", err)
	}

	return &job, nil
}

// GetAllJobs получает все вакансии
func (s *JobService) GetAllJobs() ([]models.Job, error) {
	query := `
		SELECT id, title, description, requirements, criteria, created_at, updated_at 
		FROM jobs 
		ORDER BY created_at DESC
	`
	
	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get jobs: %w", err)
	}
	defer rows.Close()

	var jobs []models.Job
	for rows.Next() {
		var job models.Job
		err := rows.Scan(
			&job.ID, &job.Title, &job.Description, &job.Requirements,
			&job.Criteria, &job.CreatedAt, &job.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan job: %w", err)
		}
		jobs = append(jobs, job)
	}

	return jobs, nil
}

// UpdateJob обновляет вакансию
func (s *JobService) UpdateJob(id int64, job *models.Job) (*models.Job, error) {
	query := `
		UPDATE jobs 
		SET title = ?, description = ?, requirements = ?, criteria = ?
		WHERE id = ?
	`
	
	_, err := s.db.Exec(query, job.Title, job.Description, job.Requirements, job.Criteria, id)
	if err != nil {
		return nil, fmt.Errorf("failed to update job: %w", err)
	}

	return s.GetJobByID(id)
}

// DeleteJob удаляет вакансию
func (s *JobService) DeleteJob(id int64) error {
	query := `DELETE FROM jobs WHERE id = ?`
	
	result, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete job: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("job not found")
	}

	return nil
}

// GetJobCandidatesCount получает количество кандидатов для вакансии
func (s *JobService) GetJobCandidatesCount(jobID int64) (int, error) {
	query := `SELECT COUNT(*) FROM candidates WHERE job_id = ?`
	
	var count int
	err := s.db.QueryRow(query, jobID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get candidates count: %w", err)
	}

	return count, nil
} 