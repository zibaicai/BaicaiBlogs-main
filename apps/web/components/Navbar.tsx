"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useSiteConfigContext } from "../context/SiteConfigProvider";
import { apiClient } from "../lib/api";
import { useAuth } from "../lib/auth";
import UserMenu from "./UserMenu";
import NavSearch from "./NavSearch";

const NAV_LINKS = [
  { name: "首页", href: "/" },
  { name: "小屋", href: "/rooms" },
  { name: "笔记", href: "/posts" },
  { name: "文章", href: "/articles" },
  { name: "项目", href: "/projects" },
  { name: "影像", href: "/photowall" },
  { name: "说说", href: "/moments" },
  { name: "音乐", href: "/music" },
  { name: "归档", href: "/timeline" },
  { name: "建议", href: "/suggestions" },
  { name: "友链", href: "/friends" },
  { name: "关于", href: "/about" },
];

export default function Navbar() {
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [myRoomName, setMyRoomName] = useState<string | null>(null);
  const pathname = usePathname();
  const { siteInfo } = useSiteConfigContext();
  const { user } = useAuth();
  const communityName = siteInfo?.navAfter || siteInfo?.title || "云端小屋";
  const isHome = pathname === "/";
  const leftName = roomName || (isHome ? myRoomName || siteInfo?.authorName || "YeLuo" : null);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setShowNav(!(current > lastScrollY && current > 80));
      setLastScrollY(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const match = pathname.match(/^\/u\/([^/]+)/);
    if (match) {
      let cancelled = false;
      apiClient
        .getRoom(decodeURIComponent(match[1]))
        .then((response) => {
          if (!cancelled) setRoomName(response.data.roomName);
        })
        .catch(() => {
          if (!cancelled) setRoomName(null);
        });
      return () => {
        cancelled = true;
      };
    }
    setRoomName(null);
    if (pathname === "/" && user) {
      let cancelled = false;
      apiClient
        .getRoom(user.username)
        .then((response) => {
          if (!cancelled) setMyRoomName(response.data.roomName);
        })
        .catch(() => {
          if (!cancelled) setMyRoomName(null);
        });
      return () => {
        cancelled = true;
      };
    }
    setMyRoomName(null);
    return undefined;
  }, [pathname, user]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={`site-navbar w-full fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${
          showNav ? "translate-y-0" : "-translate-y-full"
        } bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-sm`}
      >
        <div className="w-full max-w-[1180px] mx-auto h-16 flex items-center justify-between px-4 sm:px-8 box-border">
          <Link
            href="/"
            className="text-xl font-black text-slate-800 dark:text-white tracking-tighter whitespace-nowrap"
          >
            {leftName ? (
              <>
                {leftName}
                <span className="text-indigo-500 mx-1">/</span>
                {communityName}
              </>
            ) : (
              communityName
            )}
          </Link>

          <div className="nav-cluster hidden lg:flex items-center gap-1">
            <nav className={`nav-links flex gap-8 text-sm font-bold ${searchOpen ? "search-open" : ""}`}>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-1 transition-colors ${
                    isActive(link.href)
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-700 dark:text-slate-200 hover:text-indigo-500"
                  }`}
                >
                  {link.name}
                  {isActive(link.href) && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-indigo-500/70" />
                  )}
                </Link>
              ))}
            </nav>
            {/* 占位div宽度16px */}
            <div className="w-8"></div>
            <NavSearch open={searchOpen} onOpenChange={setSearchOpen} />
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex">
              <UserMenu />
            </div>
            <button
              type="button"
              aria-label="打开导航"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden w-10 h-10 rounded-xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-center text-slate-700 dark:text-slate-200 border border-white/20 dark:border-white/10 shadow-sm"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              id="mobile-nav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden bg-transparent border-t border-white/20 dark:border-white/5"
            >
              <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-8 py-4 grid grid-cols-3 min-[420px]:grid-cols-4 gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2.5 rounded-xl text-sm font-bold text-center transition-colors ${
                      isActive(link.href)
                        ? "bg-[var(--ui-accent)] text-[var(--ui-accent-contrast)]"
                        : "text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <Link
                  href="/login"
                  className="col-span-full px-4 py-2.5 rounded-xl text-sm font-bold text-center text-[var(--ui-accent)] bg-[var(--ui-accent-soft)]"
                >
                  登录 / 账号
                </Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
