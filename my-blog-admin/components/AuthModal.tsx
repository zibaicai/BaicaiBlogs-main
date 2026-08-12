"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

type TabMode = 'login' | 'register';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<TabMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const switchMode = (newMode: TabMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleSubmit = async () => {
    setError('');

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }
    if (username.trim().length < 3) {
      setError('用户名至少 3 个字符');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 个字符');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await apiClient.login({ username, password });
        if (res.success) {
          apiClient.setToken(res.data.token);
          resetForm();
          onLoginSuccess();
        } else {
          setError(res.message || '登录失败');
        }
      } else {
        const res = await apiClient.register({ username, password });
        if (res.success) {
          // 注册成功后自动登录
          const loginRes = await apiClient.login({ username, password });
          if (loginRes.success) {
            apiClient.setToken(loginRes.data.token);
            resetForm();
            onLoginSuccess();
          } else {
            setError('注册成功，但自动登录失败，请手动登录');
            setMode('login');
          }
        } else {
          setError(res.message || '注册失败');
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    window.location.href = `${apiBase}/oauth2/authorization/github`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* 遮罩层 */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* 弹窗主体 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white/10 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* 顶部装饰渐变 */}
            <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all z-10"
            >
              ✕
            </button>

            {/* Logo & 标题 */}
            <div className="px-8 pt-8 pb-4 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30">
                🌌
              </div>
              <h2 className="text-2xl font-black text-white">
                {mode === 'login' ? '欢迎回来' : '加入我们'}
              </h2>
              <p className="text-slate-400 text-sm mt-1">BaicaiBlogs CMS</p>
            </div>

            {/* Tab 切换栏 */}
            <div className="px-8 mb-6">
              <div className="relative flex bg-white/5 rounded-2xl p-1 border border-white/10">
                {/* 滑动指示器 */}
                <motion.div
                  layout
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="absolute top-1 bottom-1 w-1/2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg"
                  style={{
                    left: mode === 'login' ? '0.25rem' : 'calc(50% - 0.25rem)',
                  }}
                />
                <button
                  onClick={() => switchMode('login')}
                  className={`relative z-10 flex-1 py-2.5 text-sm font-bold transition-colors duration-300 ${
                    mode === 'login' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  登录
                </button>
                <button
                  onClick={() => switchMode('register')}
                  className={`relative z-10 flex-1 py-2.5 text-sm font-bold transition-colors duration-300 ${
                    mode === 'register' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  注册
                </button>
              </div>
            </div>

            {/* 表单内容 */}
            <div className="px-8 pb-8">
              {/* 用户名 */}
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-400 mb-1.5 block tracking-wider uppercase">用户名</label>
                <input
                  type="text"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                />
              </div>

              {/* 密码 */}
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-400 mb-1.5 block tracking-wider uppercase">密码</label>
                <input
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                />
              </div>

              {/* 确认密码 - 仅注册时显示 */}
              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="text-xs font-bold text-slate-400 mb-1.5 block tracking-wider uppercase">确认密码</label>
                    <input
                      type="password"
                      placeholder="请再次输入密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 错误提示 */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 提交按钮 */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 text-white font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>处理中...</span>
                  </>
                ) : (
                  <span>{mode === 'login' ? '登 录' : '注 册'}</span>
                )}
              </button>

              {/* 分割线 */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-slate-500 font-bold tracking-wider">OR</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* GitHub 授权登录 */}
              <button
                onClick={handleGitHubLogin}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub 授权登录
              </button>

              {/* 底部提示 */}
              <p className="text-slate-500 text-xs text-center mt-6">
                {mode === 'login' ? (
                  <>还没有账号？<button onClick={() => switchMode('register')} className="text-indigo-400 hover:text-indigo-300 font-bold">立即注册</button></>
                ) : (
                  <>已有账号？<button onClick={() => switchMode('login')} className="text-indigo-400 hover:text-indigo-300 font-bold">返回登录</button></>
                )}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
