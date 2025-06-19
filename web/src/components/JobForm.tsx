import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Job } from '../types';
import { api } from '../services/api';

const JobForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    criteria: '',
  });

  useEffect(() => {
    if (isEditing && id) {
      loadJob();
    }
  }, [id, isEditing]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const jobData = await api.getJob(Number(id));
      setJob(jobData);
      
      // Преобразуем критерии из JSON обратно в строку
      const criteriaArray = JSON.parse(jobData.criteria || '[]');
      const criteriaString = criteriaArray.join(', ');
      
      setFormData({
        title: jobData.title,
        description: jobData.description,
        requirements: jobData.requirements,
        criteria: criteriaString,
      });
    } catch (err) {
      setError('Ошибка загрузки вакансии');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Преобразуем критерии в массив и валидируем
      const criteriaArray = formData.criteria
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const jobData = {
        ...formData,
        criteria: JSON.stringify(criteriaArray),
      };

      if (isEditing && id) {
        await api.updateJob(Number(id), jobData);
      } else {
        await api.createJob(jobData);
      }

      navigate('/');
    } catch (err) {
      setError('Ошибка сохранения вакансии');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>{isEditing ? 'Редактировать вакансию' : 'Создать вакансию'}</h2>
        <button className="btn btn-outline" onClick={() => navigate('/')}>
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
            <label htmlFor="title" className="form-label">
              Название вакансии *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Senior Go Developer"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Описание вакансии
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Краткое описание позиции и обязанностей"
            />
          </div>

          <div className="form-group">
            <label htmlFor="requirements" className="form-label">
              Требования к кандидату
            </label>
            <textarea
              id="requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Опыт работы, необходимые навыки, образование"
            />
          </div>

          <div className="form-group">
            <label htmlFor="criteria" className="form-label">
              Критерии оценки (через запятую)
            </label>
            <input
              type="text"
              id="criteria"
              name="criteria"
              value={formData.criteria}
              onChange={handleChange}
              className="form-input"
              placeholder="Технические навыки, Коммуникация, Лидерство, Решение проблем"
            />
            <small className="text-muted">
              Введите критерии через запятую. Эти критерии будут использоваться для оценки кандидатов.
            </small>
          </div>

          <div className="flex flex-gap">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !formData.title}
            >
              {saving ? 'Сохранение...' : (isEditing ? 'Обновить' : 'Создать')}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/')}
              disabled={saving}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobForm; 