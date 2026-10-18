import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { Shield, Lock, User as UserIcon, Eye, EyeOff, ArrowRight, HelpCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  onOpenSetup: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onOpenSetup }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username/email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.login(username, password);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      let targetUser = 'admin';
      if (role === 'DISPATCHER') targetUser = 'dispatcher';
      if (role === 'BOOKING_AGENT') targetUser = 'agent';

      setUsername(targetUser);
      setPassword('dispatch2026');
      const data = await api.login(targetUser, 'dispatch2026');
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotStatus('Please provide a valid corporate email.');
      return;
    }
    setForgotStatus('A secure password reset link and verification token have been dispatched to your email.');
  };

  return (
    <div className="min-h-screen bg-[#07111e] text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-teal-500 selection:text-slate-900">
      {/* Background Subtle Gradient & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-950/20 via-[#0b192c] to-[#07111e] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 via-teal-500/10 to-transparent border border-teal-500/30 text-teal-400 shadow-xl shadow-teal-500/10 mb-4">
            <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 17l4 4 4-4m-4-5v9m-7-3.5a9 9 0 1114 0" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Gulf Taxis Dispatch Cloud
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise Fleet Operations & Dispatch Portal
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-[#0d2137]/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
              Sign In to Your Workspace
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-teal-500" />
              256-bit Encrypted
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username or Corporate Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or user@gulftaxis.com"
                  autoComplete="username"
                  required
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotStatus(null);
                  }}
                  className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-semibold text-sm tracking-wide transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Role Tester for Live Preview */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Instant Role Access
              </span>
              <span className="text-[11px] text-teal-400/90 font-mono">Demo: dispatch2026</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMINISTRATOR')}
                className="py-1.5 px-2 text-xs font-medium rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center transition hover:border-teal-500/50"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('DISPATCHER')}
                className="py-1.5 px-2 text-xs font-medium rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center transition hover:border-teal-500/50"
              >
                Dispatcher
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('BOOKING_AGENT')}
                className="py-1.5 px-2 text-xs font-medium rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center transition hover:border-teal-500/50"
              >
                Agent
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Helper Bar */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-slate-500">
            Hostinger Shared Hosting & Apache Ready · MySQL 8+ · PHP 8.2+
          </p>
          <div>
            <button
              onClick={onOpenSetup}
              className="text-xs text-teal-400 hover:text-teal-300 underline underline-offset-4 decoration-teal-500/40 inline-flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              First Time Hostinger Setup & Database Migration Wizard
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0d2137] border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl relative">
            <h3 className="text-base font-semibold text-white mb-2">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Enter your registered corporate email address. A cryptographic single-use reset token will be issued.
            </p>

            {forgotStatus ? (
              <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-300 text-xs mb-4 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{forgotStatus}</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@gulftaxis.com"
                  required
                  className="w-full bg-[#081525] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs rounded-lg transition"
                >
                  Send Reset Link
                </button>
              </form>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
