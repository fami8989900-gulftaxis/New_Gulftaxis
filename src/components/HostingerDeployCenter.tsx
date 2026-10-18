import React, { useState } from 'react';
import { generateHostingerZipPackage } from '../services/deploymentPackage';
import { 
  Download, CheckCircle, Copy, Terminal, 
  ExternalLink, HardDrive, GitBranch, Shield, 
  FileCode, Layers, Server, AlertCircle 
} from 'lucide-react';

export const HostingerDeployCenter: React.FC = () => {
  const [downloading, setDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleDownloadZip = async () => {
    setDownloading(true);
    setDownloadComplete(false);
    try {
      const blob = await generateHostingerZipPackage();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'gulf-taxis-dispatch-cloud-hostinger.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadComplete(true);
    } catch (e) {
      alert('Failed to generate ZIP package.');
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      num: 1,
      title: 'Initialize Private GitHub Repository',
      desc: 'Create a private GitHub repository named "gulf-taxis-dispatch-cloud" to manage version control and CI/CD pipelines.',
      code: `git init\ngit add .\ngit commit -m "feat: complete Gulf Taxis Dispatch Cloud for Hostinger"\ngit branch -M main\ngit remote add origin https://github.com/YOUR_USER/gulf-taxis-dispatch-cloud.git\ngit push -u origin main`
    },
    {
      num: 2,
      title: 'Compile Production Frontend with Vite',
      desc: 'Build the static production bundle locally or via GitHub Actions. Never run Node.js on the production Hostinger server.',
      code: `npm install\nnpm run build`
    },
    {
      num: 3,
      title: 'Create Hostinger Domain & Activate SSL',
      desc: 'In Hostinger hPanel -> Domains/Websites, add your domain. Under "Security" -> "SSL", activate Free Unlimited SSL (Let\'s Encrypt) and toggle "Force HTTPS".'
    },
    {
      num: 4,
      title: 'Create MySQL / MariaDB Database in hPanel',
      desc: 'In hPanel -> "Databases" -> "Management", create a new database (e.g. u123456789_dispatch) with a secure user (e.g. u123456789_admin) and password.'
    },
    {
      num: 5,
      title: 'Upload Files via Hostinger File Manager',
      desc: 'Upload the compiled frontend files (from dist/) into public_html, along with .htaccess and setup.php. Upload backend/ and database/ alongside public_html.'
    },
    {
      num: 6,
      title: 'Run One-Click Setup & Migration Wizard',
      desc: 'Open https://yourdispatchdomain.com/setup.php in your browser. Enter your database details and create your initial Master Administrator.'
    },
    {
      num: 7,
      title: 'Remove Setup Wizard & Verify Security',
      desc: 'Once setup is complete, delete setup.php from public_html via File Manager. The system is now 100% locked and ready for commercial transport operations.'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
            <Server className="w-3.5 h-3.5" />
            <span>Hostinger Shared Hosting & GitHub Deployment</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Production Deployment Center
          </h2>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={downloading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-400 hover:bg-teal-300 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition cursor-pointer shrink-0"
        >
          {downloading ? (
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>Download Ready-to-Upload Hostinger ZIP</span>
        </button>
      </div>

      {downloadComplete && (
        <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-300 text-xs flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Download Started!</strong> The ZIP file <code>gulf-taxis-dispatch-cloud-hostinger.zip</code> contains all static frontend assets, <code>.htaccess</code>, PHP 8.2+ REST API controllers, MySQL database migrations, and the <code>setup.php</code> wizard.
          </div>
        </div>
      )}

      {/* Two Deployment Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* OPTION A */}
        <div className="bg-[#0d2137]/90 border border-teal-500/40 rounded-xl p-5 space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/30">
              Option A · Recommended for Business Owners
            </span>
            <HardDrive className="w-4 h-4 text-teal-400" />
          </div>

          <h3 className="text-base font-bold text-white">Simple Hostinger ZIP Upload</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Zero terminal commands required on Hostinger. Build once or download our pre-compiled ZIP package, upload via Hostinger File Manager, and initialize with <code>setup.php</code>.
          </p>

          <ul className="text-xs text-slate-400 space-y-1.5 pt-1">
            <li className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
              <span>Complete production package in single ZIP file</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
              <span>Pre-configured Apache <code>.htaccess</code> router</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
              <span>Interactive one-click browser setup wizard</span>
            </li>
          </ul>

          <div className="pt-2">
            <button
              onClick={handleDownloadZip}
              className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition"
            >
              Download Complete Hostinger ZIP
            </button>
          </div>
        </div>

        {/* OPTION B */}
        <div className="bg-[#0d2137]/90 border border-slate-700/80 rounded-xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/30">
              Option B · For Developers & CI/CD
            </span>
            <GitBranch className="w-4 h-4 text-sky-400" />
          </div>

          <h3 className="text-base font-bold text-white">GitHub Actions Automated CI/CD</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Store code in your private GitHub repository. Our included <code>.github/workflows/deploy.yml</code> automatically compiles frontend assets on push and publishes artifact archives.
          </p>

          <ul className="text-xs text-slate-400 space-y-1.5 pt-1">
            <li className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Automated GitHub Actions compilation</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Zero server-side node dependencies</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Compatible with Hostinger Git deploy feature</span>
            </li>
          </ul>

          <div className="pt-2 text-xs text-slate-400 font-mono">
            Workflow: <code>.github/workflows/deploy.yml</code> (Included)
          </div>
        </div>
      </div>

      {/* 18-Point Acceptance & Verification Checklist */}
      <div className="bg-[#0d2137]/80 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-400" />
          <span>Mandatory System Architecture Guarantees</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 p-2 rounded bg-slate-900/60 border border-slate-800">
            <CheckCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Login Page opens FIRST on domain visit</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-slate-900/60 border border-slate-800">
            <CheckCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>NO Node.js production server (server.ts / server.js banned)</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-slate-900/60 border border-slate-800">
            <CheckCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Vehicle Type immediately follows Flight Number</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-slate-900/60 border border-slate-800">
            <CheckCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>All 8 vehicle types configured & capacity validated</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-slate-900/60 border border-slate-800">
            <CheckCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Chauffeur 2-hour schedule conflict prevention</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-slate-900/60 border border-slate-800">
            <CheckCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Optimistic concurrency locking prevents data overwrite</span>
          </div>
        </div>
      </div>

      {/* Step by Step Walkthrough */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">Step-by-Step Installation Guide</h3>

        <div className="space-y-3">
          {steps.map((st, i) => (
            <div key={i} className="bg-[#0d2137]/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-teal-500/40">
                  {st.num}
                </span>
                <h4 className="text-xs font-bold text-white">{st.title}</h4>
              </div>

              <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                {st.desc}
              </p>

              {st.code && (
                <div className="ml-8 mt-2 relative">
                  <pre className="bg-slate-950 p-3 rounded-lg text-[11px] font-mono text-teal-300 overflow-x-auto border border-slate-800">
                    {st.code}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(st.code || '', i)}
                    className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Copy to clipboard"
                  >
                    {copiedIndex === i ? (
                      <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
