import { useState } from "react";
import { api } from "../../lib/api";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useToast } from "../ToastProvider";

export default function SecuritySection() {
  const { showToast } = useToast();
  const [secret, setSecret] = useState("");
  const [otpauth, setOtpauth] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const res = await api.setup2fa();
      setSecret(res.data.secret);
      setOtpauth(res.data.otpauthUrl);
      showToast("已生成密钥，请在身份验证器中添加后输入验证码", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "生成失败", "error");
    } finally {
      setBusy(false);
    }
  };

  const enable = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      showToast("请输入 6 位验证码", "error");
      return;
    }
    setBusy(true);
    try {
      await api.enable2fa(code.trim());
      showToast("二次验证已启用，下次登录需要验证码", "success");
      setCode("");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "启用失败", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-black text-white">管理端二次验证</h3>
        <p className="mt-2 text-sm text-slate-400">
          使用 TOTP 身份验证器（Google Authenticator、1Password、Microsoft Authenticator 等）。
          启用后，管理员登录需要额外输入 6 位动态验证码。
        </p>
        {!secret ? (
          <Button className="mt-5" onClick={start} disabled={busy}>
            {busy ? "生成中..." : "生成绑定密钥"}
          </Button>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-black/30 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secret</div>
              <div className="mt-1 break-all font-mono text-sm text-emerald-300">{secret}</div>
              <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-500">otpauth URL</div>
              <div className="mt-1 break-all font-mono text-xs text-slate-400">{otpauth}</div>
            </div>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="输入 6 位动态验证码"
              inputMode="numeric"
              maxLength={6}
            />
            <Button onClick={enable} disabled={busy}>
              {busy ? "验证中..." : "启用二次验证"}
            </Button>
          </div>
        )}
      </div>
      <div className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-6 text-sm text-amber-200/80">
        启用后请妥善保存身份验证器。丢失验证器将无法登录管理端，需要服务器运维介入重置。
      </div>
    </div>
  );
}
