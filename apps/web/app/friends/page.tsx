import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import ArchiveItemCard from "../../components/ArchiveItemCard";
import DirectoryExplorer from "../../components/DirectoryExplorer";
import FriendApplySection from "../../components/FriendApplySection";
import { getFriends, getPublicSiteConfig } from "../../lib/server-api";
import { formatDay } from "../../lib/api";
import { DEFAULT_SITE_INFO } from "../../lib/site-config";

export const dynamic = "force-dynamic";
export const metadata = { title: "友链" };

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

export default async function FriendsPage() {
  const [friends, { siteInfo }] = await Promise.all([getFriends(), getPublicSiteConfig()]);

  const items = friends.map((friend) => ({
    key: String(friend.friendId || friend.id),
    node: (
      <ArchiveItemCard
        external
        href={friend.url}
        title={friend.name}
        description={friend.description || "一位也在认真记录的人。"}
        label={friend.createdAt ? formatDay(friend.createdAt) : undefined}
        category="NEIGHBOR"
        meta={hostOf(friend.url)}
        media={{ kind: "avatar", src: friend.avatar || DEFAULT_SITE_INFO.avatarUrl, alt: friend.name }}
      />
    ),
    searchText: [friend.name, friend.description, friend.url].join(" "),
    filterValues: [],
  }));

  const empty = (
    <div className="directory-card p-10 text-center">
      <div className="mb-5 text-5xl">🤝</div>
      <h2 className="mb-3 text-xl font-bold text-slate-800 dark:text-white">友链正在靠岸...</h2>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        暂时还没有公开友链。想交换链接的话，可以按下面的格式准备信息：
      </p>
      <pre className="mt-5 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-900/90 p-5 text-left text-xs leading-relaxed text-slate-200">
        {`名称：${DEFAULT_SITE_INFO.title}
简介：${DEFAULT_SITE_INFO.bio}
链接：https://www.zibaicai.cn
头像：${DEFAULT_SITE_INFO.avatarUrl}`}
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
            filters={[{ value: "all", label: "全部朋友", count: friends.length }]}
            views={["grid", "timeline", "masonry"]}
            compact
            gridClassName="cover-grid"
            searchPlaceholder="搜索朋友、简介或链接..."
            empty={empty}
          />
          <FriendApplySection siteInfo={siteInfo} />
        </main>
      </PageTransition>
    </div>
  );
}
