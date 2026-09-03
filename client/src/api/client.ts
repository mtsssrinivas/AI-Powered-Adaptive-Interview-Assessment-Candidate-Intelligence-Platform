import {
  InterviewSession,
  CreateInterviewInput,
  Question,
  AnswerEvaluation,
  CandidateSkillNode,
  AnalyticsOverview,
  HistoricalTrendPoint,
  CompetencySummary,
  PreparationPlan,
  CodingProblem,
  CodingSubmission,
  CreditBalance,
} from '@interviewiq/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('interviewiq_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// System Health
export const checkHealth = async () => apiClient<any>('/health');

// Auth API
export const apiAuth = {
  login: (credentials: any) =>
    apiClient<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (payload: any) =>
    apiClient<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => apiClient<{ user: any }>('/auth/me'),
  logout: () => apiClient<any>('/auth/logout', { method: 'POST' }),
};

// Interviews API
export const apiInterviews = {
  list: () => apiClient<InterviewSession[]>('/interviews'),
  getById: (id: string) => apiClient<InterviewSession>(`/interviews/${id}`),
  create: (input: CreateInterviewInput) =>
    apiClient<InterviewSession>('/interviews', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  nextQuestion: (id: string) =>
    apiClient<Question>(`/interviews/${id}/next-question`, { method: 'POST' }),
  submitAnswer: (id: string, questionId: string, candidateAnswer: string) =>
    apiClient<{ evaluation: AnswerEvaluation; nextAction: any }>(`/interviews/${id}/answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId, candidateAnswer }),
    }),
};

// Coding Sandbox API
export const apiCoding = {
  getProblems: () => apiClient<CodingProblem[]>('/coding/problems'),
  getProblemById: (id: string) => apiClient<CodingProblem>(`/coding/problems/${id}`),
  runCode: (problemId: string, language: string, code: string) =>
    apiClient<any>('/coding/run', {
      method: 'POST',
      body: JSON.stringify({ problemId, language, code }),
    }),
  submitCode: (problemId: string, language: string, code: string, interviewId?: string) =>
    apiClient<CodingSubmission>('/coding/submit', {
      method: 'POST',
      body: JSON.stringify({ problemId, language, code, interviewId }),
    }),
};

// Analytics API
export const apiAnalytics = {
  getOverview: () => apiClient<AnalyticsOverview>('/analytics/overview'),
  getTrends: () => apiClient<HistoricalTrendPoint[]>('/analytics/trends'),
  getCompetencies: () => apiClient<CompetencySummary[]>('/analytics/competencies'),
};

// Preparation API
export const apiPreparation = {
  getPlan: () => apiClient<PreparationPlan>('/preparation/plan'),
  generatePlan: (targetRole?: string) =>
    apiClient<PreparationPlan>('/preparation/generate', {
      method: 'POST',
      body: JSON.stringify({ targetRole }),
    }),
};

// Candidate Intelligence & Profile
export const apiUsers = {
  getIntelligenceProfile: () => apiClient<any>('/users/intelligence-profile'),
  getReadiness: () => apiClient<any>('/users/readiness'),
};

// Skills API
export const apiSkills = {
  list: () => apiClient<CandidateSkillNode[]>('/skills'),
  getProfile: () => apiClient<any>('/skills/profile'),
};

// Resumes API
export const apiResumes = {
  upload: (formData: FormData) =>
    apiClient<any>('/resumes/upload', {
      method: 'POST',
      body: formData,
    }),
  list: () => apiClient<any[]>('/resumes'),
  getProjects: () => apiClient<any[]>('/resumes/projects'),
};

// Payments & Credits API
export const apiPayments = {
  getPlans: () => apiClient<any[]>('/payments/plans'),
  createOrder: (planId: string) =>
    apiClient<any>('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    }),
  verifyPayment: (payload: any) =>
    apiClient<any>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getBalance: () => apiClient<CreditBalance>('/credits/balance'),
};
