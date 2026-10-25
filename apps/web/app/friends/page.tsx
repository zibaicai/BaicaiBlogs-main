import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import DirectoryExplorer from "../../components/DirectoryExplorer";
import { getFriends } from "../../lib/server-api";
import { DEFAULT_SITE_INFO } from "../../lib/site-config";

export const dynamic = "force-dynamic";
export const metadata = { title: "友链" };

export default async function FriendsPage() {
  const friends = await getFriends();

  const items = friends.map((friend) => ({
    key: String(friend.friendId || friend.id),
    node: (
      <a
        href={friend.url}
        target="_blank"
        rel="noopener noreferrer"
        className="directory-card group p-6"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/60 dark:bg-slate-900/60 shadow-md flex-shrink-0">
            <img
              src={friend.avatar || DEFAULT_SITE_INFO.avatarUrl}
              alt={friend.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors truncate">
            {friend.name}
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
          {friend.description || "一位也在认真记录的人。"}
        </p>
      </a>
    ),
    searchText: [friend.name, friend.description, friend.url].join(" "),
    filterValues: [],
  }));

  const empty = (
    <div className="max-w-2xl mx-auto directory-card p-10 text-center">
      <div className="text-5xl mb-5">🌱</div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
        友链正在靠岸...
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        暂时还没有公开友链。想交换链接的话，可以按下面的格式准备信息：
      </p>
      <pre className="mt-5 text-left text-xs leading-relaxed whitespace-pre-wrap bg-slate-900/90 text-slate-200 rounded-2xl p-5 overflow-x-auto">
        {`
          名称：${DEFAULT_SITE_INFO.title}
          简介：${DEFAULT_SITE_INFO.bio}
          链接：https://www.zibaicai.cn
          头像：${DEFAULT_SITE_INFO.avatarUrl}
        `}
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <DirectoryExplorer
            eyebrow="BAICAI / NEIGHBORS"
            title="友链"
            subtitle="海面很宽，认识一些同样在记录的人。"
            count={`${friends.length} 位朋友`}
            items={items}
            filters={[
              { value: "all", label: "全部朋友", count: friends.length },
            ]}
            searchPlaceholder="搜索朋友、简介或链接..."
            empty={empty}
          />
        </main>
      </PageTransition>
    </div>
  );
}
