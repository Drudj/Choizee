package api

import (
	"choizee/internal/models"
	"choizee/internal/services"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

type Handlers struct {
	jobService        *services.JobService
	candidateService  *services.CandidateService
	questionService   *services.QuestionService
	evaluationService *services.EvaluationService
	templateService   *services.TemplateService
	answerService     *services.AnswerService
	criteriaService   *services.CriteriaService
}

func NewHandlers(jobService *services.JobService, candidateService *services.CandidateService, questionService *services.QuestionService, evaluationService *services.EvaluationService, templateService *services.TemplateService, answerService *services.AnswerService, criteriaService *services.CriteriaService) *Handlers {
	return &Handlers{
		jobService:        jobService,
		candidateService:  candidateService,
		questionService:   questionService,
		evaluationService: evaluationService,
		templateService:   templateService,
		answerService:     answerService,
		criteriaService:   criteriaService,
	}
}

// Jobs handlers

func (h *Handlers) CreateJob(w http.ResponseWriter, r *http.Request) {
	var job models.Job
	if err := json.NewDecoder(r.Body).Decode(&job); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	createdJob, err := h.jobService.CreateJob(&job)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(createdJob)
}

func (h *Handlers) GetJob(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}

	job, err := h.jobService.GetJobByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(job)
}

func (h *Handlers) GetAllJobs(w http.ResponseWriter, r *http.Request) {
	jobs, err := h.jobService.GetAllJobs()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(jobs)
}

func (h *Handlers) UpdateJob(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}

	var job models.Job
	if err := json.NewDecoder(r.Body).Decode(&job); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	updatedJob, err := h.jobService.UpdateJob(id, &job)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedJob)
}

func (h *Handlers) DeleteJob(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}

	if err := h.jobService.DeleteJob(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Questions handlers

func (h *Handlers) CreateQuestion(w http.ResponseWriter, r *http.Request) {
	var question models.Question
	if err := json.NewDecoder(r.Body).Decode(&question); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	createdQuestion, err := h.questionService.CreateQuestion(&question)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(createdQuestion)
}

func (h *Handlers) GetQuestion(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid question ID", http.StatusBadRequest)
		return
	}

	question, err := h.questionService.GetQuestionByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(question)
}

func (h *Handlers) GetJobQuestions(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	jobID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}

	questions, err := h.questionService.GetJobQuestions(jobID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(questions)
}

func (h *Handlers) UpdateQuestion(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid question ID", http.StatusBadRequest)
		return
	}

	var question models.Question
	if err := json.NewDecoder(r.Body).Decode(&question); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	updatedQuestion, err := h.questionService.UpdateQuestion(id, &question)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedQuestion)
}

func (h *Handlers) DeleteQuestion(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid question ID", http.StatusBadRequest)
		return
	}

	if err := h.questionService.DeleteQuestion(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Candidates handlers

func (h *Handlers) CreateCandidate(w http.ResponseWriter, r *http.Request) {
	var candidate models.Candidate
	if err := json.NewDecoder(r.Body).Decode(&candidate); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	createdCandidate, err := h.candidateService.CreateCandidate(&candidate)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(createdCandidate)
}

func (h *Handlers) GetCandidate(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid candidate ID", http.StatusBadRequest)
		return
	}

	candidate, err := h.candidateService.GetCandidateByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(candidate)
}

func (h *Handlers) GetJobCandidates(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	jobID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}

	candidates, err := h.candidateService.GetCandidatesByJobID(jobID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(candidates)
}

func (h *Handlers) UpdateCandidate(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid candidate ID", http.StatusBadRequest)
		return
	}

	var candidate models.Candidate
	if err := json.NewDecoder(r.Body).Decode(&candidate); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	updatedCandidate, err := h.candidateService.UpdateCandidate(id, &candidate)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedCandidate)
}

