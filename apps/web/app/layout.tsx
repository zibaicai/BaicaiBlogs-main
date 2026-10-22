import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "白菜博客", description: "公开文章与项目展示" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="nav">
          <div className="container inner">
            <Link className="brand" href="/">白菜博客</Link>
            <Link href="/posts">文章</Link>
            <Link href="/projects">项目</Link>
            <Link href="/timeline">归档</Link>
            <span className="spacer" />
            <a href="https://admin.zibaicai.cn" rel="nofollow">管理</a>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="container footer">© {new Date().getFullYear()} zibaicai.cn</footer>
      </body>
    </html>
  );
}
