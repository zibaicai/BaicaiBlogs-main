"use client";

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
// 🌟 引入你的图床工具组件 (请根据你实际的文件夹层级调整相对路径)
import FloatingImageTool from '../editor/FloatingImageTool';
import { api } from '../../lib/api';

export default function ProfileSection({ formData, handleUpdate, pushToQueue }: any) {
  // 🌟 终极防崩溃兜底
  const safeData = formData || {};
  const safeSocial = safeData.social || {};
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const uploadAvatar = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('请选择图片文件');
      return;
    }
    setAvatarUploading(true);
    setAvatarError('');
    try {
      const res = await api.uploadImage(file);
      handleUpdate('avatarUrl', res.data);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : '头像上传失败');
    } finally {
      setAvatarUploading(false);
    }
  };

  const requestSensitiveAccess = async () => {
    const reason = window.prompt('请输入申请原因（至少 10 个字）');
    if (!reason || reason.trim().length < 10) return;
    try {
      await api.requestSensitiveAccess('site_social', reason.trim());
      window.alert('申请已提交，等待超级管理员审批（1 小时有效）');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '申请失败');
    }
  };

  // 🌟 控制图床工具的状态
  const [isImageToolOpen, setIsImageToolOpen] = useState(false);
  const [targetImageField, setTargetImageField] = useState<'avatarUrl' | 'faviconUrl' | null>(null);

  // 打开图床工具，并记录是哪个输入框在请求图片
  const openImageTool = (field: 'avatarUrl' | 'faviconUrl') => {
    setTargetImageField(field);
    setIsImageToolOpen(true);
  };

  // 接收图床工具传回来的 URL，并更新对应的配置项
  const handleImageInsert = (url: string) => {
    if (targetImageField) {
      handleUpdate(targetImageField, url);
    }
    setIsImageToolOpen(false);
    setTargetImageField(null);
  };

  // 穿透更新嵌套的 social 对象
  const handleSocialUpdate = (platform: string, value: string) => {
    handleUpdate('social', {
      ...safeSocial,
      [platform]: value
    });
  };

  // 🌟🌟🌟 核心破局点：化繁为简！
  const handleSaveAll = () => {
    pushToQueue('全量更新个人名片');
  };

  return (
    <>
      <motion.section initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-2xl relative">
        <div className="flex flex-col md:flex-row gap-12 items-start">

          {/* 左侧：头像预览与唯一上传入口 */}
          <div className="relative group shrink-0 self-center md:self-start flex flex-col items-center gap-3">
            <motion.div
              whileHover={{ rotate: 0, scale: 1.03 }}
              className="relative w-40 h-40 rounded-[32px] p-1.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-2xl rotate-6 transition-all duration-500 cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label="更换头像"
              onClick={() => avatarInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  avatarInputRef.current?.click();
                }
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void uploadAvatar(event.dataTransfer.files?.[0]);
              }}
            >
              <img src={safeData.avatarUrl || ''} alt="Avatar" className="w-full h-full rounded-[26px] object-cover bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-800" />
              <span className="absolute inset-1.5 flex items-center justify-center rounded-[26px] bg-slate-950/55 text-[11px] font-black text-white opacity-0 transition-opacity group-hover:opacity-100">
                {avatarUploading ? '上传中…' : '更换头像'}
              </span>
            </motion.div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void uploadAvatar(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            <p className="text-[10px] font-bold text-slate-400">点击或拖拽更换头像</p>
            {avatarError && <p className="text-[10px] font-bold text-red-400">{avatarError}</p>}
          </div>

          {/* 右侧：表单配置区域 */}
          <div className="flex-1 w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* 🌟 导航栏三部曲配置区 */}
              <div className="col-span-1 md:col-span-2 bg-white/30 dark:bg-slate-800/30 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 grid grid-cols-3 gap-4 shadow-sm">
                <div className="col-span-3 pb-2 border-b border-slate-200 dark:border-slate-700/50 mb-2">
                  <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    🧭 导航栏显示配置
                  </h3>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">前缀 (navTitle)</label>
                  <input type="text" value={safeData.navTitle || ''} onChange={e => handleUpdate('navTitle', e.target.value)} placeholder="例如: YeLuo" className="w-full bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">连接符 (navSuffix)</label>
                  <input type="text" value={safeData.navSuffix || ''} onChange={e => handleUpdate('navSuffix', e.target.value)} placeholder="例如: の" className="w-full bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-indigo-500 font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">尾部 (navAfter)</label>
                  <input type="text" value={safeData.navAfter || ''} onChange={e => handleUpdate('navAfter', e.target.value)} placeholder="例如: 云端小屋" className="w-full bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold" />
                </div>
              </div>

              {/* 网站总标题 Title */}
              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">网站总标题 (Browser Title)</label>
                <input type="text" value={safeData.title || ''} onChange={e => handleUpdate('title', e.target.value)} placeholder="例如: YeLuo / 云端小屋" className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none font-bold focus:ring-2 focus:ring-indigo-500" />
              </div>

              {/* 网页图标 Favicon */}
              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex justify-between">
                  <span>网页标签小图标 (Favicon)</span>
                  {safeData.faviconUrl && <img src={safeData.faviconUrl} alt="favicon" className="w-4 h-4 rounded-full object-cover" />}
                </label>
                <div className="flex gap-2 mt-1">
                  <input type="text" value={safeData.faviconUrl || ''} onChange={e => handleUpdate('faviconUrl', e.target.value)} className="flex-1 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={() => openImageTool('faviconUrl')} className="px-4 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/40 text-indigo-600 dark:text-indigo-300 rounded-2xl font-black text-xs transition-colors whitespace-nowrap flex items-center gap-1 shadow-sm">
                    ☁️ 图床
                  </button>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">作者名称</label>
                <input type="text" value={safeData.authorName || ''} onChange={e => handleUpdate('authorName', e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none font-bold focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">个人简介 (BIO)</label>
                <textarea rows={2} value={safeData.bio || ''} onChange={e => handleUpdate('bio', e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none resize-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              {/* 社交媒体区域 */}
              <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                {safeData.__restricted?.length > 0 && (
                  <div className="col-span-1 md:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-300">
                      邮箱、QQ、微信、Google 属于敏感信息，仅超级管理员可查看。
                    </span>
                    <button type="button" onClick={() => void requestSensitiveAccess()} className="rounded-xl bg-amber-500/15 px-3 py-2 text-[10px] font-black text-amber-600 hover:bg-amber-500/25 dark:text-amber-300">
                      申请查看
                    </button>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">邮箱 Email</label>
                  <input type="text" value={safeSocial.email || ''} onChange={e => handleSocialUpdate('email', e.target.value)} disabled={Boolean(safeData.__restricted?.length)} className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none disabled:opacity-50" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Google 邮箱/链接</label>
                  <input type="text" value={safeSocial.google || ''} onChange={e => handleSocialUpdate('google', e.target.value)} disabled={Boolean(safeData.__restricted?.length)} className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none disabled:opacity-50" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">微信 ID</label>
                  <input type="text" value={safeSocial.wechat || ''} onChange={e => handleSocialUpdate('wechat', e.target.value)} disabled={Boolean(safeData.__restricted?.length)} className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none disabled:opacity-50" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">QQ 号码</label>
                  <input type="text" value={safeSocial.qq || ''} onChange={e => handleSocialUpdate('qq', e.target.value)} disabled={Boolean(safeData.__restricted?.length)} className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none disabled:opacity-50" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">GitHub 地址</label>
                  <input type="text" value={safeSocial.github || ''} onChange={e => handleSocialUpdate('github', e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Gitee 地址</label>
                  <input type="text" value={safeSocial.gitee || ''} onChange={e => handleSocialUpdate('gitee', e.target.value)} className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none" />
                </div>
              </div>

              {/* 👇 🌟 新增：系统功能开关区域 */}
              <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block">⚙️ 系统功能开关</label>

                <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">RPG 等级展示系统 (Level System)</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">开启后将在“创意工坊”与“帝江号”显示全图鉴成就徽章与经验值档案板</span>
                  </div>

                  {/* 滑动开关 Toggle */}
                  <button
                    onClick={() => handleUpdate('enableLevelSystem', !safeData.enableLevelSystem)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${safeData.enableLevelSystem ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className="sr-only">Toggle Level System</span>
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${safeData.enableLevelSystem ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* 👇 友链申请模板配置区域 */}
              <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">友链申请模板 (friendLinkApplyFormat)</label>
                <textarea
                  rows={4}
                  value={safeData.friendLinkApplyFormat || ''}
                  onChange={e => handleUpdate('friendLinkApplyFormat', e.target.value)}
                  placeholder="名称：YeLuo / 云端小屋\n简介：写代码，也拍照片。\n链接：https://www.zibaicai.cn\n头像：..."
                  className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm mt-1 outline-none resize-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

            </div>

            <button onClick={handleSaveAll} className="px-10 py-3 bg-indigo-500 text-white rounded-2xl text-sm font-black shadow-xl hover:bg-indigo-600 transition-all active:scale-95 w-full md:w-auto">
              暂存修改至操作队列
            </button>
          </div>
        </div>
      </motion.section>

      {/* 🌟 挂载全局图床工具 */}
      <FloatingImageTool
        isOpen={isImageToolOpen}
        onClose={() => setIsImageToolOpen(false)}
        onInsert={handleImageInsert}
      />
    </>
  );
}