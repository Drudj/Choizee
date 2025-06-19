import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './Toast';

interface Template {
  id: string;
  title: string;
  category: string;
  level: string;
  description: string;
  requirements: string;
  criteria: string[];
  questions: TemplateQuestionGroup[];
}

interface TemplateQuestionGroup {
  criterion: string;
  questions: string[];
}

interface TemplateSelectorProps {
  onTemplateSelect: (template: Template) => void;
  onClose: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onTemplateSelect, onClose }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: showError } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, categoriesData] = await Promise.all([
        api.getTemplates(),
        api.getTemplateCategories()
      ]);
      
      setTemplates(templatesData);
      setCategories(categoriesData);
    } catch (err) {
      const errorMessage = 'Ошибка загрузки шаблонов';
      setError(errorMessage);
      showError('Ошибка', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const categoryMatch = !selectedCategory || template.category === selectedCategory;
    const levelMatch = !selectedLevel || template.level === selectedLevel;
    return categoryMatch && levelMatch;
  });

  const levels = [...new Set(templates.map(t => t.level))];

  const handleTemplateSelect = (template: Template) => {
    onTemplateSelect(template);
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Development': '💻',
      'Infrastructure': '🔧',
      'Mobile': '📱',
      'Data & Analytics': '📊',
      'Product': '🎯',
      'Design': '🎨',
      'Quality Assurance': '🔍'
    };
    return icons[category] || '📋';
  };

  const getLevelColor = (level: string) => {
    const colors: { [key: string]: string } = {
      'Junior': '#10b981',    // green
      'Middle': '#f59e0b',    // yellow
      'Senior': '#ef4444'     // red
    };
    return colors[level] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content large">
          <div className="loading">Загрузка шаблонов...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Ошибка</h3>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadData}>
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>🎯 Выберите шаблон вакансии</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* Фильтры */}
          <div className="template-filters mb-6">
            <div className="filter-group">
              <label>Категория:</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-select"
              >
                <option value="">Все категории</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {getCategoryIcon(category)} {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Уровень:</label>
              <select 
                value={selectedLevel} 
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="form-select"
              >
                <option value="">Все уровни</option>
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Список шаблонов */}
          <div className="templates-grid">
            {filteredTemplates.length === 0 ? (
              <div className="no-templates">
                <p>Нет шаблонов, соответствующих выбранным фильтрам</p>
              </div>
            ) : (
              filteredTemplates.map(template => (
                <div 
                  key={template.id} 
                  className="template-card"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="template-header">
                    <div className="template-category">
                      {getCategoryIcon(template.category)} {template.category}
                    </div>
                    <div 
                      className="template-level"
                      style={{ color: getLevelColor(template.level) }}
                    >
                      {template.level}
                    </div>
                  </div>
                  
                  <h4 className="template-title">{template.title}</h4>
                  <p className="template-description">{template.description}</p>
                  
                  <div className="template-stats">
                    <span className="stat">📋 {template.criteria.length} критериев</span>
                    <span className="stat">❓ {template.questions.reduce((sum, group) => sum + group.questions.length, 0)} вопросов</span>
                  </div>
                  
                  <div className="template-criteria">
                    <strong>Критерии оценки:</strong>
                    <div className="criteria-tags">
                      {template.criteria.slice(0, 3).map(criterion => (
                        <span key={criterion} className="criterion-tag">
                          {criterion}
                        </span>
                      ))}
                      {template.criteria.length > 3 && (
                        <span className="criterion-tag more">
                          +{template.criteria.length - 3} еще
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button className="template-select-btn">
                    Использовать шаблон →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Создать вакансию вручную
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector; 