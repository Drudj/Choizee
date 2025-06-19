import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Job, CandidateWithJob } from '../types';
import { api } from '../services/api';
import RadarChart from './RadarChart';

interface CandidateEvaluation {
  candidateId: number;
  candidateName: string;
  overallScore: number;
  criteriaScores: { [criterion: string]: number };
  notes: string;
  status: 'not_evaluated' | 'evaluated';
}

const CandidateComparison: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<CandidateWithJob[]>([]);
  const [criteria, setCriteria] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<CandidateEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setCandidates(candidatesData || []);
      
      // Парсим критерии из вакансии
      const jobCriteria = JSON.parse(jobData.criteria || '[]');
      setCriteria(jobCriteria);
      
      // Загружаем реальные оценки из API
      try {
        const evaluationsSummary = await api.getJobEvaluationsSummary(Number(id));
        const realEvaluations = processEvaluationsSummary(candidatesData || [], evaluationsSummary, jobCriteria);
        setEvaluations(realEvaluations);
      } catch {
        // Если нет оценок, создаем пустые записи
        const emptyEvaluations = (candidatesData || []).map(candidate => ({
          candidateId: candidate.id!,
          candidateName: candidate.name,
          overallScore: 0,
          criteriaScores: {},
          notes: '',
          status: 'not_evaluated' as const
        }));
        setEvaluations(emptyEvaluations);
      }

    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Преобразуем данные из API в формат компонента
  const processEvaluationsSummary = (candidates: CandidateWithJob[], summaries: any[], criteria: string[]): CandidateEvaluation[] => {
    return candidates.map(candidate => {
      // Ищем данные оценки для этого кандидата
      const summary = summaries.find(s => s.candidate_id === candidate.id);
      
      if (summary && summary.evaluations.length > 0) {
                 // Преобразуем оценки в объект с критериями
         const criteriaScores: { [key: string]: number } = {};
         summary.evaluations.forEach((evaluation: any) => {
           criteriaScores[evaluation.criterion] = evaluation.score;
         });
        
        // Вычисляем общую оценку
        const scores = Object.values(criteriaScores);
        const overallScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
        
        return {
          candidateId: candidate.id!,
          candidateName: candidate.name,
          overallScore,
          criteriaScores,
          notes: summary.evaluations.map((e: any) => e.comments).filter(Boolean).join('; '),
          status: 'evaluated'
        };
      }
      
      // Если оценок нет, возвращаем пустую запись
      return {
        candidateId: candidate.id!,
        candidateName: candidate.name,
        overallScore: 0,
        criteriaScores: {},
        notes: '',
        status: 'not_evaluated'
      };
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#10b981'; // green
    if (score >= 6) return '#f59e0b'; // yellow
    if (score >= 4) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return 'Отлично';
    if (score >= 8) return 'Хорошо';
    if (score >= 6) return 'Средне';
    if (score >= 4) return 'Ниже среднего';
    return 'Плохо';
  };

  // Генерируем цвета для кандидатов
  const getCandidateColor = (index: number) => {
    const colors = [
      '#3b82f6', // синий
      '#ef4444', // красный  
      '#10b981', // зеленый
      '#f59e0b', // желтый
      '#8b5cf6', // фиолетовый
      '#06b6d4', // голубой
      '#f97316', // оранжевый
      '#84cc16', // лайм
    ];
    return colors[index % colors.length];
  };

  const exportToCSV = () => {
    const headers = ['Кандидат', 'Общая оценка', ...criteria, 'Примечания'];
    const rows = evaluations.map(evaluation => [
      evaluation.candidateName,
      evaluation.overallScore.toString(),
      ...criteria.map(criterion => evaluation.criteriaScores[criterion]?.toString() || '0'),
      evaluation.notes
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comparison_${job?.title || 'candidates'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-content text-center">
          <h3>Ошибка</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            Назад
          </button>
        </div>
      </div>
    );
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

  const evaluatedCandidates = evaluations.filter(e => e.status === 'evaluated');
  const notEvaluatedCandidates = evaluations.filter(e => e.status === 'not_evaluated');

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-outline" onClick={() => navigate(`/jobs/${id}/candidates`)}>
            ← Назад к кандидатам
          </button>
          <h2 className="mt-4">📊 Сравнение кандидатов: {job.title}</h2>
        </div>
        <div className="flex flex-gap">
          <button 
            className="btn btn-secondary"
            onClick={exportToCSV}
            disabled={evaluatedCandidates.length === 0}
          >
            📥 Экспорт CSV
          </button>
          <Link 
            to={`/jobs/${id}/candidates`}
            className="btn btn-primary"
          >
            👥 Управление кандидатами
          </Link>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-3 mb-6">
        <div className="stat-card">
          <div className="stat-number">{candidates.length}</div>
          <div className="stat-label">Всего кандидатов</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{evaluatedCandidates.length}</div>
          <div className="stat-label">Оценено</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{criteria.length}</div>
          <div className="stat-label">Критериев оценки</div>
        </div>
      </div>

      {notEvaluatedCandidates.length > 0 && (
        <div className="card mb-6">
          <div className="card-content">
            <h3>⚠️ Кандидаты без оценки</h3>
            <p className="text-muted mb-4">
              Следующие кандидаты еще не прошли интервью:
            </p>
            <div className="flex flex-gap">
              {notEvaluatedCandidates.map(evaluation => (
                <Link
                  key={evaluation.candidateId}
                  to={`/jobs/${id}/candidates/${evaluation.candidateId}/evaluation`}
                  className="btn btn-outline"
                >
                  🎯 {evaluation.candidateName}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {evaluatedCandidates.length === 0 ? (
        <div className="card text-center">
          <div className="card-content">
            <h3>Нет оценок для сравнения</h3>
            <p className="text-muted mb-4">
              Проведите интервью с кандидатами, чтобы сравнить их результаты
            </p>
            <Link 
              to={`/jobs/${id}/candidates`}
              className="btn btn-primary"
            >
              Перейти к кандидатам
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Таблица сравнения */}
          <div className="card mb-6">
            <div className="card-content">
              <h3>📋 Детальное сравнение</h3>
              <div className="comparison-table-container">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Кандидат</th>
                      <th>Общая оценка</th>
                      {criteria.map(criterion => (
                        <th key={criterion}>{criterion}</th>
                      ))}
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluatedCandidates
                      .sort((a, b) => b.overallScore - a.overallScore)
                      .map((evaluation, index) => (
                        <tr key={evaluation.candidateId} className={index === 0 ? 'top-candidate' : ''}>
                          <td className="candidate-name">
                            <div>
                              <strong>{evaluation.candidateName}</strong>
                              {index === 0 && <span className="top-badge">🏆 Лучший</span>}
                            </div>
                          </td>
                          <td>
                            <div 
                              className="score-cell overall-score"
                              style={{ backgroundColor: getScoreColor(evaluation.overallScore) }}
                            >
                              <div className="score-value">{evaluation.overallScore}/10</div>
                              <div className="score-text">{getScoreLabel(evaluation.overallScore)}</div>
                            </div>
                          </td>
                          {criteria.map(criterion => {
                            const score = evaluation.criteriaScores[criterion] || 0;
                            return (
                              <td key={criterion}>
                                <div 
                                  className="score-cell"
                                  style={{ backgroundColor: getScoreColor(score) }}
                                >
                                  {score}/10
                                </div>
                              </td>
                            );
                          })}
                          <td>
                            <Link
                              to={`/jobs/${id}/candidates/${evaluation.candidateId}/evaluation`}
                              className="btn btn-sm btn-outline"
                            >
                              Посмотреть детали
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Лепестковая диаграмма */}
          <div className="card mb-6 radar-chart-container">
            <div className="card-content">
              <h3>🎯 Лепестковая диаграмма сравнения</h3>
              <p className="text-muted mb-4">
                Радар-диаграмма в стиле FIFA/PES для наглядного сравнения кандидатов по всем критериям
              </p>
              <div className="radar-chart-wrapper">
                <RadarChart
                  criteria={criteria}
                  candidates={evaluatedCandidates.map((evaluation, index) => ({
                    name: evaluation.candidateName,
                    scores: evaluation.criteriaScores,
                    color: getCandidateColor(index)
                  }))}
                  title="Сравнение кандидатов по критериям"
                />
              </div>
            </div>
          </div>

          {/* Графическое сравнение */}
          <div className="card">
            <div className="card-content">
              <h3>📊 Детальное визуальное сравнение</h3>
              <div className="visual-comparison">
                {criteria.map(criterion => (
                  <div key={criterion} className="criterion-comparison">
                    <h4>{criterion}</h4>
                    <div className="candidates-bars">
                      {evaluatedCandidates.map(evaluation => {
                        const score = evaluation.criteriaScores[criterion] || 0;
                        return (
                          <div key={evaluation.candidateId} className="candidate-bar">
                            <div className="candidate-name-small">{evaluation.candidateName}</div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ 
                                  width: `${score * 10}%`,
                                  backgroundColor: getScoreColor(score)
                                }}
                              >
                                <span className="progress-text">{score}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CandidateComparison; 