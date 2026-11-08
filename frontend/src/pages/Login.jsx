import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Smartphone,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Shield
} from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(username, password);
      toast.success(`Welcome back, ${user.full_name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-brand-600/25 via-indigo-600/20 to-purple-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415515_1px,transparent_1px),linear-gradient(to_bottom,#33415515_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Floating Telemetry Chip */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs font-semibold text-slate-300 backdrop-blur-md mb-6 shadow-sm relative z-10">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Enterprise MES Platform • Online</span>
      </div>

      {/* Main Glassmorphic Login Card */}
      <div className="max-w-md w-full bg-slate-900/85 border border-slate-700/70 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-2xl relative z-10 transition-all">
        {/* Card Header with Glowing Icon */}
        <div className="text-center mb-7">
          <div className="relative inline-block mb-3.5">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-indigo-600 rounded-2xl blur-md opacity-60 animate-pulse" />
            <div className="relative p-3.5 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 text-white shadow-xl flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-brand-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Mobile Manufacturing System
          </h1>
          <p className="text-xs text-brand-400 font-bold tracking-wider uppercase mt-1.5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enterprise Production & Supply Chain Suite</span>
          </p>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative group">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-400 transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin, manager, viewer"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative group">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-400 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-brand-600 via-indigo-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials Panel */}
        <div className="mt-7 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2.5">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Quick Demo Logins (1-Click Fill)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Instant Access</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillQuickLogin('admin', 'admin123')}
              className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-purple-500/50 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-purple-400 group-hover:text-purple-300">ADMIN</span>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">admin123</div>
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin('manager', 'manager123')}
              className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-blue-500/50 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-blue-400 group-hover:text-blue-300">MANAGER</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">manager123</div>
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin('viewer', 'viewer123')}
              className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-emerald-500/50 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-emerald-400 group-hover:text-emerald-300">VIEWER</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">viewer123</div>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Enterprise Footer */}
      <div className="text-center mt-6 text-[11px] text-slate-500 font-medium relative z-10 flex items-center justify-center gap-2">
        <Shield className="w-3.5 h-3.5 text-slate-400" />
        <span>ApexMES Enterprise Platform</span>
        <span>•</span>
        <span>Secure 256-Bit SSL Encrypted</span>
      </div>
    </div>
  );
};

export default Login;
