-- ============================================
-- 初始数据脚本
-- 由 Spring Boot 自动执行
-- ============================================

-- 示例文章（如不存在则插入）
INSERT INTO posts (slug, title, description, content, cover, date, status)
SELECT 'welcome-to-baicaiblogs', '欢迎来到宝藏之地', '这是第一篇示例文章，欢迎来到我的博客！',
       '# 欢迎来到宝藏之地\n\n这是一个使用 **Java + MySQL** 后端驱动的博客系统。\n\n## 技术栈\n\n- Spring Boot 3.x\n- Spring Data JPA\n- MySQL 8\n- Next.js 16\n\n> 开始你的写作之旅吧！',
       'https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg',
       '2026-08-12 10:00:00', 'PUBLISHED'
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE slug = 'welcome-to-baicaiblogs');

-- 示例杂谈
INSERT INTO chatters (slug, title, content, mood, cover, date, tags)
SELECT 'first-chatter', '第一次杂谈',
       '今天搭建了新的博客系统，感觉很开心！',
       '开心', 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg',
       '2026-08-12 11:00:00', '["日常", "技术"]'
WHERE NOT EXISTS (SELECT 1 FROM chatters WHERE slug = 'first-chatter');

-- 示例项目
INSERT INTO projects (project_id, name, description, icon, github_url, tags, sort_order)
SELECT 'proj_001', 'Computational Chemistry Tool',
       '整合了分子动力学模拟常用工具的 Python 脚本集合',
       '🚀', 'https://github.com/heiehiehi/Computational_Chemistry_Tool',
       '["Gromacs", "RMSF", "Python"]', 1
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE project_id = 'proj_001');

-- 示例友链
INSERT INTO friends (friend_id, name, url, description, avatar, theme_color, sort_order)
SELECT 'amiya', '罗德岛 PRTS', 'https://prts.wiki/',
       '记录泰拉大陆的各项数据与前文明遗迹',
       'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg',
       'rgba(16, 185, 129, 0.5)', 1
WHERE NOT EXISTS (SELECT 1 FROM friends WHERE friend_id = 'amiya');

-- 示例相册
INSERT INTO albums (album_id, title, description, cover, date, sort_order)
SELECT 'album_001', '旅行日记', '记录旅途中的美好瞬间',
       'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg',
       '2026-07-01 00:00:00', 1
WHERE NOT EXISTS (SELECT 1 FROM albums WHERE album_id = 'album_001');

-- 示例照片
INSERT INTO photos (album_id, url, caption, sort_order)
SELECT a.id, 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg', '风景照 1', 1
FROM albums a WHERE a.album_id = 'album_001'
AND NOT EXISTS (SELECT 1 FROM photos WHERE url = 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg');

-- 站点配置
INSERT INTO site_config (config_key, config_value, description)
SELECT 'site_title', 'XingHuiSama の 宝藏之地', '网站标题'
WHERE NOT EXISTS (SELECT 1 FROM site_config WHERE config_key = 'site_title');

INSERT INTO site_config (config_key, config_value, description)
SELECT 'author_name', 'XingHuiSama', '博主名称'
WHERE NOT EXISTS (SELECT 1 FROM site_config WHERE config_key = 'author_name');

INSERT INTO site_config (config_key, config_value, description)
SELECT 'author_bio', '在代码、学术与分子动力学模拟间穿梭的普通人。', '博主简介'
WHERE NOT EXISTS (SELECT 1 FROM site_config WHERE config_key = 'author_bio');

INSERT INTO site_config (config_key, config_value, description)
SELECT 'avatar_url', 'https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg', '头像 URL'
WHERE NOT EXISTS (SELECT 1 FROM site_config WHERE config_key = 'avatar_url');

INSERT INTO site_config (config_key, config_value, description)
SELECT 'social_github', 'https://github.com/heiehiehi', 'GitHub 链接'
WHERE NOT EXISTS (SELECT 1 FROM site_config WHERE config_key = 'social_github');

INSERT INTO site_config (config_key, config_value, description)
SELECT 'social_email', '1124533793@qq.com', '邮箱'
WHERE NOT EXISTS (SELECT 1 FROM site_config WHERE config_key = 'social_email');
