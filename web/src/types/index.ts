export interface Job {
  id?: number;
  title: string;
  description: string;
  requirements: string;
  criteria: string; // JSON string of criteria array - deprecated, use criteria_list
  criteria_list?: Criterion[]; // New structured criteria
  created_at?: string;
  updated_at?: string;
}

export interface Criterion {
  id: number;
  job_id: number;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id?: number;
  job_id: number;
  name: string;
  email: string;
  phone: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface CandidateWithJob extends Candidate {
  job_title: string;
}

export interface Question {
  id?: number;
  job_id: number;
  criterion_id: number; // Updated to use criterion_id
  text: string;
  criterion?: string; // Deprecated, for backward compatibility
  criterion_name?: string; // For display purposes
  created_at?: string;
  updated_at?: string;
}

export interface Evaluation {
  id?: number;
  candidate_id: number;
  criterion_id: number; // Updated to use criterion_id
  score: number; // 1-10
  comments: string;
  criterion?: string; // Deprecated, for backward compatibility
  criterion_name?: string; // For display purposes
  created_at?: string;
  updated_at?: string;
}

export interface Answer {
  id?: number;
  candidate_id: number;
  question_id: number;
  answer_text: string;
  created_at?: string;
  updated_at?: string;
}

export interface EvaluationSummary {
  candidate_id: number;
  candidate_name: string;
  job_title: string;
  evaluations: Evaluation[];
  average_score: number;
  chart_data: Record<string, number>;
}

export interface CriterionUpdate {
  name: string;
  display_order: number;
} 