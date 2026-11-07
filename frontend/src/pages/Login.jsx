import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Smartphone, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/20 mb-3">
            <Smartphone className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Mobile Manufacturing System
          </h2>
          <p className="text-xs text-brand-400 font-semibold tracking-wide uppercase mt-1">
            Oracle 21c XE DBMS Project • MCA, Manipal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin, manager, viewer"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 text-sm transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Viva / Quick Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-slate-700/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Quick Demo Logins (Viva 1-Click)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillQuickLogin('admin', 'admin123')}
              className="px-2 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-left border border-slate-600/50 transition-colors"
            >
              <div className="text-xs font-bold text-purple-300">ADMIN</div>
              <div className="text-[10px] text-slate-400 truncate">admin123</div>
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin('manager', 'manager123')}
              className="px-2 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-left border border-slate-600/50 transition-colors"
            >
              <div className="text-xs font-bold text-blue-300">MANAGER</div>
              <div className="text-[10px] text-slate-400 truncate">manager123</div>
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin('viewer', 'viewer123')}
              className="px-2 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-left border border-slate-600/50 transition-colors"
            >
              <div className="text-xs font-bold text-slate-300">VIEWER</div>
              <div className="text-[10px] text-slate-400 truncate">viewer123</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

