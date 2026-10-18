import React from 'react';
import { User } from '../types';
import { LogOut, Plus, Shield, UserCheck, HardDriveDownload } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'dispatch' | 'bookings' | 'fleet' | 'reports' | 'deploy' | 'users';

interface NavbarProps {
  user: User;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenNewBooking: () => void;
  onOpenBackup: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onTabChange,
  onOpenNewBooking,
  onOpenBackup,
  onLogout
}) => {
  const getRoleBadgeStyle = () => {
    switch (user.role) {
      case 'ADMINISTRATOR':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'DISPATCHER':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
      case 'BOOKING_AGENT':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
    }
  };

  const getRoleLabel = () => {
    switch (user.role) {
      case 'ADMINISTRATOR':
        return 'Administrator';
      case 'DISPATCHER':
        return 'Dispatcher';
      case 'BOOKING_AGENT':
        return 'Booking Agent';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b192c]/95 backdrop-blur-md border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Zone 1: Single text element wordmark with clean SVG badge */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:border-teal-400 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 17l4 4 4-4m-4-5v9m-7-3.5a9 9 0 1114 0" />
                </svg>
              </div>
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                Gulf Taxis <span className="text-teal-400 font-medium">Dispatch</span>
              </span>
            </button>
          </div>

          {/* Zone 2: 4-5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-teal-400 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onTabChange('dispatch')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'dispatch'
                  ? 'bg-slate-800 text-teal-400 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Dispatch Board
            </button>
            <button
              onClick={() => onTabChange('bookings')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'bookings'
                  ? 'bg-slate-800 text-teal-400 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Bookings
            </button>
            <button
              onClick={() => onTabChange('fleet')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'fleet'
                  ? 'bg-slate-800 text-teal-400 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Fleet & Drivers
            </button>
            <button
              onClick={() => onTabChange('reports')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'reports'
                  ? 'bg-slate-800 text-teal-400 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Reports
            </button>

            {user.role === 'ADMINISTRATOR' && (
              <button
                onClick={() => onTabChange('users')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  activeTab === 'users'
                    ? 'bg-slate-800 text-teal-400 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Team & Audit
              </button>
            )}

            <button
              onClick={() => onTabChange('deploy')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'deploy'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Hostinger Deploy
            </button>
          </nav>

          {/* Zone 3: Primary action + Profile & Quick Booking */}
          <div className="flex items-center gap-2.5 shrink-0">
            {user.role === 'ADMINISTRATOR' && (
              <button
                onClick={onOpenBackup}
                title="Database Backup & Export"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition"
              >
                <HardDriveDownload className="w-3.5 h-3.5 text-amber-400" />
                <span className="whitespace-nowrap">Backup</span>
              </button>
            )}

            <button
              onClick={onOpenNewBooking}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-sm shadow-teal-500/20 transition whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Booking</span>
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-white truncate max-w-[120px]">
                  {user.full_name}
                </div>
                <div className="text-[10px] text-teal-400 font-medium tracking-tight">
                  {getRoleLabel()}
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto text-xs">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-2.5 py-1 font-medium whitespace-nowrap ${
              activeTab === 'dashboard' ? 'text-teal-400' : 'text-slate-400'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onTabChange('dispatch')}
            className={`px-2.5 py-1 font-medium whitespace-nowrap ${
              activeTab === 'dispatch' ? 'text-teal-400' : 'text-slate-400'
            }`}
          >
            Dispatch
          </button>
          <button
            onClick={() => onTabChange('bookings')}
            className={`px-2.5 py-1 font-medium whitespace-nowrap ${
              activeTab === 'bookings' ? 'text-teal-400' : 'text-slate-400'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => onTabChange('fleet')}
            className={`px-2.5 py-1 font-medium whitespace-nowrap ${
              activeTab === 'fleet' ? 'text-teal-400' : 'text-slate-400'
            }`}
          >
            Fleet
          </button>
          <button
            onClick={() => onTabChange('reports')}
            className={`px-2.5 py-1 font-medium whitespace-nowrap ${
              activeTab === 'reports' ? 'text-teal-400' : 'text-slate-400'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => onTabChange('deploy')}
            className={`px-2.5 py-1 font-medium whitespace-nowrap ${
              activeTab === 'deploy' ? 'text-teal-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Deploy
          </button>
        </div>
      </div>
    </header>
  );
};
