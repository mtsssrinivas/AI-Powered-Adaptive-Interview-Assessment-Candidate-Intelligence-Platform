import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Clock,
  Send,
  HelpCircle,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../api/client';
import { InterviewSession, Question, AnswerEvaluation } from '@interviewiq/shared';

export const InterviewLive: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [lastEvaluation, setLastEvaluation] = useState<AnswerEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!id) return;
    apiClient<InterviewSession>(`/interviews/${id}`)
      .then((data) => {
        setSession(data);
        if (data.questions && data.questions.length > 0) {
          setCurrentQuestion(data.questions[data.currentQuestionIndex || 0]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [id]);

  const handleSubmitAnswer = async () => {
    if (!candidateAnswer.trim() || !id || !currentQuestion) return;
    setSubmitting(true);

    try {
      const result = await apiClient<any>(`/interviews/${id}/answer`, {
        method: 'POST',
        body: JSON.stringify({
          questionId: currentQuestion.id,
          candidateAnswer,
          durationSeconds: elapsedSeconds,
        }),
      });

      if (result.evaluation) {
        setLastEvaluation(result.evaluation);
      }

      if (result.nextQuestion) {
        setCurrentQuestion(result.nextQuestion);
        setCandidateAnswer('');
      } else if (result.completed) {
        window.location.href = `/reports?interviewId=${id}`;
      }
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center font-mono text-xs text-slate-500">
        INITIALIZING ADAPTIVE INTERVIEW SESSION...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-semibold text-blue-600">
              {session?.interviewMode || 'TECHNICAL'} ROUND
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-900">{session?.role}</span>
          </div>
          <div className="text-xs font-mono text-slate-500 mt-1">
            STATUS: {session?.currentState}
          </div>
        </div>

        <div className="flex items-center space-x-4 font-mono text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-900">{formatTime(elapsedSeconds)}</span>
          </div>
          <Badge variant="neutral">
            QUESTION {(session?.currentQuestionIndex ?? 0) + 1} OF {session?.plan.totalQuestionTarget ?? 6}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Center Area: Question & Answer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question Card */}
          <Card sectionNumber="QUESTION" sectionTitle={currentQuestion?.category || 'CORE COMPETENCY'}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge variant="blue">{currentQuestion?.difficulty || 'MEDIUM'}</Badge>
                <Badge variant="neutral">{currentQuestion?.skill || 'General'}</Badge>
                <span className="text-xs font-mono text-slate-400">
                  TYPE: {currentQuestion?.questionType || 'CONCEPTUAL'}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-slate-900 leading-relaxed">
                {currentQuestion?.question ||
                  'Explain how you design an idempotent payment processing API endpoint to prevent duplicate transactions.'}
              </h2>

              {currentQuestion?.resumeEvidenceCited && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 font-mono">
                  <span className="text-slate-400">PROJECT EVIDENCE CITED:</span>{' '}
                  "{currentQuestion.resumeEvidenceCited}"
                </div>
              )}
            </div>
          </Card>

          {/* Answer Composer */}
          <Card sectionNumber="CANDIDATE" sectionTitle="ANSWER COMPOSITION">
            <div className="space-y-4">
              <textarea
                rows={8}
                value={candidateAnswer}
                onChange={(e) => setCandidateAnswer(e.target.value)}
                placeholder="Structure your response with technical rationale, architectural trade-offs, and failure mode considerations..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white resize-y font-sans leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="space-x-1.5 text-slate-500">
                    <HelpCircle className="w-4 h-4" />
                    <span>Request Clarification</span>
                  </Button>
                </div>

                <Button
                  onClick={handleSubmitAnswer}
                  isLoading={submitting}
                  disabled={!candidateAnswer.trim()}
                  className="space-x-1.5"
                >
                  <span>Submit Answer</span>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Real Evaluation Feedback Drawer (if last answer was evaluated) */}
          {lastEvaluation && (
            <Card sectionNumber="EVALUATION" sectionTitle="PREVIOUS ANSWER RUBRIC">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded">
                    <div className="text-[10px] text-slate-500">CORRECTNESS</div>
                    <div className="text-sm font-bold text-slate-900">
                      {lastEvaluation.scores.technicalCorrectness}%
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded">
                    <div className="text-[10px] text-slate-500">RELEVANCE</div>
                    <div className="text-sm font-bold text-slate-900">
                      {lastEvaluation.scores.relevance}%
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded">
                    <div className="text-[10px] text-slate-500">DEPTH</div>
                    <div className="text-sm font-bold text-slate-900">
                      {lastEvaluation.scores.depth}%
                    </div>
                  </div>
                </div>

                {lastEvaluation.strengths.length > 0 && (
                  <div>
                    <div className="text-xs font-mono font-semibold text-emerald-700 uppercase mb-1">
                      Strengths
                    </div>
                    <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                      {lastEvaluation.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {lastEvaluation.missingConcepts.length > 0 && (
                  <div>
                    <div className="text-xs font-mono font-semibold text-amber-700 uppercase mb-1">
                      Missing Concepts
                    </div>
                    <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                      {lastEvaluation.missingConcepts.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Side Panel: Plan & Competencies */}
        <div className="space-y-6">
          <Card sectionNumber="PROGRESS" sectionTitle="SESSION BLUEPRINT">
            <div className="space-y-3">
              <div className="text-xs font-mono text-slate-500">
                ROLE: {session?.role}
              </div>
              <div className="text-xs font-mono text-slate-500">
                DIFFICULTY TARGET: {session?.plan.competencyWeights.length || 0} CATEGORIES
              </div>

              <div className="pt-2 space-y-2">
                {session?.plan.competencyWeights.map((w) => (
                  <div key={w.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-700">{w.category}</span>
                      <span className="text-slate-500">{w.percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${w.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
