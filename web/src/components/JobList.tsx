import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Job } from '../types';
import { api } from '../services/api';

const JobList: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showHypnotoad, setShowHypnotoad] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    fetchJobs();
  }, []);

  // Отслеживание активности пользователя для показа гипножабы
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      setShowHypnotoad(false);
    };

    const checkInactivity = () => {
      if (Date.now() - lastActivity > 5000) {
        setShowHypnotoad(true);
      }
    };

    // Слушаем события активности
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Проверяем каждую секунду
    const interval = setInterval(checkInactivity, 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(interval);
    };
  }, [lastActivity]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await api.getJobs();
      setJobs(data || []);
    } catch (err) {
      setError('Ошибка загрузки вакансий');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту вакансию?')) return;
    
    try {
      await api.deleteJob(id);
      setJobs(jobs.filter(job => job.id !== id));
    } catch (err) {
      alert('Ошибка удаления вакансии');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>🎯 Вакансии</h2>
        <div className="flex flex-gap">
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Сетка"
            >
              ⊞
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Список"
            >
              ☰
            </button>
          </div>
          <Link to="/jobs/new" className="btn btn-primary">
            ➕ Создать вакансию
          </Link>
        </div>
      </div>

      {error && (
        <div className="card mb-4">
          <div className="card-content text-center">
            <p>{error}</p>
            <button className="btn btn-primary mt-4" onClick={fetchJobs}>
              Попробовать снова
            </button>
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="card text-center">
          <div className="card-content">
            <h3>Нет вакансий</h3>
            <p className="text-muted mb-4">Создайте первую вакансию для начала работы</p>
            <Link to="/jobs/new" className="btn btn-primary">
              Создать вакансию
            </Link>
          </div>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-2' : 'job-list-view'}>
          {jobs.map((job) => (
            <div key={job.id} className={`card ${viewMode === 'list' ? 'job-card-horizontal' : ''}`}>
              <div className="card-header">
                <h3 className="card-title">{job.title}</h3>
                <div className="card-actions">
                  <Link
                    to={`/jobs/${job.id}/edit`}
                    className="card-action-btn edit"
                    title="Редактировать"
                  >
                    ✏️
                  </Link>
                  <button
                    className="card-action-btn delete"
                    onClick={() => job.id && handleDelete(job.id)}
                    title="Удалить"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="card-content">
                <div className={viewMode === 'list' ? 'job-content-horizontal' : ''}>
                  <div className="job-main-info">
                    <p className="mb-4">{job.description}</p>
                    <div className="mb-4">
                      <strong>Требования:</strong>
                      <p className="text-muted">{job.requirements}</p>
                    </div>
                  </div>
                  <div className="job-meta-info">
                    <div className="mb-4">
                      <strong>Критерии оценки:</strong>
                      <div className="flex flex-gap mt-2" style={{ flexWrap: 'wrap' }}>
                        {job.criteria && JSON.parse(job.criteria).map((criterion: string, index: number) => (
                          <span
                            key={index}
                            className="criterion-tag"
                          >
                            {criterion}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-gap mt-4" style={{ flexWrap: 'wrap' }}>
                      <Link
                        to={`/jobs/${job.id}/candidates`}
                        className="btn btn-primary"
                      >
                        👥 Просмотреть кандидатов
                      </Link>
                      <Link
                        to={`/jobs/${job.id}/questions`}
                        className="btn btn-secondary"
                      >
                        📝 Управление вопросами
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Гипножаба из Futurama */}
      {showHypnotoad && (
        <div className="hypnotoad-container">
          <div className="hypnotoad">
            <div className="hypnotoad-body">
              <div className="hypnotoad-eyes">
                <div className="hypnotoad-eye left">
                  <div className="hypnotoad-pupil"></div>
                </div>
                <div className="hypnotoad-eye right">
                  <div className="hypnotoad-pupil"></div>
                </div>
              </div>
              <div className="hypnotoad-mouth"></div>
            </div>
            <div className="hypnotoad-glow"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobList; 