import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../api/client';
import { CandidateSkillProfile } from '@interviewiq/shared';

export const Skills: React.FC = () => {
  const [profile, setProfile] = useState<CandidateSkillProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<CandidateSkillProfile>('/skills/profile')
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Candidate Competency Skill Graph
        </h1>
        <p className="text-xs font-mono text-slate-500 mt-0.5">
          RESUME CLAIMS VS. EMPIRICALLY DEMONSTRATED COMPETENCY
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-[11px] font-mono text-slate-500 uppercase">Tracked Skills</div>
          <div className="text-3xl font-bold font-mono text-slate-900 mt-2">
            {profile?.totalSkillsTracked ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">Claimed in portfolio</div>
        </Card>

        <Card>
          <div className="text-[11px] font-mono text-slate-500 uppercase">Assessed in Interviews</div>
          <div className="text-3xl font-bold font-mono text-slate-900 mt-2">
            {profile?.assessedSkillsCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">Empirically evaluated</div>
        </Card>

        <Card>
          <div className="text-[11px] font-mono text-slate-500 uppercase">Awaiting Verification</div>
          <div className="text-3xl font-bold font-mono text-slate-900 mt-2">
            {profile?.unassessedSkillsCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">Exposure only</div>
        </Card>
      </div>

      <Card sectionNumber="01" sectionTitle="COMPETENCY CATEGORIES & EVIDENCE">
        {loading ? (
          <div className="text-center py-8 font-mono text-xs text-slate-500">
            LOADING COMPETENCY MODEL...
          </div>
        ) : !profile || profile.totalSkillsTracked === 0 ? (
          <div className="text-center py-12 text-xs font-mono text-slate-400">
            No candidate skills extracted yet. Upload a resume to seed your competency graph.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(profile.categoryBreakdown).map(([category, data]) => (
              <div key={category} className="space-y-3 border-b border-slate-100 pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-900 font-mono uppercase">
                    {category} ({data.total})
                  </h3>
                  <span className="text-xs font-mono text-slate-500">
                    Average Score:{' '}
                    {data.averageScore !== null ? `${data.averageScore.toFixed(1)}%` : 'Unassessed'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {data.skills.map((node) => (
                    <div key={node.id} className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900">{node.skill}</span>
                        <Badge
                          variant={
                            node.proficiencyScore !== null && node.proficiencyScore >= 75
                              ? 'green'
                              : node.proficiencyScore !== null
                              ? 'amber'
                              : 'neutral'
                          }
                        >
                          {node.proficiencyScore !== null ? `${node.proficiencyScore.toFixed(1)}%` : 'EXPOSURE'}
                        </Badge>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-1">
                        <div>
                          <span className="font-mono text-[10px] text-slate-400">RESUME EVIDENCE:</span>{' '}
                          <span className="italic">
                            {node.resumeEvidence[0] || 'No specific snippet recorded'}
                          </span>
                        </div>
                        <div>
                          <span className="font-mono text-[10px] text-slate-400">INTERVIEW STATUS:</span>{' '}
                          {node.assessmentCount > 0
                            ? `Assessed in ${node.assessmentCount} session(s)`
                            : 'Not yet tested in interview'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
