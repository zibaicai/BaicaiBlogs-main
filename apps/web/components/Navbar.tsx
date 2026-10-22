"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useSiteConfigContext } from "../context/SiteConfigProvider";

const NAV_LINKS = [
  { name: "首页", href: "/" },
  { name: "文章", href: "/posts" },
  { name: "项目", href: "/projects" },
  { name: "照片", href: "/photowall" },
  { name: "归档", href: "/timeline" },
  { name: "关于", href: "/about" },
  { name: "友链", href: "/friends" },
  { name: "说说", href: "/moments" },
];

export default function Navbar() {
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { siteInfo } = useSiteConfigContext();

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setShowNav(!(current > lastScrollY && current > 80));
      setLastScrollY(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => setMobileOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={`w-full fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${
          showNav ? "translate-y-0" : "-translate-y-full"
        } bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-sm`}
      >
        <div className="w-[95%] max-w-7xl mx-auto h-16 flex items-center justify-between px-4 box-border">
          <Link
            href="/"
            className="text-xl font-black text-slate-800 dark:text-white tracking-tighter whitespace-nowrap"
          >
            {siteInfo?.navTitle}
            <span className="text-indigo-500 mx-1">{siteInfo?.navSuffix || "の"}</span>
            {siteInfo?.navAfter}
          </Link>

          <nav className="hidden lg:flex gap-8 text-sm font-bold">
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

          <button
            type="button"
            aria-label="打开导航"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden w-10 h-10 rounded-xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-center text-slate-700 dark:text-slate-200 border border-white/20 dark:border-white/10 shadow-sm"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-white/20 dark:border-white/5"
            >
              <div className="w-[95%] max-w-7xl mx-auto py-4 grid grid-cols-2 gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                      isActive(link.href)
                        ? "bg-indigo-500 text-white"
                        : "text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
