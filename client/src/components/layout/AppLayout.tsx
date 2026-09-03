import React, { useEffect, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Mic,
  Code2,
  FolderGit2,
  Cpu,
  FileText,
  Compass,
  User,
  Settings,
  Activity,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { checkHealth } from '../../api/client';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'checking'>('checking');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Read local user
    const stored = localStorage.getItem('interviewiq_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        // ignore
      }
    }

    // Health telemetry check
    checkHealth()
      .then((res) => {
        setHealthStatus(res.status === 'healthy' ? 'healthy' : 'degraded');
      })
      .catch(() => {
        setHealthStatus('degraded');
      });
  }, []);

  const navItems = [
    { label: '01 DASHBOARD', path: '/dashboard', icon: LayoutDashboard },
    { label: '02 INTERVIEWS', path: '/interviews', icon: Mic },
    { label: '03 PRACTICE', path: '/practice', icon: Code2 },
    { label: '04 PROJECTS', path: '/projects', icon: FolderGit2 },
    { label: '05 SKILLS', path: '/skills', icon: Cpu },
    { label: '06 REPORTS', path: '/reports', icon: FileText },
    { label: '07 PREPARATION', path: '/preparation', icon: Compass },
    { label: '08 PROFILE', path: '/profile', icon: User },
    { label: '09 SETTINGS', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('interviewiq_token');
    localStorage.removeItem('interviewiq_user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex bg-[#fafafa]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between fixed inset-y-0 left-0 z-30">
        <div>
          {/* Brand */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <span className="font-mono font-bold text-sm tracking-tight text-slate-900">
                INTERVIEW<span className="text-blue-600">IQ</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                2.0
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-4 space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded text-xs font-mono transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-blue-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Status */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {/* Health indicator */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
            <span className="flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>CORE API</span>
            </span>
            <span className="flex items-center space-x-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  healthStatus === 'healthy' ? 'bg-emerald-500' : healthStatus === 'checking' ? 'bg-amber-400' : 'bg-rose-500'
                }`}
              />
              <span className="uppercase text-[10px] font-semibold">{healthStatus}</span>
            </span>
          </div>

          {/* Credits indicator */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 px-1">
            <span className="flex items-center space-x-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>CREDITS</span>
            </span>
            <span className="font-semibold text-slate-900">
              {user?.creditBalance ?? 100} CR
            </span>
          </div>

          {/* User & Logout */}
          {user && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="truncate text-xs">
                <div className="font-medium text-slate-900 truncate">{user.name}</div>
                <div className="text-[11px] text-slate-500 truncate font-mono">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-64 flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between px-8">
          <div className="flex items-center space-x-4">
            <span className="font-mono text-xs text-slate-400 uppercase">
              STATUS: PRODUCTION-GRADE
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/interviews/new"
              className="text-xs font-mono font-medium px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              + NEW INTERVIEW
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
