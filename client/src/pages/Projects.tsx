import React, { useEffect, useState } from 'react';
import { FolderGit2, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../api/client';
import { ExtractedProject } from '@interviewiq/shared';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<ExtractedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<ExtractedProject[]>('/resumes/projects')
      .then((data) => setProjects(data))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Project Defense Studio
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            RESUME PROJECT INTERROGATION · ARCHITECTURAL TRADEOFF DEFENSE
          </p>
        </div>
      </div>

      <Card sectionNumber="01" sectionTitle="VERIFIED RESUME PROJECTS">
        {loading ? (
          <div className="text-center py-8 font-mono text-xs text-slate-500">
            LOADING EXTRACTED PROJECTS...
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <FolderGit2 className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">No Projects Extracted</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload your technical resume to parse claimed projects and practice defending your architecture against senior AI interviewers.
            </p>
            <div className="pt-2">
              <a href="/profile">
                <Button size="sm">Upload Resume</Button>
              </a>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projects.map((proj, idx) => (
              <div key={idx} className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm">{proj.projectName}</h3>
                  <a href={`/interviews/new?mode=PROJECT_DEFENSE&project=${encodeURIComponent(proj.projectName)}`}>
                    <Button variant="outline" size="sm" className="space-x-1">
                      <span>Launch Defense Round</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {proj.technologies.map((t, i) => (
                    <Badge key={i} variant="neutral">
                      {t}
                    </Badge>
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
