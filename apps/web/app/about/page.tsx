import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { getPublicSiteConfig } from "../../lib/server-api";

export const dynamic = "force-dynamic";
export const metadata = { title: "关于社区" };

export default async function AboutPage() {
  const { siteInfo } = await getPublicSiteConfig();
  const communityName = siteInfo.navAfter || siteInfo.title || "云端小屋";

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <div className="max-w-4xl mx-auto">
            <header className="text-center mb-12">
              <p className="text-meta font-black uppercase tracking-[0.24em] text-indigo-400">ABOUT THE COMMUNITY</p>
              <h1 className="display-title mt-3 text-slate-900 dark:text-white">
                关于 {communityName}
              </h1>
              <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">
                一间间小屋，组成一片可以慢慢生活的地方。
              </p>
            </header>

            <section className="rounded-3xl border border-white/40 bg-white/60 p-8 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/50 md:p-10">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">社区介绍</h2>
              <p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-300">
                {siteInfo.bio || "收集生活的砂砾，也收藏那些不想丢掉的东西。"}
              </p>
              <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-400">
                这里由许多间独立的小屋组成。每个人可以拥有自己的昵称、小屋名、简介和内容，
                在社区里记录笔记、说说、照片和音乐，也可以把喜欢的内容留在自己的小屋里。
              </p>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/40 bg-white/50 p-5 dark:border-white/10 dark:bg-slate-900/40">
                  <div className="text-meta font-black uppercase tracking-widest text-slate-400">建站时间</div>
                  <div className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                    {String(siteInfo.buildDate || "").slice(0, 10) || "未知"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/40 bg-white/50 p-5 dark:border-white/10 dark:bg-slate-900/40">
                  <div className="text-meta font-black uppercase tracking-widest text-slate-400">备案</div>
                  {siteInfo.icpConfig?.link ? (
                    <a href={siteInfo.icpConfig.link} target="_blank" rel="noopener noreferrer" className="mt-2 block text-sm font-bold text-indigo-500 hover:underline">
                      {siteInfo.icpConfig.name}
                    </a>
                  ) : (
                    <div className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">{siteInfo.icpConfig?.name || "未填写"}</div>
                  )}
                </div>
                <div className="rounded-2xl border border-white/40 bg-white/50 p-5 dark:border-white/10 dark:bg-slate-900/40">
                  <div className="text-meta font-black uppercase tracking-widest text-slate-400">社区维护者</div>
                  <div className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">{siteInfo.authorName || "站长"}</div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/rooms" className="hv-button hv-button-primary">看看大家的小屋</a>
                <a href="/account/room" className="hv-button">布置我的小屋</a>
              </div>
            </section>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
