-- ============================================
-- 初始数据脚本
-- 由 Spring Boot 自动执行
-- ============================================

-- 示例文章（如不存在则插入）
INSERT INTO posts (slug, title, description, content, cover, date, status)
SELECT 'welcome-to-baicaiblogs', '把第一束光留在这里', '一个用来存放文字、影像和未完成想法的地方。',
       '# 把第一束光留在这里\n\n这是一个由 **Spring Boot + Next.js** 驱动的个人档案站。\n\n## 这里会有什么\n\n- 写过的代码与项目\n- 拍下的照片\n- 一些没写成长文的碎片\n\n> 海面每天都在换颜色，记录也是。',
       'https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg',
       '2026-08-12 10:00:00', 'PUBLISHED'
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE slug = 'welcome-to-baicaiblogs');

-- 示例项目
INSERT INTO projects (project_id, name, description, icon, github_url, tags, sort_order)
SELECT 'proj_001', 'Tide Archive',
       '把文章、影像、音乐与项目收进同一片海的个人档案站。',
       '🌊', 'https://github.com/zibaicai',
       '["Next.js", "Spring Boot", "Archive"]', 1
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE project_id = 'proj_001');

-- 示例友链
INSERT INTO friends (friend_id, name, url, description, avatar, theme_color, sort_order)
SELECT 'tide-neighbor', '潮汐观测站', 'https://www.zibaicai.cn/',
       '一个同样在记录光、代码与日常的地方。',
       'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg',
       'rgba(16, 185, 129, 0.5)', 1
WHERE NOT EXISTS (SELECT 1 FROM friends WHERE friend_id = 'tide-neighbor');

-- 示例相册
INSERT INTO albums (album_id, title, description, cover, date, sort_order)
SELECT 'album_001', '旅行日记', '记录旅途中被光照到的地方。',
       'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg',
       '2026-07-01 00:00:00', 1
WHERE NOT EXISTS (SELECT 1 FROM albums WHERE album_id = 'album_001');

-- 示例照片
INSERT INTO photos (album_id, url, caption, sort_order)
SELECT a.id, 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg', '潮汐与风 1', 1
FROM albums a WHERE a.album_id = 'album_001'
AND NOT EXISTS (SELECT 1 FROM photos WHERE url = 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg');

-- 站点配置
INSERT INTO site_config (config_key, config_value, description)
SELECT 'site_title', 'YeLuo / 云端小屋', '网站标题'
WHERE NOT EXISTS (SELECT 1 FROM site_config WHERE config_key = 'site_title');

INSERT INTO site_config (config_key, config_value, description)
SELECT 'author_name', 'YeLuo', '博主名称'
WHERE NOT EXISTS (SELECT 1 FROM site_config WHERE config_key = 'author_name');

INSERT INTO site_config (config_key, config_value, description)
SELECT 'author_bio', '写代码，也拍照片。把项目、音乐和日常里值得留下的片段，收进同一片海。', '博主简介'
WHERE NOT EXISTS (SELECT 1 FROM site_config WHERE config_key = 'author_bio');

INSERT INTO site_config (config_key, config_value, description)
SELECT 'avatar_url', 'https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg', '头像 URL'
WHERE NOT EXISTS (SELECT 1 FROM site_config WHERE config_key = 'avatar_url');

INSERT INTO site_config (config_key, config_value, description)
SELECT 'social_github', 'https://github.com/zibaicai', 'GitHub 链接'
WHERE NOT EXISTS (SELECT 1 FROM site_config WHERE config_key = 'social_github');

INSERT INTO site_config (config_key, config_value, description)
SELECT 'social_email', '<redacted>', '邮箱'
WHERE NOT EXISTS (SELECT 1 FROM site_config WHERE config_key = 'social_email');
