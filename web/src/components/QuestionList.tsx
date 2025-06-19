import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Job, Question } from '../types';
import { api } from '../services/api';
import QuestionLibrary from './QuestionLibrary';

const QuestionList: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<Job | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [jobData, questionsData] = await Promise.all([
        api.getJob(Number(id)),
        api.getJobQuestions(Number(id))
      ]);
      
      setJob(jobData);
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
        question={editingQuestion}
        onClose={handleFormClose}
      />
    );
  }

  // Получаем критерии для группировки вопросов
  const criteria = job.criteria ? JSON.parse(job.criteria) : [];
  
  // Группируем вопросы по критериям
  const questionsByCriteria = criteria.reduce((acc: any, criterion: string) => {
    acc[criterion] = questions.filter(q => q.criterion === criterion);
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
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
        >
          ➕ Добавить вопрос
        </button>
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
              Сначала добавьте критерии оценки в вакансию, а затем создавайте вопросы для каждого критерия
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate(`/jobs/${id}/edit`)}
            >
              Редактировать вакансию
            </button>
          </div>
        </div>
      ) : (
        <div>
          {criteria.map((criterion: string) => (
            <div key={criterion} className="mb-6">
              <div className="criterion-section">
                <div className="criterion-header">
                  <h3>📋 {criterion}</h3>
                  <span className="question-count">
                    {questionsByCriteria[criterion]?.length || 0} вопросов
                  </span>
                </div>

                {questionsByCriteria[criterion]?.length > 0 ? (
                  <div className="questions-list">
                    {questionsByCriteria[criterion].map((question: Question) => (
                      <div key={question.id} className="question-item">
                                                 <div className="question-content">
                           <p>{question.text}</p>
                         </div>
                        <div className="question-actions">
                          <button
                            className="action-btn action-btn-edit"
                            onClick={() => {
                              setEditingQuestion(question);
                              setShowForm(true);
                            }}
                          >
                            ✏️ Редактировать
                          </button>
                          <button
                            className="action-btn action-btn-delete"
                            onClick={() => question.id && handleDelete(question.id)}
                          >
                            🗑️ Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-questions">
                    <p className="text-muted">Нет вопросов для этого критерия</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент формы вопроса
interface QuestionFormProps {
  job: Job;
  question?: Question | null;
  onClose: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ job, question, onClose }) => {
  const criteria = job.criteria ? JSON.parse(job.criteria) : [];
  
  const [formData, setFormData] = useState({
    criterion: question?.criterion || (criteria[0] || ''),
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
        ...formData,
        job_id: job.id!,
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
              name="criterion"
              value={formData.criterion}
              onChange={handleChange}
              className="form-input"
              required
            >
              {criteria.map((criterion: string) => (
                <option key={criterion} value={criterion}>
                  {criterion}
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