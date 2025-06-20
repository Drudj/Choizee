import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Job, Question, Criterion } from '../types';
import { api } from '../services/api';
import QuestionLibrary from './QuestionLibrary';

const QuestionList: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<Job | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showCriteriaForm, setShowCriteriaForm] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<string[]>([]);
  const [isAddingCriteria, setIsAddingCriteria] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [jobData, criteriaData, questionsData] = await Promise.all([
        api.getJob(Number(id)),
        api.getJobCriteria(Number(id)),
        api.getJobQuestions(Number(id))
      ]);
      
      setJob(jobData);
      setCriteria(criteriaData || []);
      setQuestions(questionsData || []);
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот вопрос?')) return;
    
    try {
      await api.deleteQuestion(questionId);
      setQuestions(questions.filter(question => question.id !== questionId));
    } catch (err) {
      alert('Ошибка удаления вопроса');
      console.error(err);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingQuestion(null);
    loadData();
  };

  const handleEditCriteria = () => {
    if (!job) return;
    const criteriaNames = criteria.map(c => c.name);
    setEditingCriteria([...criteriaNames]);
    setIsAddingCriteria(false);
    setShowCriteriaForm(true);
  };

  const handleAddCriteria = () => {
    if (!job) return;
    const criteriaNames = criteria.map(c => c.name);
    setEditingCriteria([...criteriaNames]);
    setIsAddingCriteria(true);
    setShowCriteriaForm(true);
  };

  const handleCriteriaClose = () => {
    setShowCriteriaForm(false);
    setEditingCriteria([]);
    setIsAddingCriteria(false);
  };

  const handleCriteriaSave = async (newCriteriaNames: string[]) => {
    if (!job) return;
    
    console.log('🎯 handleCriteriaSave called with:', { 
      jobId: job.id, 
      newCriteriaNames,
      currentCriteria: criteria.map(c => c.name)
    });
    
    try {
      const result = await api.updateJobCriteria(job.id!, newCriteriaNames);
      console.log('🎉 Criteria update successful:', result);
      
      setShowCriteriaForm(false);
      setEditingCriteria([]);
      setIsAddingCriteria(false);
      
      // Перезагружаем данные для корректного отображения
      loadData();
    } catch (err) {
      console.error('💥 Детальная ошибка сохранения критериев:', err);
      console.error('💥 Error type:', typeof err);
      console.error('💥 Error instanceof Error:', err instanceof Error);
      console.error('💥 Error.message:', err instanceof Error ? err.message : 'Unknown');
      
      let errorMessage = 'Ошибка сохранения критериев';
      
      if (err instanceof Error) {
        errorMessage = `Ошибка сохранения критериев: ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage = `Ошибка сохранения критериев: ${err}`;
      }
      
      alert(errorMessage);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!job) {
    return (
      <div className="card">
        <div className="card-content text-center">
          <h3>Вакансия не найдена</h3>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            ← Назад к вакансиям
          </button>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <QuestionForm
        job={job}
        criteria={criteria}
        question={editingQuestion}
        onClose={handleFormClose}
      />
    );
  }

  if (showCriteriaForm) {
    return (
      <CriteriaForm
        criteria={editingCriteria}
        isAdding={isAddingCriteria}
        onSave={handleCriteriaSave}
        onClose={handleCriteriaClose}
      />
    );
  }

  // Получаем критерии для группировки вопросов - используем state criteria
  
  // Группируем вопросы по критериям
  const questionsByCriteria = criteria.reduce((acc: any, criterion: Criterion) => {
    acc[criterion.name] = questions.filter(q => q.criterion_name === criterion.name);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-outline" onClick={() => navigate('/')}>
            ← Назад к вакансиям
          </button>
          <h2 className="mt-4">Вопросы: {job.title}</h2>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-outline" 
            onClick={handleEditCriteria}
          >
            ⚙️ Управление критериями
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(true)}
          >
            ➕ Добавить вопрос
          </button>
        </div>
      </div>

      {error && (
        <div className="card mb-4">
          <div className="card-content text-center">
            <p>{error}</p>
            <button className="btn btn-primary mt-4" onClick={loadData}>
              Попробовать снова
            </button>
          </div>
        </div>
      )}

      {criteria.length === 0 ? (
        <div className="card text-center">
          <div className="card-content">
            <h3>Нет критериев оценки</h3>
            <p className="text-muted mb-4">
              Добавьте критерии оценки для создания структурированных вопросов
            </p>
            <button 
              className="btn btn-primary" 
              onClick={handleAddCriteria}
            >
              ➕ Добавить критерий
            </button>
          </div>
        </div>
      ) : (
        <div>
          {(() => {
            let questionNumber = 0; // Сплошная нумерация для всех вопросов
            
            return criteria.map((criterion: Criterion) => (
              <div key={criterion.id} className="mb-6">
                <div className="criterion-section">
                  <div className="criterion-header">
                    <div className="criterion-info">
                      <h3>📋 {criterion.name}</h3>
                      <span className="question-count">
                        {questionsByCriteria[criterion.name]?.length || 0} вопросов
                      </span>
                    </div>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        const allCriteriaNames = criteria.map(c => c.name);
                        setEditingCriteria(allCriteriaNames);
                        setIsAddingCriteria(false);
                        setShowCriteriaForm(true);
                      }}
                      title="Редактировать критерий"
                    >
                      ✏️ Редактировать
                    </button>
                  </div>

                  {questionsByCriteria[criterion.name]?.length > 0 ? (
                    <div className="questions-list">
                      {questionsByCriteria[criterion.name].map((question: Question) => {
                        questionNumber++; // Увеличиваем сплошную нумерацию
                        return (
                          <div key={question.id} className="question-item">
                            <div className="question-main">
                              <div className="question-number">
                                {questionNumber}
                              </div>
                              <div className="question-content">
                                <p>{question.text}</p>
                              </div>
                            </div>
                            <div className="question-actions">
                              <button
                                className="action-btn action-btn-edit"
                                onClick={() => {
                                  setEditingQuestion(question);
                                  setShowForm(true);
                                }}
                                title="Редактировать вопрос"
                              >
                                ✏️
                              </button>
                              <button
                                className="action-btn action-btn-delete"
                                onClick={() => question.id && handleDelete(question.id)}
                                title="Удалить вопрос"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="no-questions">
                      <p className="text-muted">Нет вопросов для этого критерия</p>
                    </div>
                  )}
                </div>
              </div>
            ));
          })()}
          
          {/* Кнопка добавления критерия внизу */}
          <div className="add-criteria-section">
            <button 
              className="btn btn-secondary"
              onClick={handleAddCriteria}
            >
              ➕ Добавить новый критерий
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент формы критериев
interface CriteriaFormProps {
  criteria: string[];
  isAdding: boolean;
  onSave: (criteria: string[]) => void;
  onClose: () => void;
}

const CriteriaForm: React.FC<CriteriaFormProps> = ({ criteria, isAdding, onSave, onClose }) => {
  const [formCriteria, setFormCriteria] = useState<string[]>([...criteria]);
  const [newCriterion, setNewCriterion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddCriterion = () => {
    if (newCriterion.trim() && !formCriteria.includes(newCriterion.trim())) {
      setFormCriteria([...formCriteria, newCriterion.trim()]);
      setNewCriterion('');
    }
  };

  const handleRemoveCriterion = (index: number) => {
    setFormCriteria(formCriteria.filter((_, i) => i !== index));
  };

  const handleEditCriterion = (index: number, value: string) => {
    const updated = [...formCriteria];
    updated[index] = value;
    setFormCriteria(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const validCriteria = formCriteria.filter(c => c.trim());
      await onSave(validCriteria);
    } catch (err) {
      console.error('Ошибка сохранения критериев:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>{isAdding ? 'Добавить критерии' : 'Управление критериями'}</h2>
        <button className="btn btn-outline" onClick={onClose}>
          ← Назад
        </button>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label">Критерии оценки</label>
            
            <div className="criteria-list">
              {formCriteria.map((criterion, index) => (
                <div key={index} className="criterion-edit-item">
                  <input
                    type="text"
                    value={criterion}
                    onChange={(e) => handleEditCriterion(index, e.target.value)}
                    className="form-input"
                    placeholder="Название критерия"
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleRemoveCriterion(index)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <div className="add-criterion-section">
              <div className="add-criterion-input">
                <input
                  type="text"
                  value={newCriterion}
                  onChange={(e) => setNewCriterion(e.target.value)}
                  className="form-input"
                  placeholder="Новый критерий оценки"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCriterion();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleAddCriterion}
                  disabled={!newCriterion.trim()}
                >
                  ➕ Добавить
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-gap">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || formCriteria.length === 0}
            >
              {loading ? 'Сохранение...' : 'Сохранить критерии'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Компонент формы вопроса
interface QuestionFormProps {
  job: Job;
  criteria: Criterion[];
  question?: Question | null;
  onClose: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ job, criteria, question, onClose }) => {
  const criteriaNames = criteria.map(c => c.name);
  
  const [formData, setFormData] = useState({
    criterion_id: question?.criterion_id || (criteria[0]?.id || 0),
    text: question?.text || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const questionData = {
        job_id: job.id!,
        criterion_id: formData.criterion_id,
        text: formData.text,
      };

      if (question?.id) {
        await api.updateQuestion(question.id, questionData);
      } else {
        await api.createQuestion(questionData);
      }

      onClose();
    } catch (err) {
      setError('Ошибка сохранения вопроса');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.name === 'criterion_id' ? parseInt(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleQuestionSelect = (selectedQuestion: string) => {
    setFormData({
      ...formData,
      text: selectedQuestion,
    });
    setShowLibrary(false);
  };

  return (
    <div>
      <div className="page-header">
        <h2>{question ? 'Редактировать вопрос' : 'Добавить вопрос'}</h2>
        <button className="btn btn-outline" onClick={onClose}>
          ← Назад
        </button>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="form">
          {error && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#fee2e2', 
              color: '#dc2626', 
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="criterion" className="form-label">
              Критерий оценки *
            </label>
            <select
              id="criterion"
              name="criterion_id"
              value={formData.criterion_id}
              onChange={handleChange}
              className="form-input"
              required
            >
              {criteria.map((criterion: Criterion) => (
                <option key={criterion.id} value={criterion.id}>
                  {criterion.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <div className="flex flex-between mb-2">
              <label htmlFor="text" className="form-label">
                Текст вопроса *
              </label>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowLibrary(true)}
              >
                📚 Выбрать из библиотеки
              </button>
            </div>
            <textarea
              id="text"
              name="text"
              value={formData.text}
              onChange={handleChange}
              className="form-textarea"
              required
              placeholder="Введите вопрос для интервью или выберите из библиотеки..."
              rows={4}
            />
          </div>

          <div className="flex flex-gap">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !formData.text}
            >
              {loading ? 'Сохранение...' : (question ? 'Обновить' : 'Создать')}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>

      {/* Библиотека вопросов */}
      {showLibrary && (
        <QuestionLibrary
          onSelectQuestion={handleQuestionSelect}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
};

export default QuestionList; 