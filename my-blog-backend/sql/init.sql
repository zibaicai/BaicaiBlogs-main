-- ============================================
-- BaicaiBlogs 数据库初始化脚本
-- 数据库名称: blogs
-- ============================================

CREATE DATABASE IF NOT EXISTS blogs DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE blogs;

-- -------------------------------------------
-- 用户表
-- -------------------------------------------
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `post_tags`;
DROP TABLE IF EXISTS `tags`;
DROP TABLE IF EXISTS `photos`;
DROP TABLE IF EXISTS `albums`;
DROP TABLE IF EXISTS `friends`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `moments`;
DROP TABLE IF EXISTS `chatters`;
DROP TABLE IF EXISTS `posts`;
DROP TABLE IF EXISTS `site_config`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
  `role` VARCHAR(20) DEFAULT 'ADMIN' COMMENT '角色：ADMIN, EDITOR',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 默认管理员账号（密码：__ADMIN_BOOTSTRAP_PASSWORD__，使用 BCrypt 加密）
INSERT INTO `users` (`username`, `password`, `role`) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'ADMIN');

-- -------------------------------------------
-- 文章表 (posts)
-- -------------------------------------------
CREATE TABLE `posts` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(200) NOT NULL UNIQUE COMMENT 'URL 友好标识',
  `title` VARCHAR(500) NOT NULL COMMENT '文章标题',
  `description` TEXT COMMENT '文章摘要',
  `content` MEDIUMTEXT NOT NULL COMMENT 'Markdown 原文',
  `html_content` MEDIUMTEXT COMMENT '渲染后的 HTML',
  `cover` VARCHAR(500) COMMENT '封面图 URL',
  `date` DATETIME NOT NULL COMMENT '发布日期',
  `status` VARCHAR(20) DEFAULT 'PUBLISHED' COMMENT '状态：DRAFT, PUBLISHED, ARCHIVED',
  `views` INT DEFAULT 0 COMMENT '浏览量',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_posts_date` (`date`),
  INDEX `idx_posts_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='博客文章表';

-- -------------------------------------------
-- 杂谈表 (chatters)
-- -------------------------------------------
CREATE TABLE `chatters` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(200) NOT NULL UNIQUE,
  `title` VARCHAR(500) COMMENT '标题',
  `content` MEDIUMTEXT NOT NULL COMMENT 'Markdown 原文',
  `html_content` MEDIUMTEXT COMMENT '渲染后的 HTML',
  `mood` VARCHAR(100) COMMENT '心情',
  `cover` VARCHAR(500) COMMENT '封面图 URL',
  `date` DATETIME NOT NULL COMMENT '发布日期',
  `tags` JSON COMMENT '标签数组',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_chatters_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='杂谈表';

-- -------------------------------------------
-- 动态表 (moments)
-- -------------------------------------------
CREATE TABLE `moments` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(200) NOT NULL UNIQUE,
  `content` MEDIUMTEXT NOT NULL COMMENT 'Markdown 原文',
  `html_content` MEDIUMTEXT COMMENT '渲染后的 HTML',
  `date` DATETIME NOT NULL COMMENT '发布日期',
  `images` JSON COMMENT '图片数组',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_moments_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态表';

-- -------------------------------------------
-- 项目表 (projects)
-- -------------------------------------------
CREATE TABLE `projects` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `project_id` VARCHAR(100) NOT NULL UNIQUE COMMENT '项目标识',
  `name` VARCHAR(200) NOT NULL COMMENT '项目名称',
  `description` TEXT COMMENT '项目描述',
  `icon` VARCHAR(10) COMMENT '图标 Emoji',
  `github_url` VARCHAR(500) COMMENT 'GitHub 链接',
  `tags` JSON COMMENT '标签数组',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目表';

-- -------------------------------------------
-- 友链表 (friends)
-- -------------------------------------------
CREATE TABLE `friends` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `friend_id` VARCHAR(100) NOT NULL UNIQUE,
  `name` VARCHAR(200) NOT NULL COMMENT '友链名称',
  `url` VARCHAR(500) NOT NULL COMMENT '友链链接',
  `description` TEXT COMMENT '友链描述',
  `avatar` VARCHAR(500) COMMENT '头像 URL',
  `theme_color` VARCHAR(50) COMMENT '主题色',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='友链表';

-- -------------------------------------------
-- 相册表 (albums)
-- -------------------------------------------
CREATE TABLE `albums` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `album_id` VARCHAR(100) NOT NULL UNIQUE,
  `title` VARCHAR(200) NOT NULL COMMENT '相册标题',
  `description` TEXT COMMENT '相册描述',
  `cover` VARCHAR(500) COMMENT '封面 URL',
  `date` DATETIME COMMENT '日期',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='相册表';

-- -------------------------------------------
-- 照片表 (photos)
-- -------------------------------------------
CREATE TABLE `photos` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `album_id` BIGINT NOT NULL COMMENT '相册 ID',
  `url` VARCHAR(500) NOT NULL COMMENT '图片 URL',
  `caption` VARCHAR(500) COMMENT '图片说明',
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='照片表';

