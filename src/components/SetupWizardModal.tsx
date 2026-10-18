import React, { useState } from 'react';
import { mockDb } from '../services/mockDb';
import { X, CheckCircle, Database, Shield, Server, RefreshCw } from 'lucide-react';

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete?: () => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({
  isOpen,
  onClose,
  onSetupComplete
}) => {
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('3306');
  const [dbName, setDbName] = useState('gulftaxis_dispatch');
  const [dbUser, setDbUser] = useState('u123456789_admin');
  const [dbPass, setDbPass] = useState('••••••••••••');

  const [adminName, setAdminName] = useState('Director Tariq Al-Hashimi');
  const [adminUser, setAdminUser] = useState('admin');
  const [adminEmail, setAdminEmail] = useState('admin@gulftaxis.com');
  const [adminPass, setAdminPass] = useState('dispatch2026');

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRunSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      // Re-initialize mock DB with fresh seed data
      mockDb.initIfEmpty(true);
      setLoading(false);
      setStep('success');
      if (onSetupComplete) onSetupComplete();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#0d2137] border border-slate-700 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-sm">
              GT
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Hostinger Database Setup & Migration Wizard
              </h3>
              <p className="text-xs text-slate-400">
                Simulates production setup.php on Hostinger shared hosting
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 'success' ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">Database Successfully Initialized!</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Applied <code>001_initial_schema.sql</code> and <code>002_seed_data.sql</code>. All 8 vehicle types, active chauffeurs, and initial dispatch bookings are loaded into MySQL.
              </p>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs rounded-lg transition"
                >
                  Return to Login & Sign In
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRunSetup} className="space-y-4 text-xs">
              <div className="space-y-3">
                <h4 className="font-bold text-teal-400 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>1. Hostinger MySQL Database Parameters</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Database Host</label>
                    <input
                      type="text"
                      value={dbHost}
                      onChange={(e) => setDbHost(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Port</label>
                    <input
                      type="text"
                      value={dbPort}
                      onChange={(e) => setDbPort(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Database Name (from hPanel)</label>
                  <input
                    type="text"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Database Username</label>
                    <input
                      type="text"
                      value={dbUser}
                      onChange={(e) => setDbUser(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Database Password</label>
                    <input
                      type="password"
                      value={dbPass}
                      onChange={(e) => setDbPass(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-teal-400 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>2. Master Administrator Credentials</span>
                </h4>
                <div>
                  <label className="block text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Admin Username</label>
                    <input
                      type="text"
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Admin Email</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Admin Password</label>
                  <input
                    type="password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition flex items-center gap-1.5"
                >
                  {loading ? 'Initializing Database...' : 'Run Setup & Seed Database'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
