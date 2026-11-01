export interface FriendLinkFields {
  name: string;
  url: string;
  avatar: string;
  description: string;
  contact: string;
}

export interface ParsedFriendLink extends FriendLinkFields {
  errors: string[];
}

const LABELS: Record<string, keyof FriendLinkFields> = {
  名称: "name",
  网址: "url",
  头像: "avatar",
  简介: "description",
  联系: "contact",
  联系方式: "contact",
};

/**
 * Parses the same four-line block that the copy button produces.
 * Labels may use either a full-width or ASCII colon, and the order is free.
 */
export function parseFriendLinkText(text: string): ParsedFriendLink {
  const fields: FriendLinkFields = {
    name: "",
    url: "",
    avatar: "",
    description: "",
    contact: "",
  };

  let descriptionOpen = false;
  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const match = line.match(/^\s*(名称|网址|头像|简介|联系|联系方式)\s*[：:]\s*(.*)$/);
    if (match) {
      const key = LABELS[match[1]];
      fields[key] = match[2].trim();
      descriptionOpen = key === "description";
      continue;
    }

    if (descriptionOpen && line.trim()) {
      fields.description = `${fields.description}\n${line.trim()}`.trim();
    }
  }

  const errors: string[] = [];
  if (!fields.name) errors.push("缺少名称");
  if (!fields.url) errors.push("缺少网址");
  if (fields.url && !/^https?:\/\//i.test(fields.url)) errors.push("网址需要以 http:// 或 https:// 开头");
  if (fields.avatar && !/^https?:\/\//i.test(fields.avatar)) errors.push("头像需要是完整 URL");

  return { ...fields, errors };
}

export function formatFriendLinkFields(fields: Partial<FriendLinkFields>): string {
  const lines = [
    `名称：${fields.name || ""}`,
    `网址：${fields.url || ""}`,
    `头像：${fields.avatar || ""}`,
    `简介：${fields.description || ""}`,
  ];
  if (fields.contact) lines.push(`联系：${fields.contact}`);
  return lines.join("\n");
}

export const FRIEND_LINK_TEMPLATE =
  "名称：你的站名\n网址：https://example.com\n头像：https://example.com/avatar.jpg\n简介：一句话介绍自己的网站";