func (h *Handlers) DeleteCandidate(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid candidate ID", http.StatusBadRequest)
		return
	}

	if err := h.candidateService.DeleteCandidate(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Evaluations handlers

// SaveCandidateEvaluations сохраняет все оценки кандидата
func (h *Handlers) SaveCandidateEvaluations(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	candidateID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid candidate ID", http.StatusBadRequest)
		return
	}

	var evaluations []models.Evaluation
	if err := json.NewDecoder(r.Body).Decode(&evaluations); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err := h.evaluationService.SaveCandidateEvaluations(candidateID, evaluations); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// GetCandidateEvaluations получает все оценки кандидата
func (h *Handlers) GetCandidateEvaluations(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	candidateID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid candidate ID", http.StatusBadRequest)
		return
	}

	evaluations, err := h.evaluationService.GetEvaluationsByCandidate(candidateID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(evaluations)
}

// GetJobEvaluationsSummary получает сводку оценок для сравнения кандидатов
func (h *Handlers) GetJobEvaluationsSummary(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	jobID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}

	summaries, err := h.evaluationService.GetEvaluationsSummary(jobID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summaries)
}

// Templates handlers

// GetAllTemplates возвращает все шаблоны вакансий
func (h *Handlers) GetAllTemplates(w http.ResponseWriter, r *http.Request) {
	templates, err := h.templateService.GetAllTemplates()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(templates)
}

// GetTemplateByID возвращает шаблон по ID
func (h *Handlers) GetTemplateByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	template, err := h.templateService.GetTemplateByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(template)
}

// GetTemplatesByCategory возвращает шаблоны по категории
func (h *Handlers) GetTemplatesByCategory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	category := vars["category"]

	templates, err := h.templateService.GetTemplatesByCategory(category)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(templates)
}

// GetTemplateCategories возвращает список категорий
func (h *Handlers) GetTemplateCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.templateService.GetCategories()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

// Answers handlers

// SaveCandidateAnswers сохраняет все ответы кандидата
func (h *Handlers) SaveCandidateAnswers(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	candidateID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid candidate ID", http.StatusBadRequest)
		return
	}

	var answers []models.Answer
	if err := json.NewDecoder(r.Body).Decode(&answers); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err := h.answerService.SaveCandidateAnswers(candidateID, answers); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// GetCandidateAnswers получает все ответы кандидата
func (h *Handlers) GetCandidateAnswers(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	candidateID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid candidate ID", http.StatusBadRequest)
		return
	}

	answers, err := h.answerService.GetAnswersByCandidate(candidateID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(answers)
}

// Criteria handlers

// GetJobCriteria получает все критерии для вакансии
func (h *Handlers) GetJobCriteria(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	jobID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}

	criteria, err := h.criteriaService.GetJobCriteria(jobID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(criteria)
}

// CreateCriterion создает новый критерий
func (h *Handlers) CreateCriterion(w http.ResponseWriter, r *http.Request) {
	var criterion models.Criterion
	if err := json.NewDecoder(r.Body).Decode(&criterion); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	createdCriterion, err := h.criteriaService.CreateCriterion(criterion)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(createdCriterion)
}

// UpdateCriterion обновляет критерий
func (h *Handlers) UpdateCriterion(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid criterion ID", http.StatusBadRequest)
		return
	}

	var update models.CriterionUpdate
	if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	updatedCriterion, err := h.criteriaService.UpdateCriterion(id, update)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedCriterion)
}

// DeleteCriterion удаляет критерий
func (h *Handlers) DeleteCriterion(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid criterion ID", http.StatusBadRequest)
		return
	}

	if err := h.criteriaService.DeleteCriterion(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// UpdateJobCriteria обновляет все критерии вакансии
func (h *Handlers) UpdateJobCriteria(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	jobID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}

	var criteriaNames []string
	if err := json.NewDecoder(r.Body).Decode(&criteriaNames); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	updatedCriteria, err := h.criteriaService.UpdateJobCriteria(jobID, criteriaNames)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedCriteria)
}

// ReorderCriteria изменяет порядок критериев
func (h *Handlers) ReorderCriteria(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	jobID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid job ID", http.StatusBadRequest)
		return
	}

	var criteriaIDs []int64
	if err := json.NewDecoder(r.Body).Decode(&criteriaIDs); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err := h.criteriaService.ReorderCriteria(jobID, criteriaIDs); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}
