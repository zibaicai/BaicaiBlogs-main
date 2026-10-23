import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import DirectoryHeader from "../../components/DirectoryHeader";
import DirectoryExplorer from "../../components/DirectoryExplorer";
import { formatDate } from "../../lib/api";
import { getMoments } from "../../lib/server-api";

export const dynamic = "force-dynamic";
export const metadata = { title: "说说" };

export default async function MomentsPage() {
  const moments = await getMoments();
  const items = moments.map((moment) => ({
    key: String(moment.slug || moment.id),
    node: (
      <article className="directory-card p-6 md:p-8">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
          {formatDate(moment.date)}
        </div>
        <div
          className="article-prose prose prose-slate dark:prose-invert max-w-none text-sm md:text-base text-slate-800 dark:text-slate-200"
          dangerouslySetInnerHTML={{ __html: moment.htmlContent || "" }}
        />
        {(moment.images || []).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
            {moment.images.map((img) => (
              <a
                key={img}
                href={img}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square rounded-2xl overflow-hidden bg-white/40 dark:bg-slate-900/40"
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </a>
            ))}
          </div>
        )}
      </article>
    ),
    searchText: [moment.date, (moment.htmlContent || "").replace(/<[^>]+>/g, " ")].join(" "),
    filterValues: [],
  }));
  const empty = (
    <div className="directory-card p-10 text-center">
      <div className="text-5xl mb-5">💭</div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">这里还很安静</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        说说模块已接入公开数据源，等第一条记录出现时，它会在这里亮起来。
      </p>
    </div>
  );

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <DirectoryHeader
            eyebrow="BAICAI / MOMENTS"
            title="说说"
            subtitle="零散的念头，落在时间里"
            count={`${moments.length} 条记录`}
          />
          <DirectoryExplorer
            eyebrow="BAICAI / MOMENTS"
            title="说说"
            subtitle="零散的念头，落在时间里"
            count={`${moments.length} 条记录`}
            items={items}
            filters={[{ value: "all", label: "全部记录", count: moments.length }]}
            searchPlaceholder="搜索说说内容..."
            empty={empty}
          />
        </main>
      </PageTransition>
    </div>
  );
}
