package services

import (
	"choizee/internal/database"
	"choizee/internal/models"
	"time"
)

type AnswerService struct {
	db *database.DB
}

func NewAnswerService(db *database.DB) *AnswerService {
	return &AnswerService{db: db}
}

// SaveAnswer сохраняет ответ кандидата на вопрос
func (s *AnswerService) SaveAnswer(answer *models.Answer) (*models.Answer, error) {
	now := time.Now()
	answer.CreatedAt = now
	answer.UpdatedAt = now

	query := `
		INSERT INTO answers (candidate_id, question_id, answer_text, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)
		RETURNING id
	`

	err := s.db.QueryRow(query, answer.CandidateID, answer.QuestionID, answer.AnswerText, answer.CreatedAt, answer.UpdatedAt).Scan(&answer.ID)
	if err != nil {
		return nil, err
	}

	return answer, nil
}

// GetAnswersByCandidate получает все ответы кандидата
func (s *AnswerService) GetAnswersByCandidate(candidateID int64) ([]models.Answer, error) {
	query := `
		SELECT id, candidate_id, question_id, answer_text, created_at, updated_at
		FROM answers
		WHERE candidate_id = ?
		ORDER BY question_id
	`

	rows, err := s.db.Query(query, candidateID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var answers []models.Answer
	for rows.Next() {
		var answer models.Answer
		err := rows.Scan(&answer.ID, &answer.CandidateID, &answer.QuestionID, &answer.AnswerText, &answer.CreatedAt, &answer.UpdatedAt)
		if err != nil {
			return nil, err
		}
		answers = append(answers, answer)
	}

	return answers, nil
}

// UpdateAnswer обновляет ответ
func (s *AnswerService) UpdateAnswer(id int64, answer *models.Answer) (*models.Answer, error) {
	answer.UpdatedAt = time.Now()

	query := `
		UPDATE answers
		SET answer_text = ?, updated_at = ?
		WHERE id = ?
	`

	_, err := s.db.Exec(query, answer.AnswerText, answer.UpdatedAt, id)
	if err != nil {
		return nil, err
	}

	answer.ID = id
	return answer, nil
}

// SaveCandidateAnswers сохраняет все ответы кандидата (batch operation)
func (s *AnswerService) SaveCandidateAnswers(candidateID int64, answers []models.Answer) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Сначала удаляем существующие ответы кандидата
	_, err = tx.Exec("DELETE FROM answers WHERE candidate_id = ?", candidateID)
	if err != nil {
		return err
	}

	// Затем вставляем новые ответы
	for _, answer := range answers {
		answer.CandidateID = candidateID
		answer.CreatedAt = time.Now()
		answer.UpdatedAt = time.Now()

		_, err = tx.Exec(
			"INSERT INTO answers (candidate_id, question_id, answer_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
			answer.CandidateID, answer.QuestionID, answer.AnswerText, answer.CreatedAt, answer.UpdatedAt,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}