-- -------------------------------------------
-- 标签表 (tags)
-- -------------------------------------------
CREATE TABLE `tags` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE COMMENT '标签名',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签表';

-- -------------------------------------------
-- 文章-标签关联表
-- -------------------------------------------
CREATE TABLE `post_tags` (
  `post_id` BIGINT NOT NULL,
  `tag_id` BIGINT NOT NULL,
  PRIMARY KEY (`post_id`, `tag_id`),
  FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章标签关联表';

-- -------------------------------------------
-- 评论表 (comments)
-- -------------------------------------------
CREATE TABLE `comments` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `post_id` BIGINT COMMENT '关联文章 ID',
  `chatter_id` BIGINT COMMENT '关联杂谈 ID',
  `moment_id` BIGINT COMMENT '关联动态 ID',
  `author` VARCHAR(100) NOT NULL COMMENT '评论者',
  `email` VARCHAR(200) COMMENT '邮箱',
  `content` TEXT NOT NULL COMMENT '评论内容',
  `avatar` VARCHAR(500) COMMENT '头像',
  `status` VARCHAR(20) DEFAULT 'APPROVED' COMMENT '状态：PENDING, APPROVED, REJECTED',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_comments_post` (`post_id`),
  INDEX `idx_comments_chatter` (`chatter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表';

-- -------------------------------------------
-- 站点配置表 (site_config)
-- -------------------------------------------
CREATE TABLE `site_config` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `config_key` VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
  `config_value` TEXT COMMENT '配置值（JSON 或文本）',
  `description` VARCHAR(500) COMMENT '配置说明',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站点配置表';

-- 插入默认站点配置
INSERT INTO `site_config` (`config_key`, `config_value`, `description`) VALUES
('site_title', 'YeLuo / 云端小屋', '网站标题'),
('author_name', 'YeLuo', '博主名称'),
('author_bio', '写代码，也拍照片。把项目、音乐和日常里值得留下的片段，收进同一片海。', '博主简介'),
('avatar_url', 'https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg', '头像 URL'),
('favicon_url', 'https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg', 'Favicon URL'),
('default_post_cover', 'https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg', '默认文章封面'),
('photo_wall_image', 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg', '影像档案预览图'),
('chatter_title', '海面杂谈', '碎片模块标题'),
('chatter_description', '代码、照片、音乐与日常的碎片记录', '碎片模块描述'),
('social_github', 'https://github.com/zibaicai', 'GitHub 链接'),
('social_email', '<redacted>', '邮箱'),
('build_date', '2026-03-23T00:00:00', '建站日期');

-- ============================================
-- 示例数据（可删除）
-- ============================================

-- 示例文章
INSERT INTO `posts` (`slug`, `title`, `description`, `content`, `cover`, `date`, `status`) VALUES
('welcome-to-baicaiblogs', '把第一束光留在这里', '一个用来存放文字、影像和未完成想法的地方。', '# 把第一束光留在这里\n\n这是一个由 **Spring Boot + Next.js** 驱动的个人档案站。\n\n## 这里会有什么\n\n- 写过的代码与项目\n- 拍下的照片\n- 一些没写成长文的碎片\n\n> 海面每天都在换颜色，记录也是。', 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg', '2026-08-12 10:00:00', 'PUBLISHED');

-- 示例标签
INSERT INTO `tags` (`name`) VALUES
('Java'), ('Spring Boot'), ('MySQL'), ('Next.js'), ('React');

-- 关联文章标签
INSERT INTO `post_tags` (`post_id`, `tag_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5);

-- 示例碎片
INSERT INTO `chatters` (`slug`, `title`, `content`, `mood`, `cover`, `date`, `tags`) VALUES
('first-chatter', '第一片潮汐', '今天把新的首页、相册和鲸鱼娘都放进了同一片海。', '平静', 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg', '2026-08-12 11:00:00', '["日常", "记录"]');

-- 示例项目
INSERT INTO `projects` (`project_id`, `name`, `description`, `icon`, `github_url`, `tags`, `sort_order`) VALUES
('proj_001', 'Tide Archive', '把文章、影像、音乐与项目收进同一片海的个人档案站。', '🌊', 'https://github.com/zibaicai', '["Next.js", "Spring Boot", "Archive"]', 1);

-- 示例友链
INSERT INTO `friends` (`friend_id`, `name`, `url`, `description`, `avatar`, `theme_color`, `sort_order`) VALUES
('tide-neighbor', '潮汐观测站', 'https://www.zibaicai.cn/', '一个同样在记录光、代码与日常的地方。', 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg', 'rgba(16, 185, 129, 0.5)', 1);

-- 示例相册
INSERT INTO `albums` (`album_id`, `title`, `description`, `cover`, `date`, `sort_order`) VALUES
('album_001', '旅行日记', '记录旅途中被光照到的地方。', 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg', '2026-07-01', 1);

-- 示例照片
INSERT INTO `photos` (`album_id`, `url`, `caption`, `sort_order`) VALUES
(1, 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg', '潮汐与风 1', 1),
(1, 'https://bu.dusays.com/2026/03/24/69c26fe4acdb5.jpg', '潮汐与风 2', 2);
