import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiClient } from '../api/client';
import { InterviewType, ExperienceLevel } from '@interviewiq/shared';

export const NewInterview: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('Senior Backend Engineer');
  const [interviewMode, setInterviewMode] = useState<InterviewType>('BACKEND');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('SENIOR');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questionCount, setQuestionCount] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const interviewModes: { type: InterviewType; label: string; desc: string }[] = [
    { type: 'TECHNICAL', label: 'Technical Core', desc: 'Core CS fundamentals, OOP, and engineering principles' },
    { type: 'BACKEND', label: 'Backend Systems', desc: 'REST, databases, distributed caching, async messaging' },
    { type: 'FRONTEND', label: 'Frontend & UI', desc: 'React, browser performance, DOM, CSS architecture' },
    { type: 'AIML', label: 'AI & ML Systems', desc: 'LLMs, vector embeddings, pipelines, model deployment' },
    { type: 'DSA', label: 'Data Structures & Alg', desc: 'Complexity analysis, algorithmic problem solving' },
    { type: 'SYSTEM_DESIGN', label: 'System Design', desc: 'High-scale architecture, sharding, availability, CAP' },
    { type: 'PROJECT_DEFENSE', label: 'Project Defense', desc: 'Rigorous interrogation of your claimed resume projects' },
    { type: 'BEHAVIORAL', label: 'Behavioral & Leadership', desc: 'STAR format conflict, ownership, communication' },
    { type: 'FULL_INTERVIEW', label: 'Comprehensive Full Round', desc: 'Multi-stage assessment across all disciplines' },
  ];

  const handleStart = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await apiClient<any>('/interviews', {
        method: 'POST',
        body: JSON.stringify({
          role,
          interviewMode,
          experienceLevel,
          durationMinutes,
          questionCount,
        }),
      });

      if (response.id) {
        navigate(`/interviews/${response.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize interview plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Configure Adaptive Interview Session
        </h1>
        <p className="text-xs font-mono text-slate-500 mt-0.5">
          EVALUATION BLUEPRINT GENERATION
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* 01 Target Role & Experience */}
      <Card sectionNumber="01" sectionTitle="TARGET ROLE & SENIORITY">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-mono font-medium text-slate-700">
              TARGET ROLE TITLE
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono font-medium text-slate-700">
              EXPERIENCE LEVEL
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ENTRY">Entry Level (0-1 yrs)</option>
              <option value="JUNIOR">Junior (1-3 yrs)</option>
              <option value="MID">Mid-Level (3-5 yrs)</option>
              <option value="SENIOR">Senior (5-8 yrs)</option>
              <option value="STAFF">Staff / Principal (8+ yrs)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 02 Interview Mode */}
      <Card sectionNumber="02" sectionTitle="INTERVIEW DISCIPLINE & FOCUS">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {interviewModes.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => setInterviewMode(item.type)}
              className={`p-3 text-left border rounded transition-all ${
                interviewMode === item.type
                  ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="font-semibold text-xs text-slate-900 font-mono">{item.label}</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-snug">{item.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* 03 Session Parameters */}
      <Card sectionNumber="03" sectionTitle="EXECUTION PARAMETERS">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-mono font-medium text-slate-700">
              DURATION: {durationMinutes} MINUTES
            </label>
            <input
              type="range"
              min={15}
              max={60}
              step={5}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
              className="w-full accent-blue-600"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono font-medium text-slate-700">
              QUESTION TARGET: {questionCount} QUESTIONS
            </label>
            <input
              type="range"
              min={3}
              max={15}
              step={1}
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
              className="w-full accent-blue-600"
            />
          </div>
        </div>
      </Card>

      {/* Launch CTA */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={() => navigate('/interviews')}>
          Cancel
        </Button>
        <Button onClick={handleStart} isLoading={loading} size="lg">
          Generate Plan & Launch Interview
        </Button>
      </div>
    </div>
  );
};
