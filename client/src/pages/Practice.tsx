import React, { useState } from 'react';
import { Play, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../api/client';
import { SupportedLanguage } from '@interviewiq/shared';

export const Practice: React.FC = () => {
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState<string>(
    `def two_sum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in lookup:\n            return [lookup[diff], i]\n        lookup[num] = i\n    return []\n\n# Test call\nprint(two_sum([2, 7, 11, 15], 9))`
  );
  const [running, setRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const handleRunCode = async () => {
    setRunning(true);
    setExecutionResult(null);

    try {
      const result = await apiClient<any>('/coding/submit', {
        method: 'POST',
        body: JSON.stringify({
          problemId: 'two-sum',
          language,
          code,
        }),
      });
      setExecutionResult(result);
    } catch (err: any) {
      setExecutionResult({
        status: 'RUNTIME_ERROR',
        compileError: err.message || 'Execution failed',
        passRate: 0,
        runtimeMs: 0,
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            DSA Practice & Execution Sandbox
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            ISOLATED COMPILER HARNESS · ZERO EXPRESS HOST EXECUTION
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="python">Python 3.11</option>
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="cpp">C++ (GCC 13)</option>
            <option value="java">Java (OpenJDK 17)</option>
          </select>

          <Button onClick={handleRunCode} isLoading={running} size="sm" className="space-x-1.5">
            <Play className="w-3.5 h-3.5" />
            <span>Execute Code</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Problem & Editor */}
        <div className="space-y-6">
          <Card sectionNumber="01" sectionTitle="PROBLEM SPECIFICATION">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm text-slate-900">01. Two Sum</span>
                <Badge variant="green">EASY</Badge>
                <span className="text-xs font-mono text-slate-400">ARRAY / HASHMAP</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Given an array of integers <code className="font-mono text-blue-600">nums</code> and an integer{' '}
                <code className="font-mono text-blue-600">target</code>, return indices of the two numbers such that they add up to target.
              </p>
            </div>
          </Card>

          <Card sectionNumber="02" sectionTitle="CODE EDITOR">
            <textarea
              rows={16}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
              spellCheck={false}
            />
          </Card>
        </div>

        {/* Right: Sandbox Execution Console */}
        <div className="space-y-6">
          <Card sectionNumber="03" sectionTitle="ISOLATED EXECUTION TELEMETRY">
            {running ? (
              <div className="py-16 text-center font-mono text-xs text-slate-500 space-y-2">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                <p>RUNNING IN ISOLATED CHILD PROCESS SANDBOX...</p>
              </div>
            ) : !executionResult ? (
              <div className="py-16 text-center text-xs font-mono text-slate-400">
                Execute your solution to trigger sandboxed test cases.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="flex items-center space-x-2">
                    {executionResult.status === 'ACCEPTED' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span className="font-mono text-xs font-bold text-slate-900">
                      STATUS: {executionResult.status}
                    </span>
                  </div>
                  <Badge variant={executionResult.status === 'ACCEPTED' ? 'green' : 'red'}>
                    PASS RATE: {executionResult.passRate}%
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                    <span className="text-slate-500">RUNTIME:</span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {executionResult.runtimeMs} ms
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded">
                    <span className="text-slate-500">TESTS PASSED:</span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {executionResult.passedCount || 0} / {executionResult.totalCount || 0}
                    </div>
                  </div>
                </div>

                {executionResult.compileError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs font-mono text-rose-700 whitespace-pre-wrap">
                    {executionResult.compileError}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
