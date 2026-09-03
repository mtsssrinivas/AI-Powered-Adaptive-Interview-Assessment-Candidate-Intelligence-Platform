import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { apiClient } from '../api/client';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetRole, setTargetRole] = useState('Backend Engineer');
  const [experienceLevel, setExperienceLevel] = useState('MID');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiClient<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          targetRole,
          experienceLevel,
        }),
      });

      if (response.token) {
        localStorage.setItem('interviewiq_token', response.token);
        localStorage.setItem('interviewiq_user', JSON.stringify(response.user));
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block font-mono font-bold text-lg tracking-tight text-slate-900">
            INTERVIEW<span className="text-blue-600">IQ</span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create Candidate Account</h2>
          <p className="text-xs text-slate-500 font-mono">100 WELCOME CREDITS INCLUDED</p>
        </div>

        <Card sectionNumber="01" sectionTitle="ACCOUNT PROFILE">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-mono font-medium text-slate-700">
                FULL NAME
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono font-medium text-slate-700">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono font-medium text-slate-700">
                PASSWORD (MIN 8 CHARS, 1 UPPER, 1 NUMBER)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-mono font-medium text-slate-700">
                  TARGET ROLE
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="Backend Engineer">Backend Engineer</option>
                  <option value="Frontend Engineer">Frontend Engineer</option>
                  <option value="Full Stack Engineer">Full Stack Engineer</option>
                  <option value="AI/ML Engineer">AI/ML Engineer</option>
                  <option value="System Architect">System Architect</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono font-medium text-slate-700">
                  EXPERIENCE
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="ENTRY">Entry Level</option>
                  <option value="JUNIOR">Junior (1-2 yrs)</option>
                  <option value="MID">Mid (3-5 yrs)</option>
                  <option value="SENIOR">Senior (6+ yrs)</option>
                  <option value="STAFF">Staff / Principal</option>
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>
              Create Candidate Account
            </Button>

            <div className="pt-2 text-center text-xs text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Sign In
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
