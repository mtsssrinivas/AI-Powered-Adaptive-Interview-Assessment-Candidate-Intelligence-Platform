import React, { useEffect, useState } from 'react';
import { Compass, Clock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../api/client';
import { PreparationPlan } from '@interviewiq/shared';

export const Preparation: React.FC = () => {
  const [plan, setPlan] = useState<PreparationPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<PreparationPlan>('/analytics/preparation')
      .then((data) => setPlan(data))
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Personalized Preparation Roadmap
        </h1>
        <p className="text-xs font-mono text-slate-500 mt-0.5">
          DYNAMICALLY SYNTHESIZED FROM DETECTED RUBRIC DEFICIENCIES
        </p>
      </div>

      <Card sectionNumber="01" sectionTitle="TARGET WEAKNESS ROADMAP">
        {loading ? (
          <div className="text-center py-8 font-mono text-xs text-slate-500">
            SYNTHESIZING PREPARATION PLAN...
          </div>
        ) : !plan || plan.recommendations.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Compass className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">No Weakness Roadmap Yet</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Once you complete an adaptive interview, InterviewIQ detects specific missing concepts and generates an actionable study plan.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {plan.recommendations.map((rec) => (
              <div
                key={rec.priority}
                className="p-4 bg-slate-50 border border-slate-200 rounded space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      PRIORITY {rec.priority}
                    </span>
                    <h3 className="font-semibold text-sm text-slate-900">{rec.topic}</h3>
                    <Badge variant="neutral">{rec.category}</Badge>
                  </div>
                  <div className="flex items-center space-x-1 text-xs font-mono text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{rec.estimatedHours} hrs</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Root Cause:</span> {rec.reason}
                </p>

                <div className="text-xs text-slate-700 bg-white p-2.5 border border-slate-200 rounded">
                  <span className="font-mono font-semibold text-blue-600">ACTIONABLE PRACTICE:</span>{' '}
                  {rec.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
