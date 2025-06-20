import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Job, Candidate, Question, Evaluation, Answer, Criterion } from '../types';
import { api } from '../services/api';

interface EvaluationCriteria {
  criterion: string;
  criterion_id: number;
  score: number;
  notes: string;
  questions: Question[];
  questionStates: { [questionId: number]: { asked: boolean; answer: string } };
}

interface CandidateEvaluationData {
  id?: number;
  candidate_id: number;
  job_id: number;
  criteria_scores: EvaluationCriteria[];
  overall_score: number;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

const CandidateInterview: React.FC = () => {
  const { jobId, candidateId } = useParams<{ jobId: string; candidateId: string }>();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<Job | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [criteria, setCriteria] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationCriteria[]>([]);
  const [overallNotes, setOverallNotes] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId && candidateId) {
      loadData();
    }
  }, [jobId, candidateId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем вакансию, кандидата, критерии, вопросы, существующие оценки и ответы
      const [jobData, candidateData, criteriaData, questionsData, existingEvaluations, existingAnswers] = await Promise.all([
        api.getJob(Number(jobId)),
        api.getCandidate(Number(candidateId)),
        api.getJobCriteria(Number(jobId)),
        api.getJobQuestions(Number(jobId)),
        api.getCandidateEvaluations(Number(candidateId)).catch(() => []), // не критичная ошибка если оценок еще нет
        api.getCandidateAnswers(Number(candidateId)).catch(() => []) // не критичная ошибка если ответов еще нет
      ]);

      setJob(jobData);
      setCandidate(candidateData);
      setQuestions(questionsData || []);
      setAnswers(existingAnswers || []);

      // Используем критерии из API
      const jobCriteria = criteriaData || [];
      setCriteria(jobCriteria.map(c => c.name));

      // Группируем вопросы по критериям и инициализируем оценки
      const initialEvaluation = jobCriteria.map((criterion: Criterion) => {
        // Ищем существующую оценку для этого критерия (убеждаемся что existingEvaluations это массив)
        const evaluationsArray = Array.isArray(existingEvaluations) ? existingEvaluations : [];
        const existingEval = evaluationsArray.find(e => e.criterion_name === criterion.name);
        
        // Фильтруем вопросы для текущего критерия
        const criterionQuestions = questionsData?.filter((q: Question) => q.criterion_name === criterion.name) || [];
        
        // Инициализируем состояние вопросов с существующими ответами
        const questionStates: { [questionId: number]: { asked: boolean; answer: string } } = {};
        criterionQuestions.forEach(question => {
          const existingAnswer = existingAnswers?.find(a => a.question_id === question.id);
          questionStates[question.id!] = {
            asked: !!existingAnswer, // отмечаем вопрос как заданный если есть ответ
            answer: existingAnswer?.answer_text || ''
          };
        });
        
        return {
          criterion: criterion.name,
          criterion_id: criterion.id,
          score: existingEval?.score || 0,
          notes: existingEval?.comments || '',
          questions: criterionQuestions,
          questionStates
        };
      });
      setEvaluation(initialEvaluation);

    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (index: number, score: number) => {
    const newEvaluation = [...evaluation];
    newEvaluation[index].score = score;
    setEvaluation(newEvaluation);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const newEvaluation = [...evaluation];
    newEvaluation[index].notes = notes;
    setEvaluation(newEvaluation);
  };

  const handleQuestionAskedChange = (evaluationIndex: number, questionId: number, asked: boolean) => {
    const newEvaluation = [...evaluation];
    newEvaluation[evaluationIndex].questionStates[questionId].asked = asked;
    setEvaluation(newEvaluation);
  };

  const handleAnswerChange = (evaluationIndex: number, questionId: number, answer: string) => {
    const newEvaluation = [...evaluation];
    newEvaluation[evaluationIndex].questionStates[questionId].answer = answer;
    setEvaluation(newEvaluation);
  };

  const calculateOverallScore = () => {
    if (evaluation.length === 0) return 0;
    const totalScore = evaluation.reduce((sum, item) => sum + item.score, 0);
    return Math.round(totalScore / evaluation.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!candidate || !job) return;

    try {
      setSaving(true);
      setSaveStatus('idle');
      
      // Преобразуем оценки в формат API
      const evaluationsForAPI: Evaluation[] = evaluation.map(item => ({
        candidate_id: candidate.id!,
        criterion_id: item.criterion_id,
        score: item.score,
        comments: item.notes
      }));

      // Собираем ответы для сохранения
      const answersForAPI: Answer[] = [];
      evaluation.forEach(criterionEval => {
        criterionEval.questions.forEach(question => {
          const questionState = criterionEval.questionStates[question.id!];
          if (questionState.answer.trim()) { // сохраняем только если есть ответ
            answersForAPI.push({
              candidate_id: candidate.id!,
              question_id: question.id!,
              answer_text: questionState.answer
            });
          }
        });
      });

      // Сохраняем оценки и ответы через API
      await Promise.all([
        api.saveCandidateEvaluations(candidate.id!, evaluationsForAPI),
        api.saveCandidateAnswers(candidate.id!, answersForAPI)
      ]);
      
      setSaveStatus('success');
      
      // Автоматически возвращаемся через 2 секунды
      setTimeout(() => {
        navigate(`/jobs/${jobId}/candidates`);
      }, 2000);

    } catch (err) {
      setError('Ошибка сохранения оценки');
      setSaveStatus('error');
      console.error(err);
    } finally {
      setSaving(false);
    }
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

  if (!job || !candidate) {
    return (
      <div className="card">
        <div className="card-content text-center">
          <h3>Данные не найдены</h3>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            Назад
          </button>
        </div>
      </div>
    );
  }

  const overallScore = calculateOverallScore();

  return (
    <div>
      <div className="page-header">
        <h2>🎯 Интервью с кандидатом</h2>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          ← Назад
        </button>
      </div>

      {/* Информация о кандидате и вакансии */}
      <div className="grid grid-2 mb-6">
        <div className="card">
          <div className="card-content">
            <h3>👤 Кандидат</h3>
            <p><strong>Имя:</strong> {candidate.name}</p>
            <p><strong>Email:</strong> {candidate.email}</p>
            <p><strong>Телефон:</strong> {candidate.phone}</p>
            {candidate.description && (
              <p><strong>Описание:</strong> {candidate.description}</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <h3>💼 Вакансия</h3>
            <p><strong>Название:</strong> {job.title}</p>
            <p><strong>Критериев оценки:</strong> {criteria.length}</p>
            
            {overallScore > 0 && (
              <div className="mt-4">
                <h4>Общая оценка</h4>
                <div 
                  className="score-display"
                  style={{ 
                    backgroundColor: getScoreColor(overallScore),
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {overallScore}/10
                  </div>
                  <div>{getScoreLabel(overallScore)}</div>
                </div>
              </div>
            )}

            {saveStatus === 'success' && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
                ✅ Оценка сохранена! Возвращаемся к списку кандидатов...
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
                ❌ Ошибка сохранения оценки
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Интервью по критериям */}
        {evaluation.map((item, index) => (
          <div key={index} className="card mb-6">
            <div className="card-content">
                          <div className="criterion-header" style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '8px',
              color: 'white',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📋 {item.criterion}
              </h3>
              <div className="criterion-meta" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.85rem'
              }}>
                <span style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontWeight: '500'
                }}>
                  {item.questions.length} вопросов
                </span>
                <span style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontWeight: '500'
                }}>
                  {item.score > 0 ? `${item.score}/10` : 'Не оценено'}
                </span>
              </div>
            </div>

              {/* Вопросы для этого критерия */}
              {item.questions.length > 0 && (
                <div className="questions-section mb-6">
                  <h4 className="questions-title" style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '1rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    ❓ Вопросы для интервью ({item.questions.length}):
                  </h4>
                  <div className="questions-list">
                    {item.questions.map((question, qIndex) => {
                      const questionState = item.questionStates[question.id!];
                      return (
                        <div key={qIndex} className="question-block" style={{ 
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          marginBottom: '2rem',
                          overflow: 'hidden',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          transition: 'box-shadow 0.2s ease'
                        }}>
                          {/* Заголовок вопроса */}
                          <div style={{ 
                            backgroundColor: questionState?.asked ? '#dbeafe' : '#f8fafc',
                            borderBottom: '1px solid #e2e8f0',
                            padding: '1rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                          }}>
                            <label style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.75rem',
                              cursor: 'pointer',
                              flex: 1
                            }}>
                              <input
                                type="checkbox"
                                id={`question-${question.id}`}
                                checked={questionState?.asked || false}
                                onChange={(e) => handleQuestionAskedChange(index, question.id!, e.target.checked)}
                                style={{ 
                                  width: '18px',
                                  height: '18px',
                                  cursor: 'pointer'
                                }}
                              />
                              <span style={{
                                backgroundColor: questionState?.asked ? '#3b82f6' : '#6b7280',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                whiteSpace: 'nowrap'
                              }}>
                                Вопрос {qIndex + 1}
                              </span>
                            </label>
                            {questionState?.asked && (
                              <div style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                padding: '0.375rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                ✓ Задан
                              </div>
                            )}
                          </div>

                          {/* Содержимое вопроса */}
                          <div style={{ padding: '1.5rem' }}>
                            {/* Текст вопроса */}
                            <div style={{ marginBottom: '1.5rem' }}>
                              <h4 style={{
                                margin: '0 0 0.75rem 0',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                color: '#374151',
                                textTransform: 'uppercase',
                                letterSpacing: '0.025em'
                              }}>
                                Вопрос для интервью:
                              </h4>
                              <div style={{ 
                                fontSize: '1.1rem',
                                lineHeight: '1.6',
                                color: '#1f2937',
                                fontWeight: questionState?.asked ? '600' : '500',
                                padding: '1rem',
                                backgroundColor: questionState?.asked ? '#eff6ff' : '#f9fafb',
                                borderRadius: '8px',
                                border: questionState?.asked ? '1px solid #bfdbfe' : '1px solid #e5e7eb'
                              }}>
                                {question.text}
                              </div>
                            </div>
                            
                            {/* Поле для ответа */}
                            <div>
                              <h4 style={{
                                margin: '0 0 0.75rem 0',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                color: '#374151',
                                textTransform: 'uppercase',
                                letterSpacing: '0.025em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}>
                                💬 Ответ кандидата:
                              </h4>
                              <textarea
                                value={questionState?.answer || ''}
                                onChange={(e) => handleAnswerChange(index, question.id!, e.target.value)}
                                placeholder="Запишите подробный ответ кандидата на этот вопрос..."
                                rows={4}
                                style={{ 
                                  width: '100%',
                                  minHeight: '120px',
                                  padding: '1rem',
                                  border: '2px solid #e5e7eb',
                                  borderRadius: '8px',
                                  fontSize: '1rem',
                                  lineHeight: '1.5',
                                  fontFamily: 'inherit',
                                  resize: 'vertical',
                                  outline: 'none',
                                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                  backgroundColor: '#ffffff'
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = '#3b82f6';
                                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = '#e5e7eb';
                                  e.target.style.boxShadow = 'none';
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {item.questions.length === 0 && (
                <div className="no-questions" style={{ 
                  marginBottom: '1rem',
                  padding: '1rem',
                  backgroundColor: '#fef3cd',
                  border: '1px solid #fbbf24',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: 0, color: '#92400e', fontSize: '0.9rem' }}>
                    ⚠️ Нет вопросов для этого критерия
                  </p>
                </div>
              )}

              {/* Оценка */}
              <div className="evaluation-section" style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '1rem'
              }}>
                <h4 className="evaluation-title" style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '1rem'
                }}>
                  ⭐ Оценка кандидата:
                </h4>
                
                <div className="score-selector" style={{ marginBottom: '1rem' }}>
                  <div className="score-buttons" style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.4rem',
                    marginBottom: '0.75rem'
                  }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <button
                        key={score}
                        type="button"
                        className={`score-btn ${item.score === score ? 'active' : ''}`}
                        onClick={() => handleScoreChange(index, score)}
                        style={{
                          backgroundColor: item.score === score ? getScoreColor(score) : '#ffffff',
                          color: item.score === score ? 'white' : '#64748b',
                          border: `1px solid ${item.score === score ? getScoreColor(score) : '#d1d5db'}`,
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          minWidth: '2.5rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  {item.score > 0 && (
                    <div className="score-label" style={{ 
                      color: getScoreColor(item.score), 
                      fontWeight: 'bold',
                      fontSize: '0.95rem',
                      textAlign: 'center',
                      padding: '0.4rem',
                      backgroundColor: `${getScoreColor(item.score)}15`,
                      borderRadius: '6px',
                      border: `1px solid ${getScoreColor(item.score)}30`
                    }}>
                      {getScoreLabel(item.score)} ({item.score}/10)
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" style={{
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#64748b',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Комментарии и заметки:
                  </label>
                  <textarea
                    className="form-textarea"
                    value={item.notes}
                    onChange={(e) => handleNotesChange(index, e.target.value)}
                    placeholder="Заметки по ответам кандидата, особенности, рекомендации..."
                    rows={3}
                    style={{
                      fontSize: '0.9rem',
                      width: '100%',
                      minHeight: '80px',
                      resize: 'vertical',
                      padding: '0.6rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      lineHeight: '1.4',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Общие комментарии */}
        <div className="card mb-6">
          <div className="card-content">
            <h3>📝 Общие впечатления</h3>
            <textarea
              className="form-textarea"
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
              placeholder="Общие впечатления о кандидате, soft skills, коммуникация, мотивация, культурный фит..."
              rows={6}
              style={{ width: '100%', minHeight: '150px', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-gap">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || evaluation.some(item => item.score === 0)}
            style={{
              backgroundColor: saving ? '#9ca3af' : '#3b82f6',
              fontSize: '1.1rem',
              padding: '0.75rem 2rem'
            }}
          >
            {saving ? '💾 Сохранение...' : '💾 Завершить интервью'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default CandidateInterview; 