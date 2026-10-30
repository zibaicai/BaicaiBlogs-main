import Link from "next/link";

export interface RecommendedItem {
  title: string;
  href: string;
  date?: string;
}

export default function RecommendedCard({
  items,
  title = "RECOMMENDED",
}: {
  items: RecommendedItem[];
  title?: string;
}) {
  return (
    <div className="recommended-card flex h-full flex-col rounded-3xl border border-white/40 bg-white/60 p-5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/50">
      <h3 className="mb-2 border-l-4 border-indigo-500 pl-2 text-sm font-black text-slate-900 dark:text-white">
        {title}
      </h3>
      <div className="flex flex-1 flex-col justify-evenly">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="group block">
            <h4 className="line-clamp-1 text-sm font-bold text-slate-800 transition-colors group-hover:text-indigo-600 dark:text-slate-200 dark:group-hover:text-indigo-400">
              {item.title}
            </h4>
            {item.date && (
              <p className="mt-1 text-meta font-bold uppercase text-slate-400 dark:text-slate-500">
                {item.date}
              </p>
            )}
          </Link>
        ))}
        {items.length === 0 && <p className="text-xs text-slate-400">暂无推荐内容</p>}
      </div>
    </div>
  );
}
