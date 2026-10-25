import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import AuthorCard from "../../components/AuthorCard";
import { getPublicSiteConfig } from "../../lib/server-api";

export const dynamic = "force-dynamic";
export const metadata = { title: "关于" };

export default async function AboutPage() {
  const { siteInfo } = await getPublicSiteConfig();

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <div className="max-w-5xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
              关于
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              代码、照片、音乐，以及一些还在路上的想法
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4">
              <AuthorCard />
            </div>

            <section className="lg:col-span-8 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/40 dark:border-white/10 shadow-xl">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
                你好，我是 {siteInfo.authorName}
              </h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                {siteInfo.bio}
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                这里记录公开的文章、项目、影像和一些零散想法。评论、后台和更多功能都还在继续生长，
                就像海面每天都会换一种颜色。
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 p-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    建站时间
                  </div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {String(siteInfo.buildDate || "").slice(0, 10)}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 p-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    备案
                  </div>
                  <a
                    href={siteInfo.icpConfig?.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-indigo-500 hover:underline"
                  >
                    {siteInfo.icpConfig?.name}
                  </a>
                </div>
              </div>
            </section>
          </div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
