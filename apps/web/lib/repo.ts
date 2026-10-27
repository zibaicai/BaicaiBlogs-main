export function repoProviderLabel(url?: string | null): string | undefined {
  if (!url) return undefined;
  let host = "";
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "仓库";
    host = parsed.hostname.toLowerCase();
  } catch {
    return undefined;
  }

  const exact = (domain: string) => host === domain || host.endsWith(`.${domain}`);
  if (exact("github.com")) return "GitHub";
  if (exact("gitee.com")) return "Gitee";
  if (exact("gitlab.com")) return "GitLab";
  if (exact("bitbucket.org")) return "Bitbucket";
  if (exact("codeup.aliyun.com")) return "Codeup";
  if (exact("gitcode.com")) return "GitCode";
  if (exact("gitlink.org.cn")) return "GitLink";
  return "仓库";
}
