import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowUpRight, Mic, Calendar, Clock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../api/client';
import { InterviewSession } from '@interviewiq/shared';

export const Interviews: React.FC = () => {
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<InterviewSession[]>('/interviews')
      .then((data) => setInterviews(data))
      .catch(() => setInterviews([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Adaptive Interviews
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            SESSION LOGS & ACTIVE EVALUATIONS
          </p>
        </div>
        <Link to="/interviews/new">
          <Button size="sm" className="space-x-1.5">
            <Plus className="w-4 h-4" />
            <span>Configure New Interview</span>
          </Button>
        </Link>
      </div>

      <Card sectionNumber="01" sectionTitle="INTERVIEW SESSIONS">
        {loading ? (
          <div className="text-center py-8 text-xs font-mono text-slate-500">
            Loading interview sessions...
          </div>
        ) : interviews.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Mic className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">No interviews launched yet</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Configure a targeted interview to begin empirical competency evaluation with AI adaptive questioning.
            </p>
            <div className="pt-2">
              <Link to="/interviews/new">
                <Button size="sm">Start Adaptive Session</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {interviews.map((session) => (
              <div
                key={session.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-slate-900">{session.role}</span>
                    <Badge variant="blue">{session.interviewMode}</Badge>
                    <Badge variant="neutral">{session.experienceLevel}</Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-xs font-mono text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{session.plan.estimatedDurationMinutes} mins</span>
                    </span>
                    <span>State: {session.currentState}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {session.overallScore !== null && (
                    <div className="text-right font-mono">
                      <div className="text-xs text-slate-500">Score</div>
                      <div className="text-base font-bold text-slate-900">
                        {session.overallScore.toFixed(1)}%
                      </div>
                    </div>
                  )}

                  <Link to={`/interviews/${session.id}`}>
                    <Button variant="outline" size="sm" className="space-x-1">
                      <span>{session.currentState === 'COMPLETED' ? 'View Report' : 'Resume'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
