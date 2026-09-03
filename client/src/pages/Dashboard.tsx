import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { apiClient } from '../api/client';
import { AnalyticsOverview } from '@interviewiq/shared';

export const Dashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    apiClient<AnalyticsOverview>('/analytics/overview')
      .then((data) => setAnalytics(data))
      .catch((err) => {
        console.warn('Could not load analytics:', err);
        setAnalytics(null);
      });
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INTERVIEW INTELLIGENCE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Candidate Intelligence Cockpit
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1">
            CONTINUOUS EMPIRICAL COMPETENCY MODELING
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/interviews/new">
            <Button size="sm" className="space-x-1.5">
              <Plus className="w-4 h-4" />
              <span>Start Adaptive Interview</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Empirical Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Overall Readiness */}
        <Card className="flex flex-col justify-between">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            Overall Readiness
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
              {analytics?.overallReadiness !== null && analytics?.overallReadiness !== undefined
                ? `${analytics.overallReadiness.toFixed(1)}%`
                : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              {analytics?.dataAvailable ? 'Aggregate across sessions' : 'No evaluations yet'}
            </div>
          </div>
        </Card>

        {/* Interviews Completed */}
        <Card className="flex flex-col justify-between">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            Interviews Completed
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
              {analytics?.interviewsCompleted ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              Database verified records
            </div>
          </div>
        </Card>

        {/* Average Score */}
        <Card className="flex flex-col justify-between">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            Average Score
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
              {analytics?.averageScore !== null && analytics?.averageScore !== undefined
                ? `${analytics.averageScore.toFixed(1)}%`
                : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              Rubric weighted mean
            </div>
          </div>
        </Card>

        {/* Strongest Competency */}
        <Card className="flex flex-col justify-between">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            Strongest Skill
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900 truncate font-mono">
              {analytics?.strongestCompetency || 'Not evaluated'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              Empirical high benchmark
            </div>
          </div>
        </Card>

        {/* Weakest Competency */}
        <Card className="flex flex-col justify-between">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            Weakest Skill
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900 truncate font-mono">
              {analytics?.weakestCompetency || 'Not evaluated'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              Target for next practice
            </div>
          </div>
        </Card>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 01 PERFORMANCE */}
        <div className="lg:col-span-2 space-y-6">
          <Card sectionNumber="01" sectionTitle="PERFORMANCE RADAR & SCORES">
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Technical Correctness</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {analytics?.technicalCorrectness !== null && analytics?.technicalCorrectness !== undefined
                      ? `${analytics.technicalCorrectness.toFixed(1)}%`
                      : 'N/A'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Communication</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {analytics?.communication !== null && analytics?.communication !== undefined
                      ? `${analytics.communication.toFixed(1)}%`
                      : 'N/A'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Problem Solving</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {analytics?.problemSolving !== null && analytics?.problemSolving !== undefined
                      ? `${analytics.problemSolving.toFixed(1)}%`
                      : 'N/A'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">System Design</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {analytics?.systemDesign !== null && analytics?.systemDesign !== undefined
                      ? `${analytics.systemDesign.toFixed(1)}%`
                      : 'N/A'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">DSA Pass Rate</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {analytics?.codingTestPassRate !== null && analytics?.codingTestPassRate !== undefined
                      ? `${analytics.codingTestPassRate.toFixed(1)}%`
                      : 'N/A'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Questions Answered</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {analytics?.questionsCompleted ?? 0}
                  </div>
                </div>
              </div>

              {!analytics?.dataAvailable && (
                <div className="p-6 border border-dashed border-slate-200 rounded text-center space-y-2">
                  <Activity className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-mono text-slate-600">
                    No empirical interview assessments recorded yet.
                  </p>
                  <Link to="/interviews/new">
                    <Button variant="outline" size="sm" className="mt-2">
                      Start First Interview
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* 03 RECENT INTERVIEWS */}
          <Card
            sectionNumber="03"
            sectionTitle="RECENT INTERVIEWS"
            headerAction={
              <Link to="/interviews" className="text-xs font-mono text-blue-600 hover:underline">
                View All
              </Link>
            }
          >
            {analytics?.recentTrends && analytics.recentTrends.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {analytics.recentTrends.map((trend) => (
                  <div key={trend.interviewId} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-slate-900">{trend.role}</div>
                      <div className="text-xs font-mono text-slate-500">
                        {trend.mode} · {new Date(trend.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="blue">{trend.score.toFixed(1)}%</Badge>
                      <Link to={`/interviews/${trend.interviewId}`}>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 hover:text-slate-900" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs font-mono text-slate-400">
                No past interview records found.
              </div>
            )}
          </Card>
        </div>

        {/* Right Sidebar: 02 SKILL PROFILE & 04 PREPARATION */}
        <div className="space-y-6">
          {/* 02 SKILL PROFILE */}
          <Card
            sectionNumber="02"
            sectionTitle="SKILL GRAPH STATUS"
            headerAction={
              <Link to="/skills" className="text-xs font-mono text-blue-600 hover:underline">
                Explore Graph
              </Link>
            }
          >
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Competencies mapped from resume claims and verified through dynamic interview defense.
              </p>
              <div className="pt-2">
                <Link to="/profile">
                  <Button variant="outline" size="sm" className="w-full">
                    Upload Resume & Parse Skills
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* 04 PREPARATION */}
          <Card sectionNumber="04" sectionTitle="PREPARATION FOCUS">
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Personalized practice roadmaps generated dynamically from your lowest-scoring competency rubrics.
              </p>
              <Link to="/preparation">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View Weakness Practice Plan
                </Button>
              </Link>
            </div>
          </Card>

          {/* 05 ACTIVITY */}
          <Card sectionNumber="05" sectionTitle="SYSTEM TELEMETRY">
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">ENGINE:</span>
                <span className="text-slate-900 font-semibold">ADAPTIVE V2.0</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">CODE SANDBOX:</span>
                <span className="text-emerald-700 font-semibold">ISOLATED ACTIVE</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">EVALUATION RUBRIC:</span>
                <span className="text-slate-900 font-semibold">6-DIMENSIONAL</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
