import { AdminPageHeader, AdminPageShell } from "../components/admin/AdminUI";
import SecuritySection from "../components/settings/SecuritySection";

export default function AccountSecurityPage() {
  return (
    <AdminPageShell>
      <AdminPageHeader title="账号安全" description="修改密码、二次验证与登录安全" />
      <SecuritySection />
    </AdminPageShell>
  );
}
