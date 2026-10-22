import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { getAlbums } from "../../lib/server-api";

export const dynamic = "force-dynamic";
export const metadata = { title: "照片墙" };

export default async function PhotoWallPage() {
  const albums = await getAlbums();
  const photoCount = albums.reduce((total, album) => total + (album.photos?.length || 0), 0);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-full max-w-6xl mx-auto mt-28 px-4 sm:px-10 relative z-10">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
              照片墙
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {albums.length} 个相册 · {photoCount} 张照片
            </p>
          </header>

          {albums.length === 0 ? (
            <div className="text-center py-24 text-slate-500 dark:text-slate-400 font-bold">
              相册还没有公开内容。
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {albums.map((album) => (
                <div
                  key={album.albumId || album.id}
                  className="group bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-[40px] overflow-hidden border border-white/40 dark:border-white/10 shadow-xl"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={album.cover}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-5 left-6 right-6">
                      <h2 className="text-2xl font-black text-white drop-shadow">{album.title}</h2>
                      <p className="text-xs text-white/80 mt-1">{album.description}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                      {album.photos?.length || 0} 张照片
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {(album.photos || []).slice(0, 8).map((photo) => (
                        <div key={photo.id || photo.url} className="aspect-square rounded-xl overflow-hidden bg-slate-200/60 dark:bg-slate-900/60">
                          <img
                            src={photo.url}
                            alt={photo.caption || ""}
                            loading="lazy"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
