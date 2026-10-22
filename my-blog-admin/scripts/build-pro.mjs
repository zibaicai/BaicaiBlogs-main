/**
 * 一键生产打包脚本（对应部署手册第一步 1.2~1.5）
 *
 * 完整流程：
 *   1. 清理 .next 旧产物（避免 Turbopack/缓存干扰）
 *   2. next build --webpack（禁用 Turbopack，避免 next/font 字体 bug）
 *   3. 复制 .next/static → .next/standalone/.next/static（standalone 默认不含静态资源）
 *   4. 复制 public → .next/standalone/public
 *   5. 复制 .env.production → .next/standalone/.env.production
 *   6. 从 standalone 目录打包 deploy.tar.gz（解压后直接是文件，不带外壳目录）
 *
 * 用法：npm run build-pro
 * 产物：项目根目录下的 deploy.tar.gz，scp 上传到服务器解压即可
 */

import { execSync } from 'node:child_process';
import { existsSync, rmSync, cpSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const NEXT_DIR = resolve(root, '.next');
const STANDALONE_DIR = resolve(NEXT_DIR, 'standalone');
const STANDALONE_NEXT = resolve(STANDALONE_DIR, '.next');
const STATIC_DIR = resolve(NEXT_DIR, 'static');
const PUBLIC_DIR = resolve(root, 'public');
const ENV_FILE = resolve(root, '.env.production');
const OUTPUT_TAR = resolve(root, 'deploy.tar.gz');

// 统一日志输出
function log(msg) {
  console.log(`\x1b[36m[build-pro]\x1b[0m ${msg}`);
}

// ============================================================
// 1. 清理旧产物
// ============================================================
log('清理 .next 旧产物...');
if (existsSync(NEXT_DIR)) {
  rmSync(NEXT_DIR, { recursive: true, force: true });
}

// ============================================================
// 2. 构建（webpack 模式）
// ============================================================
log('开始构建（next build --webpack）...');
execSync('npx next build --webpack', { stdio: 'inherit', cwd: root });
log('构建完成');

// ============================================================
// 3. 复制 static 到 standalone/.next/static
//    standalone 模式默认不含静态资源，必须手动复制
// ============================================================
log('复制 .next/static → standalone/.next/static ...');
const standaloneStatic = resolve(STANDALONE_NEXT, 'static');
if (!existsSync(STANDALONE_NEXT)) {
  mkdirSync(STANDALONE_NEXT, { recursive: true });
}
cpSync(STATIC_DIR, standaloneStatic, { recursive: true });

// ============================================================
// 4. 复制 public 到 standalone/public
//    standalone 模式默认不含 public 目录，必须手动复制
// ============================================================
log('复制 public → standalone/public ...');
cpSync(PUBLIC_DIR, resolve(STANDALONE_DIR, 'public'), { recursive: true });

// ============================================================
// 5. 复制 .env.production 到 standalone/
//    运行时读取的环境变量文件（NEXT_PUBLIC_* 已在构建时固化，
//    此文件供服务端运行时读取非 NEXT_PUBLIC_ 变量）
// ============================================================
log('复制 .env.production → standalone/.env.production ...');
cpSync(ENV_FILE, resolve(STANDALONE_DIR, '.env.production'));

// ============================================================
// 6. 打包 deploy.tar.gz
//    从 standalone 目录打包（解压后直接是文件，不带 standalone/ 外壳）
// ============================================================
log('打包 deploy.tar.gz ...');
if (existsSync(OUTPUT_TAR)) {
  rmSync(OUTPUT_TAR, { force: true });
}
// Windows 10+ 和 Linux 均自带 tar 命令
execSync(`tar -czf "${OUTPUT_TAR}" -C "${STANDALONE_DIR}" .`, { stdio: 'inherit' });

// 验证产物
if (existsSync(OUTPUT_TAR)) {
  const stats = statSync(OUTPUT_TAR);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  log(`\x1b[32m✓ 打包完成: deploy.tar.gz (${sizeMB} MB)\x1b[0m`);
  log(`  产物路径: ${OUTPUT_TAR}`);
  log('  下一步: scp deploy.tar.gz root@8.153.164.215:/opt/');
} else {
  log('\x1b[31m✗ 打包失败：deploy.tar.gz 未生成\x1b[0m');
  process.exit(1);
}
