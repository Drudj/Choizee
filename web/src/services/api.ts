import { Job, Candidate, CandidateWithJob, Question, Evaluation, Answer, Criterion, CriterionUpdate } from '../types';

const API_BASE = '/api';

// Класс для обработки API ошибок
class ApiError extends Error {
  constructor(message: string, public status?: number, public isNetworkError: boolean = false) {
    super(message);
    this.name = 'ApiError';
  }
}

// Функция retry с exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Не ретраим на 400-499 ошибки (client errors)
      if (error instanceof ApiError && error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

// Обертка для fetch с обработкой ошибок
async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      timeout: 10000, // 10 секунд timeout
    } as RequestInit);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      } catch {
        // Игнорируем ошибки парсинга error response
      }
      
      throw new ApiError(
        errorMessage,
        response.status,
        false
      );
    }
    
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network errors (connection failed, timeout, etc.)
    throw new ApiError(
      'Ошибка сети. Проверьте подключение к интернету.',
      undefined,
      true
    );
  }
}

export const api = {
  // Jobs
  async getJobs(): Promise<Job[]> {
    return retryWithBackoff(async () => {
      const response = await safeFetch(`${API_BASE}/jobs`);
      return response.json();
    });
  },

  async getJob(id: number): Promise<Job> {
    return retryWithBackoff(async () => {
      const response = await safeFetch(`${API_BASE}/jobs/${id}`);
      return response.json();
    });
  },

  async createJob(job: Omit<Job, 'id' | 'created_at' | 'updated_at'>): Promise<Job> {
    return retryWithBackoff(async () => {
      const response = await safeFetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      });
      return response.json();
    });
  },

  async updateJob(id: number, job: Omit<Job, 'id' | 'created_at' | 'updated_at'>): Promise<Job> {
    const response = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });
    if (!response.ok) throw new Error('Failed to update job');
    return response.json();
  },

  async deleteJob(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete job');
  },

  // Questions
  async getJobQuestions(jobId: number): Promise<Question[]> {
    const response = await fetch(`${API_BASE}/jobs/${jobId}/questions`);
    if (!response.ok) throw new Error('Failed to fetch questions');
    return response.json();
  },

  async getQuestion(id: number): Promise<Question> {
    const response = await fetch(`${API_BASE}/questions/${id}`);
    if (!response.ok) throw new Error('Failed to fetch question');
    return response.json();
  },

  async createQuestion(question: Omit<Question, 'id' | 'created_at' | 'updated_at'>): Promise<Question> {
    const response = await fetch(`${API_BASE}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    if (!response.ok) throw new Error('Failed to create question');
    return response.json();
  },

  async updateQuestion(id: number, question: Omit<Question, 'id' | 'created_at' | 'updated_at'>): Promise<Question> {
    const response = await fetch(`${API_BASE}/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    if (!response.ok) throw new Error('Failed to update question');
    return response.json();
  },

  async deleteQuestion(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/questions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete question');
  },

  // Candidates
  async getJobCandidates(jobId: number): Promise<CandidateWithJob[]> {
    const response = await fetch(`${API_BASE}/jobs/${jobId}/candidates`);
    if (!response.ok) throw new Error('Failed to fetch candidates');
    return response.json();
  },

  async getCandidate(id: number): Promise<Candidate> {
    const response = await fetch(`${API_BASE}/candidates/${id}`);
    if (!response.ok) throw new Error('Failed to fetch candidate');
    return response.json();
  },

  async createCandidate(candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>): Promise<Candidate> {
    const response = await fetch(`${API_BASE}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate),
    });
    if (!response.ok) throw new Error('Failed to create candidate');
    return response.json();
  },

  async updateCandidate(id: number, candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>): Promise<Candidate> {
    const response = await fetch(`${API_BASE}/candidates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate),
    });
    if (!response.ok) throw new Error('Failed to update candidate');
    return response.json();
  },

  async deleteCandidate(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/candidates/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete candidate');
  },

  // Evaluations
  async getCandidateEvaluations(candidateId: number): Promise<Evaluation[]> {
    return retryWithBackoff(async () => {
      const response = await safeFetch(`${API_BASE}/candidates/${candidateId}/evaluations`);
      return response.json();
    });
  },

  async saveCandidateEvaluations(candidateId: number, evaluations: Evaluation[]): Promise<void> {
    return retryWithBackoff(async () => {
      await safeFetch(`${API_BASE}/candidates/${candidateId}/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluations),
      });
    }, 2); // Меньше ретраев для POST операций
  },

  async getJobEvaluationsSummary(jobId: number): Promise<any[]> {
    return retryWithBackoff(async () => {
      const response = await safeFetch(`${API_BASE}/jobs/${jobId}/evaluations/summary`);
      return response.json();
    });
  },

  // Templates
  async getTemplates(): Promise<any[]> {
    return retryWithBackoff(async () => {
      const response = await safeFetch(`${API_BASE}/templates`);
      return response.json();
    });
  },

  async getTemplateById(id: string): Promise<any> {
    return retryWithBackoff(async () => {
      const response = await safeFetch(`${API_BASE}/templates/${id}`);
      return response.json();
    });
  },

  async getTemplateCategories(): Promise<string[]> {
    return retryWithBackoff(async () => {
      const response = await safeFetch(`${API_BASE}/templates/categories`);
      return response.json();
    });
  },

  async getTemplatesByCategory(category: string): Promise<any[]> {
    return retryWithBackoff(async () => {
      const response = await safeFetch(`${API_BASE}/templates/category/${encodeURIComponent(category)}`);
      return response.json();
    });
  },

  // Answers
  async getCandidateAnswers(candidateId: number): Promise<Answer[]> {
    return retryWithBackoff(async () => {
      const response = await safeFetch(`${API_BASE}/candidates/${candidateId}/answers`);
      return response.json();
    });
  },

  async saveCandidateAnswers(candidateId: number, answers: Answer[]): Promise<void> {
    return retryWithBackoff(async () => {
      await safeFetch(`${API_BASE}/candidates/${candidateId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });
    }, 2); // Меньше ретраев для POST операций
  },

  // Criteria
  async getJobCriteria(jobId: number): Promise<Criterion[]> {
    return retryWithBackoff(async () => {
      const response = await safeFetch(`${API_BASE}/jobs/${jobId}/criteria`);
      return response.json();
    });
  },

  async createCriterion(criterion: Omit<Criterion, 'id' | 'created_at' | 'updated_at'>): Promise<Criterion> {
    return retryWithBackoff(async () => {
      const response = await safeFetch(`${API_BASE}/criteria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(criterion),
      });
      return response.json();
    }, 2);
  },

  async updateCriterion(id: number, update: CriterionUpdate): Promise<Criterion> {
    return retryWithBackoff(async () => {
      const response = await safeFetch(`${API_BASE}/criteria/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      return response.json();
    }, 2);
  },

  async deleteCriterion(id: number): Promise<void> {
    return retryWithBackoff(async () => {
      await safeFetch(`${API_BASE}/criteria/${id}`, {
        method: 'DELETE',
      });
    }, 2);
  },

  async updateJobCriteria(jobId: number, criteriaNames: string[]): Promise<Criterion[]> {
    console.log('🔧 updateJobCriteria called:', { jobId, criteriaNames });
    
    return retryWithBackoff(async () => {
      console.log('📡 Sending request to:', `${API_BASE}/jobs/${jobId}/criteria`);
      console.log('📦 Request payload:', JSON.stringify(criteriaNames));
      
      const response = await safeFetch(`${API_BASE}/jobs/${jobId}/criteria`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(criteriaNames),
      });
      
      const result = await response.json();
      console.log('✅ Response received:', result);
      return result;
    }, 2);
  },

  async reorderCriteria(jobId: number, criteriaIDs: number[]): Promise<void> {
    return retryWithBackoff(async () => {
      await safeFetch(`${API_BASE}/jobs/${jobId}/criteria/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(criteriaIDs),
      });
    }, 2);
  },
};

// Экспортируем ApiError для использования в компонентах
export { ApiError }; 