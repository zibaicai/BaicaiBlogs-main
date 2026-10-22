import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { getFriends } from "../../lib/server-api";
import { DEFAULT_SITE_INFO } from "../../lib/site-config";

export const dynamic = "force-dynamic";
export const metadata = { title: "友链" };

export default async function FriendsPage() {
  const friends = await getFriends();

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-full max-w-5xl mx-auto mt-28 px-4 sm:px-10 relative z-10">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
              友链
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              在互联网的另一端，也有人在认真记录
            </p>
          </header>

          {friends.length === 0 ? (
            <div className="max-w-2xl mx-auto bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-10 border border-white/40 dark:border-white/10 shadow-xl text-center">
              <div className="text-5xl mb-5">🌱</div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">友链正在生长</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                暂时还没有公开友链。如果你想交换链接，可以按下面的格式准备信息：
              </p>
              <pre className="mt-5 text-left text-xs leading-relaxed whitespace-pre-wrap bg-slate-900/90 text-slate-200 rounded-2xl p-5 overflow-x-auto">
{`名称：${DEFAULT_SITE_INFO.title}
简介：${DEFAULT_SITE_INFO.bio}
链接：https://www.zibaicai.cn
头像：${DEFAULT_SITE_INFO.avatarUrl}`}
              </pre>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {friends.map((friend) => (
                <a
                  key={friend.friendId || friend.id}
                  href={friend.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl hover:-translate-y-1 transition-all duration-500"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/60 dark:bg-slate-900/60 shadow-md flex-shrink-0">
                      <img
                        src={friend.avatar || DEFAULT_SITE_INFO.avatarUrl}
                        alt={friend.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors truncate">
                      {friend.name}
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {friend.description || "一位认真记录的朋友。"}
                  </p>
                </a>
              ))}
            </div>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
