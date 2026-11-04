export const PUBLIC_SITE_URL = "https://www.zibaicai.cn";

export function publicCommentUrl(targetType: string, targetId: number) {
  return `${PUBLIC_SITE_URL}/comments/resource/${targetType}/${targetId}`;
}
