export interface Job {
  id?: number;
  title: string;
  description: string;
  requirements: string;
  criteria: string; // JSON string of criteria array
  created_at?: string;
  updated_at?: string;
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
  text: string;
  criterion: string;
  created_at?: string;
  updated_at?: string;
}

export interface Evaluation {
  id?: number;
  candidate_id: number;
  criterion: string;
  score: number; // 1-10
  comments: string;
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