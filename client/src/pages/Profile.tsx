import React, { useEffect, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../api/client';
import { Resume } from '@interviewiq/shared';

export const Profile: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = () => {
    apiClient<Resume[]>('/resumes')
      .then((data) => setResumes(data))
      .catch(() => setResumes([]));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('resume', selectedFile);

    try {
      await apiClient('/resumes/upload', {
        method: 'POST',
        body: formData,
      });
      setSelectedFile(null);
      loadResumes();
    } catch (err: any) {
      setError(err.message || 'Failed to upload and parse resume');
    } finally {
      setUploading(false);
    }
  };

  const latestResume = resumes[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Candidate Profile & Resume Intelligence
        </h1>
        <p className="text-xs font-mono text-slate-500 mt-0.5">
          STRUCTURED EVIDENCE EXTRACTION · PDF RESUME PARSER
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* Resume Upload Box */}
      <Card sectionNumber="01" sectionTitle="UPLOAD RESUME (PDF)">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded p-6 text-center space-y-2 hover:border-slate-300 bg-slate-50/50">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-xs text-slate-600">
              Select or drop your PDF resume for AI evidence extraction
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="text-xs font-mono text-slate-500"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={!selectedFile} isLoading={uploading} size="sm">
              Upload & Parse Intelligence
            </Button>
          </div>
        </form>
      </Card>

      {/* Parsed Intelligence Profile */}
      <Card sectionNumber="02" sectionTitle="PARSED CANDIDATE INTELLIGENCE">
        {!latestResume ? (
          <div className="text-center py-8 text-xs font-mono text-slate-400">
            No resume uploaded yet. Upload a PDF above to extract verified candidate intelligence.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-slate-900">{latestResume.fileName}</span>
              </div>
              <Badge variant={latestResume.status === 'COMPLETED' ? 'green' : 'amber'}>
                STATUS: {latestResume.status}
              </Badge>
            </div>

            {latestResume.parsedProfile && (
              <div className="space-y-6">
                {/* Profile Summary */}
                <div className="space-y-1">
                  <div className="text-xs font-mono text-slate-500 uppercase">Candidate Name</div>
                  <div className="text-lg font-bold text-slate-900">
                    {latestResume.parsedProfile.candidateName}
                  </div>
                  {latestResume.parsedProfile.summary && (
                    <p className="text-xs text-slate-600 mt-1">{latestResume.parsedProfile.summary}</p>
                  )}
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <div className="text-xs font-mono text-slate-500 uppercase">
                    Extracted Skills ({latestResume.parsedProfile.skills.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {latestResume.parsedProfile.skills.map((s, i) => (
                      <span
                        key={i}
                        title={`Evidence: ${s.evidence}`}
                        className="text-xs font-mono px-2 py-1 bg-slate-100 border border-slate-200 rounded text-slate-800"
                      >
                        {s.skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Projects */}
                <div className="space-y-3">
                  <div className="text-xs font-mono text-slate-500 uppercase">
                    Extracted Projects ({latestResume.parsedProfile.projects.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {latestResume.parsedProfile.projects.map((proj, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                        <div className="font-semibold text-xs text-slate-900">{proj.projectName}</div>
                        <p className="text-[11px] text-slate-600">{proj.description}</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {proj.technologies.map((t, idx) => (
                            <Badge key={idx} variant="neutral">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
