import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../api/client';
import { InterviewReport } from '@interviewiq/shared';

export const Reports: React.FC = () => {
  const [searchParams] = useSearchParams();
  const interviewId = searchParams.get('interviewId');
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = interviewId ? `/interviews/${interviewId}/report` : '/reports/latest';
    apiClient<InterviewReport>(endpoint)
      .then((data) => setReport(data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [interviewId]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Interview Assessment Intelligence Report
        </h1>
        <p className="text-xs font-mono text-slate-500 mt-1">
          EMPIRICAL EVIDENCE-BASED CANDIDATE EVALUATION
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 font-mono text-xs text-slate-500">
          COMPILING ASSESSMENT REPORT...
        </div>
      ) : !report ? (
        <div className="text-center py-12 space-y-3">
          <div className="text-sm font-semibold text-slate-700">No Assessment Report Found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Complete an adaptive interview session to generate a comprehensive 6-dimensional evaluation report.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Readiness Score Banner */}
          <Card className="bg-slate-900 text-white border-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  OVERALL READINESS SCORE
                </div>
                <div className="text-5xl font-bold font-mono text-white mt-1">
                  {report.overallReadiness.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Target Role: <span className="text-white font-medium">{report.role}</span>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="blue" size="md">
                  ASSESSMENT COMPLETE
                </Badge>
              </div>
            </div>
          </Card>

          {/* 01 EXECUTIVE SUMMARY */}
          <Card sectionNumber="01" sectionTitle="EXECUTIVE SUMMARY">
            <p className="text-sm text-slate-700 leading-relaxed font-sans">
              {report.executiveSummary}
            </p>
          </Card>

          {/* 02 COMPETENCY BREAKDOWN */}
          <Card sectionNumber="02" sectionTitle="COMPETENCY DIMENSIONS">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                <div className="text-[10px] text-slate-500">TECHNICAL CORRECTNESS</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {report.dimensionAverages.technicalCorrectness}%
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                <div className="text-[10px] text-slate-500">RELEVANCE</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {report.dimensionAverages.relevance}%
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                <div className="text-[10px] text-slate-500">DEPTH</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {report.dimensionAverages.depth}%
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                <div className="text-[10px] text-slate-500">PROBLEM SOLVING</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {report.dimensionAverages.problemSolving}%
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                <div className="text-[10px] text-slate-500">COMMUNICATION</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {report.dimensionAverages.communication}%
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                <div className="text-[10px] text-slate-500">COMPLETENESS</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {report.dimensionAverages.completeness}%
                </div>
              </div>
            </div>
          </Card>

          {/* 03 STRENGTHS & 04 WEAKNESSES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card sectionNumber="03" sectionTitle="KEY STRENGTHS">
              <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
                {report.keyStrengths.map((str, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {str}
                  </li>
                ))}
              </ul>
            </Card>

            <Card sectionNumber="04" sectionTitle="CRITICAL WEAKNESSES">
              <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
                {report.criticalWeaknesses.map((w, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {w}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* 07 PREPARATION PLAN */}
          <Card sectionNumber="07" sectionTitle="RECOMMENDED PREPARATION PLAN">
            <div className="space-y-3">
              {report.recommendedPreparationPlan.map((plan) => (
                <div
                  key={plan.priority}
                  className="p-3 border border-slate-100 bg-slate-50 rounded flex items-start space-x-3"
                >
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    P{plan.priority}
                  </span>
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-slate-900">
                      Focus: {plan.weaknesses.join(', ') || 'Foundation Drill'}
                    </div>
                    {plan.strengths.length > 0 && (
                      <p className="text-slate-600">Established Anchor: {plan.strengths.join(', ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
