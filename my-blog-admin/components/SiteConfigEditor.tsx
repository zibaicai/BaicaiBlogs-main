"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './ToastProvider';
import { apiClient } from '../lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

const TABS = [
  { id: 'basic', label: '基础信息', icon: '📋' },
  { id: 'social', label: '社交链接', icon: '🔗' },
  { id: 'background', label: '背景设置', icon: '🎨' },
  { id: 'danmaku', label: '弹幕设置', icon: '💬' },
  { id: 'ai', label: 'AI配置', icon: '🤖' },
  { id: 'misc', label: '杂项配置', icon: '⚙️' },
  { id: 'footer', label: '页脚/备案', icon: '📄' },
];

// ============ 通用表单控件 ============

function TextField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
    </div>
  );
}

function TextAreaField({ label, value, onChange, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">{label}</label>
      <textarea rows={rows} value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all" />
    </div>
  );
}

function ToggleField({ label, description, value, onChange }: {
  label: string; description?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
      <div className="flex flex-col">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
        {description && <span className="text-[10px] text-slate-400 mt-0.5">{description}</span>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${value ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function ArrayField({ label, value, onChange }: {
  label: string; value: string[]; onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">{label}（每行一个）</label>
      <textarea rows={4} value={(value || []).join('\n')} onChange={e => onChange(e.target.value.split('\n').filter(Boolean))}
        className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono transition-all" />
    </div>
  );
}

function JsonField({ label, value, onChange }: {
  label: string; value: any; onChange: (v: any) => void;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try { setText(JSON.stringify(value, null, 2)); } catch { setText(''); }
  }, [value]);

  const handleChange = (v: string) => {
    setText(v);
    try {
      const parsed = JSON.parse(v);
      setError('');
      onChange(parsed);
    } catch (e) {
      setError('JSON 格式错误');
    }
  };

  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">{label}</label>
      <textarea rows={6} value={text} onChange={e => handleChange(e.target.value)}
        className={`w-full bg-white/50 dark:bg-slate-800/50 border rounded-xl px-4 py-2.5 text-xs mt-1 outline-none focus:ring-2 resize-y font-mono transition-all ${error ? 'border-red-400 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'}`} />
      {error && <p className="text-[10px] text-red-500 mt-1 ml-1">{error}</p>}
    </div>
  );
}

// ============ 主组件 ============

export default function SiteConfigEditor({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { showToast } = useToast();

  const fetchAllConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const responses = await Promise.all([
        fetch(`${API_BASE_URL}/api/public/config/group/site-info`),
        fetch(`${API_BASE_URL}/api/public/config/group/background`),
        fetch(`${API_BASE_URL}/api/public/config/group/danmaku`),
        fetch(`${API_BASE_URL}/api/public/config/group/ai`),
        fetch(`${API_BASE_URL}/api/public/config/group/misc`),
      ]);
      const jsons = await Promise.all(responses.map(r => r.ok ? r.json() : { data: null }));
      setFormData({
        siteInfo: jsons[0].data || {},
        background: jsons[1].data || {},
        danmakuList: jsons[2].data || [],
        aiConfig: jsons[3].data || {},
        misc: jsons[4].data || {},
      });
    } catch {
      showToast('加载配置失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { if (isOpen) fetchAllConfigs(); }, [isOpen, fetchAllConfigs]);

  const updateSiteInfo = (field: string, value: any) =>
    setFormData(prev => ({ ...prev, siteInfo: { ...prev.siteInfo, [field]: value } }));
  const updateBackground = (field: string, value: any) =>
    setFormData(prev => ({ ...prev, background: { ...prev.background, [field]: value } }));
  const updateAiConfig = (field: string, value: any) =>
    setFormData(prev => ({ ...prev, aiConfig: { ...prev.aiConfig, [field]: value } }));
  const updateMisc = (field: string, value: any) =>
    setFormData(prev => ({ ...prev, misc: { ...prev.misc, [field]: value } }));
  const updateSocial = (platform: string, value: string) =>
    setFormData(prev => ({ ...prev, siteInfo: { ...prev.siteInfo, social: { ...(prev.siteInfo?.social || {}), [platform]: value } } }));
  const updateIcp = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, siteInfo: { ...prev.siteInfo, icpConfig: { ...(prev.siteInfo?.icpConfig || {}), [field]: value } } }));
  const updateGitalk = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, misc: { ...prev.misc, gitalkConfig: { ...(prev.misc?.gitalkConfig || {}), [field]: value } } }));

  const handleSave = async () => {
    // 检查登录状态
    if (!apiClient.getToken()) {
      // 尝试从 localStorage 重新读取
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        apiClient.setToken(token);
      } else {
        showToast('请先登录后再保存配置', 'warning');
        return;
      }
    }

    setSaving(true);
    try {
      const updates = [
        { key: 'site_info', value: JSON.stringify(formData.siteInfo), desc: '站点基本信息配置' },
        { key: 'background', value: JSON.stringify(formData.background), desc: '背景与主题配置' },
        { key: 'danmaku_list', value: JSON.stringify(formData.danmakuList), desc: '首页弹幕列表' },
        { key: 'ai_config', value: JSON.stringify(formData.aiConfig), desc: 'AI 助手配置' },
        { key: 'misc', value: JSON.stringify(formData.misc), desc: '杂项配置' },
      ];
      for (const u of updates) {
        await apiClient.updateConfig(u.key, { configKey: u.key, configValue: u.value, description: u.desc });
      }
      showToast('全部配置保存成功！', 'success');
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : '未知错误';
      if (msg.includes('403') || msg.includes('401')) {
        showToast('登录已过期，请重新登录', 'error');
      } else {
        showToast('保存失败：' + msg, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const si = formData.siteInfo || {};
  const bg = formData.background || {};
  const ai = formData.aiConfig || {};
  const misc = formData.misc || {};
  const social = si.social || {};
  const icp = si.icpConfig || {};
  const gitalk = misc.gitalkConfig || {};
  const danmakuList = formData.danmakuList || [];

  return (
    <AnimatePresence>
      {isOpen && (
        // 改为顶部弹窗，距离顶部5vh
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          {/* 遮罩层 */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* 弹窗主体 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-2xl overflow-hidden"
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50 shrink-0">
              <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                ⚙️ 站点配置编辑器
              </h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-700/50 hover:bg-red-500/20 dark:hover:bg-red-500/20 text-slate-500 hover:text-red-500 transition-colors">
                ✕
              </button>
            </div>

            {/* Tab 栏 */}
            <div className="flex gap-1 px-4 py-2 border-b border-slate-200/50 dark:border-slate-700/50 overflow-x-auto shrink-0">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">

                    {/* ===== 基础信息 ===== */}
                    {activeTab === 'basic' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <TextField label="网站标题 (title)" value={si.title} onChange={v => updateSiteInfo('title', v)} />
                          <TextField label="作者名称 (authorName)" value={si.authorName} onChange={v => updateSiteInfo('authorName', v)} />
                        </div>
                        <TextAreaField label="个人简介 (bio)" value={si.bio} onChange={v => updateSiteInfo('bio', v)} rows={2} />
                        <div className="grid grid-cols-3 gap-4">
                          <TextField label="导航前缀 (navTitle)" value={si.navTitle} onChange={v => updateSiteInfo('navTitle', v)} />
                          <TextField label="连接符 (navSuffix)" value={si.navSuffix} onChange={v => updateSiteInfo('navSuffix', v)} />
                          <TextField label="导航尾部 (navAfter)" value={si.navAfter} onChange={v => updateSiteInfo('navAfter', v)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <TextField label="头像 URL (avatarUrl)" value={si.avatarUrl} onChange={v => updateSiteInfo('avatarUrl', v)} />
                          <TextField label="Favicon URL" value={si.faviconUrl} onChange={v => updateSiteInfo('faviconUrl', v)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <TextField label="建站日期 (buildDate)" value={si.buildDate} onChange={v => updateSiteInfo('buildDate', v)} />
                          <TextField label="默认文章封面 (defaultPostCover)" value={bg.defaultPostCover} onChange={v => updateBackground('defaultPostCover', v)} />
                        </div>
                        <ToggleField label="RPG 等级系统" description="开启后在创意工坊与帝江号显示全图鉴成就徽章" value={si.enableLevelSystem} onChange={v => updateSiteInfo('enableLevelSystem', v)} />
                      </>
                    )}

                    {/* ===== 社交链接 ===== */}
                    {activeTab === 'social' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField label="GitHub" value={social.github} onChange={v => updateSocial('github', v)} />
                        <TextField label="Gitee" value={social.gitee} onChange={v => updateSocial('gitee', v)} />
                        <TextField label="Google 邮箱/链接" value={social.google} onChange={v => updateSocial('google', v)} />
                        <TextField label="邮箱 Email" value={social.email} onChange={v => updateSocial('email', v)} />
                        <TextField label="QQ 号码" value={social.qq} onChange={v => updateSocial('qq', v)} />
                        <TextField label="微信 ID" value={social.wechat} onChange={v => updateSocial('wechat', v)} />
                      </div>
                    )}

                    {/* ===== 背景设置 ===== */}
                    {activeTab === 'background' && (
                      <>
                        <ToggleField label="使用渐变背景" description="开启后使用纯色渐变，关闭则使用图片背景轮播" value={bg.useGradient} onChange={v => updateBackground('useGradient', v)} />
                        <ArrayField label="主题颜色 (themeColors)" value={bg.themeColors} onChange={v => updateBackground('themeColors', v)} />
                        <ArrayField label="背景图片 (bgImages)" value={bg.bgImages} onChange={v => updateBackground('bgImages', v)} />
                      </>
                    )}

                    {/* ===== 弹幕设置 ===== */}
                    {activeTab === 'danmaku' && (
                      <ArrayField label="弹幕列表 (danmakuList)" value={danmakuList} onChange={v => setFormData(prev => ({ ...prev, danmakuList: v }))} />
                    )}

                    {/* ===== AI 配置 ===== */}
                    {activeTab === 'ai' && (
                      <>
                        <TextField label="模型 ID (modelId)" value={ai.modelId} onChange={v => updateAiConfig('modelId', v)} />
                        <TextAreaField label="系统提示词 (systemPrompt)" value={ai.systemPrompt} onChange={v => updateAiConfig('systemPrompt', v)} rows={8} />
                        <div className="grid grid-cols-2 gap-4">
                          <TextField label="最大输出 Tokens" type="number" value={String(ai.maxOutputTokens ?? '')} onChange={v => updateAiConfig('maxOutputTokens', parseInt(v) || 0)} />
                          <TextField label="温度 (temperature)" type="number" value={String(ai.temperature ?? '')} onChange={v => updateAiConfig('temperature', parseFloat(v) || 0)} />
                        </div>
                      </>
                    )}

                    {/* ===== 杂项配置 ===== */}
                    {activeTab === 'misc' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <TextField label="杂谈标题 (chatterTitle)" value={misc.chatterTitle} onChange={v => updateMisc('chatterTitle', v)} />
                          <TextField label="照片墙预览图 (photoWallImage)" value={misc.photoWallImage} onChange={v => updateMisc('photoWallImage', v)} />
                        </div>
                        <TextAreaField label="杂谈描述 (chatterDescription)" value={misc.chatterDescription} onChange={v => updateMisc('chatterDescription', v)} rows={2} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <TextField label="图床名称 (picBedName)" value={misc.picBedName} onChange={v => updateMisc('picBedName', v)} />
                          <TextField label="照片数量 (counts.photos)" type="number" value={String(misc.counts?.photos ?? '')} onChange={v => updateMisc('counts', { ...(misc.counts || {}), photos: parseInt(v) || 0 })} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <TextField label="图床 URL (picBedUrl)" value={misc.picBedUrl} onChange={v => updateMisc('picBedUrl', v)} />
                          <TextField label="图床 Token (picBedToken)" value={misc.picBedToken} onChange={v => updateMisc('picBedToken', v)} />
                        </div>
                        <ArrayField label="网易云音乐 ID (cloudMusicIds)" value={misc.cloudMusicIds} onChange={v => updateMisc('cloudMusicIds', v)} />
                        <TextAreaField label="友链申请模板 (friendLinkApplyFormat)" value={misc.friendLinkApplyFormat} onChange={v => updateMisc('friendLinkApplyFormat', v)} rows={4} />
                        <JsonField label="Gitalk 配置 (gitalkConfig)" value={gitalk} onChange={v => updateMisc('gitalkConfig', v)} />
                        <JsonField label="页脚徽章 (footerBadges)" value={misc.footerBadges} onChange={v => updateMisc('footerBadges', v)} />
                      </>
                    )}

                    {/* ===== 页脚/备案 ===== */}
                    {activeTab === 'footer' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <TextField label="备案名称 (icpConfig.name)" value={icp.name} onChange={v => updateIcp('name', v)} />
                          <TextField label="备案链接 (icpConfig.link)" value={icp.link} onChange={v => updateIcp('link', v)} />
                        </div>
                        <JsonField label="Gitalk 配置" value={misc.gitalkConfig} onChange={v => updateMisc('gitalkConfig', v)} />
                        <JsonField label="页脚徽章 (footerBadges)" value={misc.footerBadges} onChange={v => updateMisc('footerBadges', v)} />
                      </>
                    )}

                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* 底部操作栏 */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200/50 dark:border-slate-700/50 shrink-0">
              <span className="text-xs text-slate-400">修改后将覆盖数据库中的全部配置组</span>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-600/50 transition-colors">
                  取消
                </button>
                <button onClick={handleSave} disabled={saving || loading}
                  className="px-6 py-2.5 rounded-xl text-sm font-black bg-indigo-500 text-white shadow-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2">
                  {saving ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> 保存中...</>
                  ) : '💾 保存全部配置'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
