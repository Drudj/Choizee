package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"path/filepath"
)

type JobTemplate struct {
	ID           string                  `json:"id"`
	Title        string                  `json:"title"`
	Category     string                  `json:"category"`
	Level        string                  `json:"level"`
	Description  string                  `json:"description"`
	Requirements string                  `json:"requirements"`
	Criteria     []string                `json:"criteria"`
	Questions    []TemplateQuestionGroup `json:"questions"`
}

type TemplateQuestionGroup struct {
	Criterion string   `json:"criterion"`
	Questions []string `json:"questions"`
}

type TemplatesData struct {
	Templates []JobTemplate `json:"templates"`
}

type TemplateService struct {
	templatesFile string
}

func NewTemplateService() *TemplateService {
	return &TemplateService{
		templatesFile: filepath.Join("data", "job_templates.json"),
	}
}

// GetAllTemplates возвращает все доступные шаблоны
func (s *TemplateService) GetAllTemplates() ([]JobTemplate, error) {
	data, err := ioutil.ReadFile(s.templatesFile)
	if err != nil {
		return nil, fmt.Errorf("failed to read templates file: %w", err)
	}

	var templatesData TemplatesData
	if err := json.Unmarshal(data, &templatesData); err != nil {
		return nil, fmt.Errorf("failed to parse templates: %w", err)
	}

	return templatesData.Templates, nil
}

// GetTemplateByID возвращает шаблон по ID
func (s *TemplateService) GetTemplateByID(id string) (*JobTemplate, error) {
	templates, err := s.GetAllTemplates()
	if err != nil {
		return nil, err
	}

	for _, template := range templates {
		if template.ID == id {
			return &template, nil
		}
	}

	return nil, fmt.Errorf("template with id %s not found", id)
}

// GetTemplatesByCategory возвращает шаблоны по категории
func (s *TemplateService) GetTemplatesByCategory(category string) ([]JobTemplate, error) {
	templates, err := s.GetAllTemplates()
	if err != nil {
		return nil, err
	}

	var filtered []JobTemplate
	for _, template := range templates {
		if template.Category == category {
			filtered = append(filtered, template)
		}
	}

	return filtered, nil
}

// GetCategories возвращает список всех категорий
func (s *TemplateService) GetCategories() ([]string, error) {
	templates, err := s.GetAllTemplates()
	if err != nil {
		return nil, err
	}

	categoriesMap := make(map[string]bool)
	for _, template := range templates {
		categoriesMap[template.Category] = true
	}

	var categories []string
	for category := range categoriesMap {
		categories = append(categories, category)
	}

	return categories, nil
}
