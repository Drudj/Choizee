package models

import (
	"time"
)

// Job представляет вакансию
type Job struct {
	ID           int64     `json:"id" db:"id"`
	Title        string    `json:"title" db:"title"`
	Description  string    `json:"description" db:"description"`
	Requirements string    `json:"requirements" db:"requirements"`
	Criteria     string    `json:"criteria" db:"criteria"` // Deprecated: Теперь используется таблица criteria
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// Criterion представляет критерий оценки
type Criterion struct {
	ID           int64     `json:"id" db:"id"`
	JobID        int64     `json:"job_id" db:"job_id"`
	Name         string    `json:"name" db:"name"`
	DisplayOrder int       `json:"display_order" db:"display_order"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// Candidate представляет кандидата
type Candidate struct {
	ID          int64     `json:"id" db:"id"`
	JobID       int64     `json:"job_id" db:"job_id"`
	Name        string    `json:"name" db:"name"`
	Email       string    `json:"email" db:"email"`
	Phone       string    `json:"phone" db:"phone"`
	Description string    `json:"description" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// Question представляет вопрос для интервью
type Question struct {
	ID          int64     `json:"id" db:"id"`
	JobID       int64     `json:"job_id" db:"job_id"`
	CriterionID int64     `json:"criterion_id" db:"criterion_id"`
	Text        string    `json:"text" db:"text"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`

	// Поля для JOIN запросов
	CriterionName string `json:"criterion_name,omitempty" db:"criterion_name"`
}

// QuestionWithCriterion расширенная версия вопроса с информацией о критерии
type QuestionWithCriterion struct {
	Question
	Criterion Criterion `json:"criterion"`
}

// Evaluation представляет оценку кандидата
type Evaluation struct {
	ID          int64     `json:"id" db:"id"`
	CandidateID int64     `json:"candidate_id" db:"candidate_id"`
	CriterionID int64     `json:"criterion_id" db:"criterion_id"`
	Score       int       `json:"score" db:"score"` // Оценка по шкале 1-10
	Comments    string    `json:"comments" db:"comments"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`

	// Поля для JOIN запросов
	CriterionName string `json:"criterion_name,omitempty" db:"criterion_name"`
}

// Answer представляет ответ кандидата на вопрос
type Answer struct {
	ID          int64     `json:"id" db:"id"`
	CandidateID int64     `json:"candidate_id" db:"candidate_id"`
	QuestionID  int64     `json:"question_id" db:"question_id"`
	AnswerText  string    `json:"answer_text" db:"answer_text"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// CandidateWithJob представляет кандидата с информацией о вакансии
type CandidateWithJob struct {
	Candidate
	JobTitle string `json:"job_title"`
}

// EvaluationSummary представляет сводку оценок кандидата
type EvaluationSummary struct {
	CandidateID   int64          `json:"candidate_id"`
	CandidateName string         `json:"candidate_name"`
	JobTitle      string         `json:"job_title"`
	Evaluations   []Evaluation   `json:"evaluations"`
	AverageScore  float64        `json:"average_score"`
	ChartData     map[string]int `json:"chart_data"` // Данные для радар-диаграммы
}

// JobWithCriteria представляет вакансию с критериями
type JobWithCriteria struct {
	Job
	Criteria []Criterion `json:"criteria_list"`
}

// CriterionUpdate представляет данные для обновления критерия
type CriterionUpdate struct {
	Name         string `json:"name"`
	DisplayOrder int    `json:"display_order"`
}

// AIRecommendationRequest представляет запрос для AI рекомендаций
type AIRecommendationRequest struct {
	JobTitle     string   `json:"job_title"`
	Description  string   `json:"description,omitempty"`
	Requirements string   `json:"requirements,omitempty"`
	Criteria     []string `json:"criteria,omitempty"`
}

// AIRecommendationResponse представляет ответ AI рекомендаций
type AIRecommendationResponse struct {
	Recommendations []string `json:"recommendations"`
	Type            string   `json:"type"` // "requirements" или "questions"
}
