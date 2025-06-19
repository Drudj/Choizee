import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Job, CandidateWithJob, Candidate } from '../types';
import { api } from '../services/api';

const CandidateList: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<CandidateWithEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [jobData, candidatesData] = await Promise.all([
        api.getJob(Number(id)),
        api.getJobCandidates(Number(id))
      ]);
      
      setJob(jobData);
      
      // Загружаем статус оценок для каждого кандидата
      const candidatesWithEvaluation: CandidateWithEvaluation[] = await Promise.all(
        (candidatesData || []).map(async (candidate) => {
          try {
            const evaluations = await api.getCandidateEvaluations(candidate.id!);
            const hasEvaluations = evaluations && evaluations.length > 0;
            const averageScore = hasEvaluations 
              ? Math.round(evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / evaluations.length)
              : undefined;
            
            return {
              ...candidate,
              evaluationStatus: hasEvaluations ? 'evaluated' as const : 'not_evaluated' as const,
              averageScore,
              evaluationsCount: evaluations?.length || 0
            };
          } catch {
            // Если не удалось загрузить оценки, считаем что кандидат не оценен
            return {
              ...candidate,
              evaluationStatus: 'not_evaluated' as const,
              averageScore: undefined,
              evaluationsCount: 0
            };
          }
        })
      );
      
      setCandidates(candidatesWithEvaluation);
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (candidateId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого кандидата?')) return;
    
    try {
      await api.deleteCandidate(candidateId);
      setCandidates(candidates.filter(candidate => candidate.id !== candidateId));
    } catch (err) {
      alert('Ошибка удаления кандидата');
      console.error(err);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCandidate(null);
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
      <CandidateForm
        jobId={job.id!}
        candidate={editingCandidate}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-outline" onClick={() => navigate('/')}>
            ← Назад к вакансиям
          </button>
          <h2 className="mt-4">Кандидаты: {job.title}</h2>
        </div>
        <div className="flex flex-gap">
          {candidates.length > 0 && (
            <Link 
              to={`/jobs/${id}/comparison`}
              className="btn btn-secondary"
            >
              📊 Сравнить кандидатов
            </Link>
          )}
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(true)}
          >
            ➕ Добавить кандидата
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

      {candidates.length === 0 ? (
        <div className="card text-center">
          <div className="card-content">
            <h3>Нет кандидатов</h3>
            <p className="text-muted mb-4">Добавьте первого кандидата для начала оценки</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              Добавить кандидата
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-2">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="card">
              <div className="card-header">
                <h3 className="card-title">{candidate.name}</h3>
                <div className="card-actions">
                  <button
                    className="card-action-btn edit"
                    onClick={() => {
                      setEditingCandidate(candidate);
                      setShowForm(true);
                    }}
                    title="Редактировать"
                  >
                    ✏️
                  </button>
                  <button
                    className="card-action-btn delete"
                    onClick={() => candidate.id && handleDelete(candidate.id)}
                    title="Удалить"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="card-content">
                <div className="mb-4">
                  <strong>Email:</strong> {candidate.email}
                </div>
                <div className="mb-4">
                  <strong>Телефон:</strong> {candidate.phone}
                </div>
                <div className="mb-4">
                  <strong>Описание:</strong>
                  <p className="text-muted">{candidate.description}</p>
                </div>
                
                {/* Статус оценки */}
                <div className="mb-4">
                  <div className="evaluation-status">
                    {candidate.evaluationStatus === 'evaluated' ? (
                      <div className="evaluated-status">
                        <div 
                          className="status-badge"
                          style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.5rem'
                          }}
                        >
                          ✅ Оценен
                          <span style={{ 
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                          }}>
                            {candidate.averageScore}/10
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          {candidate.evaluationsCount} критерия оценено
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="status-badge"
                        style={{
                          backgroundColor: '#f97316',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          display: 'inline-block'
                        }}
                      >
                        ⏳ Не оценен
                      </div>
                    )}
                  </div>
                </div>
                
                <Link 
                  to={`/jobs/${id}/candidates/${candidate.id}/evaluation`}
                  className="btn btn-success"
                >
                  {candidate.evaluationStatus === 'evaluated' ? '📝 Редактировать оценку' : '🎯 Провести интервью'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент формы кандидата
interface CandidateWithEvaluation extends CandidateWithJob {
  evaluationStatus: 'not_evaluated' | 'evaluated';
  averageScore?: number;
  evaluationsCount?: number;
}

interface CandidateFormProps {
  jobId: number;
  candidate?: Candidate | null;
  onClose: () => void;
}

const CandidateForm: React.FC<CandidateFormProps> = ({ jobId, candidate, onClose }) => {
  const [formData, setFormData] = useState({
    name: candidate?.name || '',
    email: candidate?.email || '',
    phone: candidate?.phone || '',
    description: candidate?.description || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const candidateData = {
        ...formData,
        job_id: jobId,
      };

      if (candidate?.id) {
        await api.updateCandidate(candidate.id, candidateData);
      } else {
        await api.createCandidate(candidateData);
      }

      onClose();
    } catch (err) {
      setError('Ошибка сохранения кандидата');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div>
      <div className="page-header">
        <h2>{candidate ? 'Редактировать кандидата' : 'Добавить кандидата'}</h2>
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
            <label htmlFor="name" className="form-label">
              Имя кандидата *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Иван Петров"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="ivan@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Телефон
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-input"
              placeholder="+7-999-123-45-67"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Описание кандидата
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Краткое описание опыта и навыков кандидата"
            />
          </div>

          <div className="flex flex-gap">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !formData.name}
            >
              {loading ? 'Сохранение...' : (candidate ? 'Обновить' : 'Добавить')}
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

export default CandidateList; 