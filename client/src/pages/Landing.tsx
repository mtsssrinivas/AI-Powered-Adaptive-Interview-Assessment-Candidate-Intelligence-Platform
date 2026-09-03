import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Cpu, Code2, LineChart } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-mono font-bold text-base tracking-tight text-slate-900">
            INTERVIEW<span className="text-blue-600">IQ</span>
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
            2.0
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/login">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-20 flex-1 flex flex-col justify-center">
        <div className="space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs font-mono font-medium">
            <span>00 ARCHITECTURE DIRECTIVE</span>
            <span>·</span>
            <span>NOT A CHATBOT WRAPPER</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-[1.1]">
            Adaptive Interview Assessment & Candidate Intelligence.
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            Evaluates technical correctness, communication, and depth with structured evidence.
            Adapts questions dynamically to candidate performance and project claims.
          </p>

          <div className="pt-4 flex items-center space-x-4">
            <Link to="/register">
              <Button size="lg" className="space-x-2">
                <span>Launch Assessment Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                View Candidate Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-20 border-t border-slate-200 mt-16">
          <div className="space-y-2 p-4 bg-white border border-slate-200 rounded">
            <div className="flex items-center space-x-2 text-blue-600">
              <Cpu className="w-4 h-4" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                01 ADAPTIVE ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every question adapts to your previous answer, detected weaknesses, and verified resume evidence.
            </p>
          </div>

          <div className="space-y-2 p-4 bg-white border border-slate-200 rounded">
            <div className="flex items-center space-x-2 text-blue-600">
              <Code2 className="w-4 h-4" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                02 ISOLATED DSA SANDBOX
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Multi-language execution (Python, JS, C++, Java) with strict timeouts, memory limits, and test runner.
            </p>
          </div>

          <div className="space-y-2 p-4 bg-white border border-slate-200 rounded">
            <div className="flex items-center space-x-2 text-blue-600">
              <LineChart className="w-4 h-4" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                03 REAL INTELLIGENCE
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              No hardcoded percentages. Every readiness score originates from rigorous rubric evaluations stored in PostgreSQL.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-8 py-6 text-center text-xs font-mono text-slate-500">
        INTERVIEWIQ 2.0 · PRODUCTION-GRADE AI INTERVIEW ASSESSMENT PLATFORM
      </footer>
    </div>
  );
};
