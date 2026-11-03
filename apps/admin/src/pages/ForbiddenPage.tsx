"use client";

import { Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { AdminPageShell } from "../components/admin/AdminUI";
import { Button } from "../components/ui/Button";

export default function ForbiddenPage() {
  return (
    <AdminPageShell>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <ShieldOff className="mx-auto text-amber-300" size={28} />
          <h1 className="mt-4 text-lg font-black text-white">无权访问</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">当前账户没有访问该页面的权限，登录状态仍然有效。</p>
          <Link to="/" className="mt-5 inline-block">
            <Button>返回控制台</Button>
          </Link>
        </div>
      </div>
    </AdminPageShell>
  );
}
