"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteConfigContext } from '../../context/SiteConfigProvider';
import { apiClient, type Post, type Chatter, type Project, type Friend, type Album } from '../../lib/api';
import AuthModal from '../../components/AuthModal';
import SiteConfigEditor from '../../components/SiteConfigEditor';

export default function AdminDashboard() {
  const { siteInfo } = useSiteConfigContext();
  // 当前选中的功能模块
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConfigEditorOpen, setIsConfigEditorOpen] = useState(false);

  // 操作队列（模拟你说的：上传照片、保存文章算一次操作）
  // 这里先放两条假数据看看效果，后面我们会通过全局状态或 Context 来动态管理
  const [operations, setOperations] = useState([
    { id: 1, text: '系统已初始化，等待操作', time: '--:--' },
  ]);

  // 控制操作箱的展开与折叠
  const [isOpBoxOpen, setIsOpBoxOpen] = useState(false);

  // 数据状态
  const [posts, setPosts] = useState<Post[]>([]);
  const [chatters, setChatters] = useState<Chatter[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);

  // 登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasToken = !!apiClient.getToken();
    setIsLoggedIn(hasToken);
    if (!hasToken) {
      setIsAuthModalOpen(true);
    }
  }, []);

  const addOperation = (text: string) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setOperations(prev => [{ id: Date.now(), text, time }, ...prev].slice(0, 20));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [postsRes, chattersRes, projectsRes, friendsRes, albumsRes] = await Promise.all([
        apiClient.getAllPosts(),
        apiClient.getAllChatters(),
        apiClient.getAllProjects(),
        apiClient.getAllFriends(),
        apiClient.getAllAlbums(),
      ]);

      if (postsRes.success) setPosts(postsRes.data);
      if (chattersRes.success) setChatters(chattersRes.data);
      if (projectsRes.success) setProjects(projectsRes.data);
      if (friendsRes.success) setFriends(friendsRes.data);
      if (albumsRes.success) setAlbums(albumsRes.data);
    } catch (e) {
      addOperation(`数据加载失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setIsAuthModalOpen(false);
    addOperation('登录成功');
  };

  const handleLogout = () => {
    apiClient.clearToken();
    setIsLoggedIn(false);
    setIsAuthModalOpen(true);
  };

  const menuItems = [
    { id: 'dashboard', name: '全息仪表盘', icon: '🌌' },
    { id: 'posts', name: '文章与草稿', icon: '📝' },
    { id: 'gallery', name: '光影画廊', icon: '🖼️' },
    { id: 'settings', name: '系统核心配置', icon: '⚙️' },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-4">
        {/* 居中提示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-5xl shadow-2xl shadow-indigo-500/30"
          >
            🌌
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-2">BaicaiBlogs CMS</h1>
          <p className="text-slate-400 text-sm">请先登录以访问管理后台</p>
        </motion.div>

        {/* 登录/注册弹窗 - 仅在客户端挂载后显示，避免 SSR 水合不匹配 */}
        {mounted && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => {}}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 md:px-10 flex flex-col md:flex-row gap-6 max-w-[1600px] mx-auto relative z-10">

      {/* ==========================================
          1. 左侧中枢导航栏
          ========================================== */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-64 shrink-0 flex flex-col gap-6"
      >
        {/* 个人名片区 */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 flex flex-col items-center shadow-lg">
          <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <img src={siteInfo?.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-800" />
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-wider">{siteInfo?.authorName}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold tracking-[0.2em] uppercase">CMS Administrator</p>
          <button
            onClick={handleLogout}
            className="mt-4 text-xs text-red-400 hover:text-red-600 font-bold transition-colors"
          >
            退出登录
          </button>
        </div>

        {/* 导航菜单区 */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-4 shadow-lg flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm
                ${activeTab === item.id 
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30 translate-x-2' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:translate-x-1'}
              `}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </div>

        {/* 数据统计卡片 */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-4 shadow-lg">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">数据概览</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-indigo-500/20 rounded-xl p-3">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{posts.length}</div>
              <div className="text-xs text-slate-500">文章</div>
            </div>
            <div className="bg-purple-500/20 rounded-xl p-3">
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{chatters.length}</div>
              <div className="text-xs text-slate-500">杂谈</div>
            </div>
            <div className="bg-green-500/20 rounded-xl p-3">
              <div className="text-2xl font-black text-green-600 dark:text-green-400">{projects.length}</div>
              <div className="text-xs text-slate-500">项目</div>
            </div>
            <div className="bg-pink-500/20 rounded-xl p-3">
              <div className="text-2xl font-black text-pink-600 dark:text-pink-400">{friends.length}</div>
              <div className="text-xs text-slate-500">友链</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ==========================================
          2. 右侧工作区
          ========================================== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col gap-6"
      >
        {/* 顶部操作面板 (包含红点消息和部署按钮) */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl h-20 px-6 flex items-center justify-between shadow-lg relative">

          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            {menuItems.find(m => m.id === activeTab)?.name}
          </h1>

          <div className="flex items-center gap-4">
            {/* 操作箱图标与红点 */}
            <div className="relative">
              <button
                onClick={() => setIsOpBoxOpen(!isOpBoxOpen)}
                className="w-12 h-12 rounded-xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-center text-xl hover:bg-white dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
              >
                📥
              </button>
              {operations.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 border-2 border-white dark:border-slate-900 text-[10px] font-black text-white items-center justify-center">
                    {operations.length}
                  </span>
                </span>
              )}

              {/* 操作箱下拉列表 */}
              <AnimatePresence>
                {isOpBoxOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-16 w-80 bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 z-50"
                  >
                    <h3 className="text-sm font-black text-slate-800 dark:text-white mb-3 flex justify-between items-center">
                      待同步操作列表
                      <span className="text-xs text-slate-400 font-normal hover:text-indigo-500 cursor-pointer">清空</span>
                    </h3>

                    {operations.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">暂无待处理操作</p>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                        {operations.map(op => (
                          <div key={op.id} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center group">
                            <span className="text-sm text-slate-700 dark:text-slate-200 truncate pr-2">{op.text}</span>
                            <button className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 一键部署按钮 */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all active:scale-95"
            >
              {loading ? '加载中...' : '🔄 刷新数据'}
            </button>
          </div>
        </div>

        {/* 核心内容渲染区 (根据 Tab 动态切换) */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 min-h-[500px] shadow-lg">

          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">系统仪表盘</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="📝" title="文章" value={posts.length} color="indigo" />
                <StatCard icon="💭" title="杂谈" value={chatters.length} color="purple" />
                <StatCard icon="🚀" title="项目" value={projects.length} color="green" />
                <StatCard icon="💝" title="友链" value={friends.length} color="pink" />
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 mt-4">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4">最近动态</h3>
                {posts.length === 0 ? (
                  <p className="text-slate-500 text-sm">暂无数据，请先在系统中创建内容</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {posts.slice(0, 5).map(post => (
                      <div key={post.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">📄</div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">{post.title}</h4>
                          <p className="text-xs text-slate-500">{post.date}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${post.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {post.status === 'PUBLISHED' ? '已发布' : '草稿'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">文章管理</h2>
                <button className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition-colors">
                  + 新建文章
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map(post => (
                  <div key={post.id} className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-5 border border-white/50 dark:border-slate-700/50">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-slate-800 dark:text-white">{post.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${post.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {post.status === 'PUBLISHED' ? '已发布' : '草稿'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{post.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>📅 {post.date}</span>
                      <span>👁 {post.views}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">相册管理</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {albums.map(album => (
                  <div key={album.id} className="bg-white/60 dark:bg-slate-800/60 rounded-2xl overflow-hidden border border-white/50 dark:border-slate-700/50">
                    {album.cover && <img src={album.cover} alt={album.title} className="w-full h-32 object-cover" />}
                    <div className="p-3">
                      <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">{album.title}</h3>
                      <p className="text-xs text-slate-500">{album.photos.length} 张照片</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">系统配置</h2>
                <button onClick={() => setIsConfigEditorOpen(true)}
                  className="px-4 py-2 rounded-xl text-sm font-black bg-indigo-500 text-white shadow-lg hover:bg-indigo-600 active:scale-95 transition-all flex items-center gap-2">
                  ⚙️ 编辑站点配置
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ConfigCard title="基础信息" items={[
                  { label: '站点标题', value: siteInfo?.title || '' },
                  { label: '博主名称', value: siteInfo?.authorName || '' },
                ]} />
                <ConfigCard title="社交链接" items={[
                  { label: 'GitHub', value: siteInfo?.social?.github || '未配置' },
                  { label: '邮箱', value: siteInfo?.social?.email || '未配置' },
                ]} />
                <ConfigCard title="友链管理" items={[
                  { label: '友链数量', value: `${friends.length} 个` },
                ]} />
                <ConfigCard title="项目展示" items={[
                  { label: '项目数量', value: `${projects.length} 个` },
                ]} />
              </div>
            </div>
          )}

        </div>
      </motion.div>

      <SiteConfigEditor isOpen={isConfigEditorOpen} onClose={() => setIsConfigEditorOpen(false)} />
    </div>
  );
}

function StatCard({ icon, title, value, color }: { icon: string; title: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500/20 to-indigo-600/20 text-indigo-600',
    purple: 'from-purple-500/20 to-purple-600/20 text-purple-600',
    green: 'from-green-500/20 to-green-600/20 text-green-600',
    pink: 'from-pink-500/20 to-pink-600/20 text-pink-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} dark:to-slate-800/60 rounded-2xl p-5 border border-white/50 dark:border-slate-700/50`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-sm text-slate-500">{title}</div>
    </div>
  );
}

function ConfigCard({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <div className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-5 border border-white/50 dark:border-slate-700/50">
      <h3 className="font-bold text-slate-800 dark:text-white mb-3">{title}</h3>
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-slate-500">{item.label}</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
