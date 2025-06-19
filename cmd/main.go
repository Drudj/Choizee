/*
Choizee - Инструмент для оценки кандидатов
Copyright (c) 2025 Konstantin Ansimov

Данное программное обеспечение предоставляется для некоммерческого использования.
Коммерческое использование требует отдельной лицензии.
Подробности в файле LICENSE.
*/

package main

import (
	"choizee/internal/api"
	"choizee/internal/database"
	"choizee/internal/services"
	"log"
	"net/http"
	"os"
	"path"

	"github.com/gorilla/mux"
)

func main() {
	// Инициализация базы данных
	db, err := database.New()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Инициализация сервисов
	jobService := services.NewJobService(db)
	candidateService := services.NewCandidateService(db)
	questionService := services.NewQuestionService(db)
	evaluationService := services.NewEvaluationService(db)
	templateService := services.NewTemplateService()
	answerService := services.NewAnswerService(db)

	// Инициализация handlers
	handlers := api.NewHandlers(jobService, candidateService, questionService, evaluationService, templateService, answerService)

	// Настройка роутинга
	router := setupRoutes(handlers)

	// Запуск сервера
	log.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", router))
}

func setupRoutes(handlers *api.Handlers) *mux.Router {
	router := mux.NewRouter()

	// API routes
	apiRouter := router.PathPrefix("/api").Subrouter()

	// Jobs endpoints
	apiRouter.HandleFunc("/jobs", handlers.GetAllJobs).Methods("GET")
	apiRouter.HandleFunc("/jobs", handlers.CreateJob).Methods("POST")
	apiRouter.HandleFunc("/jobs/{id}", handlers.GetJob).Methods("GET")
	apiRouter.HandleFunc("/jobs/{id}", handlers.UpdateJob).Methods("PUT")
	apiRouter.HandleFunc("/jobs/{id}", handlers.DeleteJob).Methods("DELETE")
	apiRouter.HandleFunc("/jobs/{id}/candidates", handlers.GetJobCandidates).Methods("GET")
	apiRouter.HandleFunc("/jobs/{id}/questions", handlers.GetJobQuestions).Methods("GET")

	// Questions endpoints
	apiRouter.HandleFunc("/questions", handlers.CreateQuestion).Methods("POST")
	apiRouter.HandleFunc("/questions/{id}", handlers.GetQuestion).Methods("GET")
	apiRouter.HandleFunc("/questions/{id}", handlers.UpdateQuestion).Methods("PUT")
	apiRouter.HandleFunc("/questions/{id}", handlers.DeleteQuestion).Methods("DELETE")

	// Candidates endpoints
	apiRouter.HandleFunc("/candidates", handlers.CreateCandidate).Methods("POST")
	apiRouter.HandleFunc("/candidates/{id}", handlers.GetCandidate).Methods("GET")
	apiRouter.HandleFunc("/candidates/{id}", handlers.UpdateCandidate).Methods("PUT")
	apiRouter.HandleFunc("/candidates/{id}", handlers.DeleteCandidate).Methods("DELETE")

	// Evaluations endpoints
	apiRouter.HandleFunc("/candidates/{id}/evaluations", handlers.SaveCandidateEvaluations).Methods("POST")
	apiRouter.HandleFunc("/candidates/{id}/evaluations", handlers.GetCandidateEvaluations).Methods("GET")
	apiRouter.HandleFunc("/jobs/{id}/evaluations/summary", handlers.GetJobEvaluationsSummary).Methods("GET")

	// Answers endpoints
	apiRouter.HandleFunc("/candidates/{id}/answers", handlers.SaveCandidateAnswers).Methods("POST")
	apiRouter.HandleFunc("/candidates/{id}/answers", handlers.GetCandidateAnswers).Methods("GET")

	// Templates endpoints
	apiRouter.HandleFunc("/templates", handlers.GetAllTemplates).Methods("GET")
	apiRouter.HandleFunc("/templates/categories", handlers.GetTemplateCategories).Methods("GET")
	apiRouter.HandleFunc("/templates/category/{category}", handlers.GetTemplatesByCategory).Methods("GET")
	apiRouter.HandleFunc("/templates/{id}", handlers.GetTemplateByID).Methods("GET")

	// Serve static files with SPA fallback
	staticDir := "./web/dist/"
	router.PathPrefix("/").HandlerFunc(spaHandler(staticDir))

	// CORS middleware
	router.Use(corsMiddleware)

	return router
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// spaHandler handles SPA routing by serving index.html for non-API routes
func spaHandler(staticDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Construct the file path
		filePath := path.Join(staticDir, r.URL.Path)

		// Check if the file exists
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			// File doesn't exist, serve index.html for SPA routing
			http.ServeFile(w, r, path.Join(staticDir, "index.html"))
			return
		}

		// File exists, serve it directly
		http.FileServer(http.Dir(staticDir)).ServeHTTP(w, r)
	}
}
