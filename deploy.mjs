#!/usr/bin/env node
/**
 * 白菜博客一键部署脚本
 *
 * 用法：
 *   node deploy.mjs setup            # 一次性：服务器克隆仓库 + 环境自检
 *   node deploy.mjs status           # 只读：查看服务器当前发布状态
 *   node deploy.mjs web              # 发布 C 端（apps/web → baicai-public）
 *   node deploy.mjs admin            # 发布管理端（apps/admin → /var/www/admin）
 *   node deploy.mjs backend          # 发布后端（上传 jar → 重启 baicai-backend）
 *   node deploy.mjs all              # 依次发布 web + admin + backend
 *   node deploy.mjs rollback web     # 回滚 C 端到上一个 release（--to 指定版本）
 *   node deploy.mjs rollback admin   # 回滚管理端到最近一次备份
 *
 * 可选参数：
 *   --branch <name>   指定部署分支（默认读 deploy.config.json 的 repo.branch）
 *   --to <release>    rollback web 时指定目标 release
 *   --allow-dirty     本地有未提交改动时仍然继续（不推荐）
 *   --yes             跳过所有确认提示
 *
 * 所有服务器/目录/服务名配置集中在 deploy.config.json，改环境只改配置。
 */

import { spawn, spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";

const ROOT = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const CFG = require(join(ROOT, "deploy.config.json"));
const DRY_RUN = process.argv.includes("--dry-run");

// ---------- 输出工具 ----------
const C = { g: "\x1b[32m", r: "\x1b[31m", y: "\x1b[33m", b: "\x1b[36m", d: "\x1b[2m", x: "\x1b[0m" };
const say = (msg = "") => console.log(msg);
const ok = (msg) => say(`${C.g}✓${C.x} ${msg}`);
const warn = (msg) => say(`${C.y}!${C.x} ${msg}`);
const fail = (msg) => say(`${C.r}✗ ${msg}${C.x}`);
const step = (title) => say(`\n${C.b}━━ ${title} ━━${C.x}`);

function die(msg) {
  fail(msg);
  process.exit(1);
}

async function confirm(question, skipIfYes) {
  if (skipIfYes) return;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = (await rl.question(`${C.y}${question} [y/N]${C.x} `)).trim().toLowerCase();
  rl.close();
  if (ans !== "y" && ans !== "yes") die("已取消。");
}

// ---------- 本地 / 远程命令 ----------
function local(cmd, args, opts = {}) {
  if (DRY_RUN) {
    say(`[dry-run] ${cmd} ${args.join(" ")}`);
    return;
  }
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", shell: false, ...opts });
  if (r.status !== 0) die(`本地命令失败：${cmd} ${args.join(" ")}`);
}

function localOut(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", shell: false });
  return { code: r.status, out: (r.stdout || "").trim(), err: (r.stderr || "").trim() };
}

function remote(script, { quiet = false } = {}) {
  if (DRY_RUN) {
    if (!quiet) say(`[dry-run] ssh ${CFG.server.user}@${CFG.server.host}\n${script}`);
    return { code: 0, out: "", err: "" };
  }
  const args = [...CFG.server.sshOpts, `${CFG.server.user}@${CFG.server.host}`, script];
  const r = spawnSync("ssh", args, quiet ? { encoding: "utf8" } : { stdio: "inherit" });
  if (quiet) return { code: r.status, out: (r.stdout || "").trim(), err: (r.stderr || "").trim() };
  if (r.status !== 0) die(`远程命令失败（exit ${r.status}），请查看上方服务器输出。`);
  return null;
}

function remoteOut(script) {
  return remote(script, { quiet: true });
}

function scp(localPath, remotePath) {
  if (DRY_RUN) {
    say(`[dry-run] scp ${localPath} → ${CFG.server.user}@${CFG.server.host}:${remotePath}`);
    return;
  }
  const args = [...CFG.server.sshOpts, localPath, `${CFG.server.user}@${CFG.server.host}:${remotePath}`];
  const r = spawnSync("scp", args, { stdio: "inherit", shell: false });
  if (r.status !== 0) die(`scp 上传失败：${localPath}`);
}

// ---------- 通用子流程 ----------
function branch() {
  const i = process.argv.indexOf("--branch");
  return i > -1 ? process.argv[i + 1] : CFG.repo.branch;
}

/** 确保本地代码已推送到远端，服务器拉取指定分支 */
function syncRepo(target) {
  const br = branch();
  step(`[同步代码] 分支 ${br}`);

  const st = localOut("git", ["status", "--porcelain=v1"]);
  if (st.code !== 0) die("git status 失败，请确认当前目录是仓库根目录。");
  const dirty = st.out.split("\n").filter(Boolean);
  if (dirty.length) {
    if (!process.argv.includes("--allow-dirty")) {
      say(dirty.map((l) => `  ${C.y}${l}${C.x}`).join("\n"));
      die("本地有未提交或未跟踪文件（这些内容不会出现在服务器构建里）。先提交，或加 --allow-dirty 强行继续。");
    }
    warn("带 --allow-dirty 继续发布，未提交改动不会上线。");
  }

  local("git", ["push", "origin", br]);
  ok("代码已推送到 GitHub");

  remote(
    `set -e; cd ${CFG.repo.remotePath}; ` +
      // 显式 refspec：shallow clone 下 fetch 分支名不会自动更新 origin/<br> 引用，必须写全
      `git fetch origin +refs/heads/${br}:refs/remotes/origin/${br}; ` +
      `git checkout -B ${br} origin/${br}; ` +
      `echo "服务器代码: $(git log -1 --format='%h %s')"`
  );
  ok(`${target} 服务器代码已更新到 ${br} 最新提交`);
}

/** 本地外部验收 */
function verifyUrl(url) {
  if (DRY_RUN) {
    say(`[dry-run] verify ${url}`);
    return;
  }
  const r = spawnSync("curl", ["-skfI", "-o", "NUL", "-w", "%{http_code}", url, "--max-time", "15"], {
    encoding: "utf8",
    shell: false,
  });
  const code = (r.stdout || "").trim();
  if ((r.status === 0 && code.startsWith("2")) || code.startsWith("3")) {
    ok(`外网验收 ${url} → HTTP ${code}`);
  } else {
    warn(`外网验收 ${url} 未通过（HTTP ${code || "无响应"}），请浏览器再确认。`);
  }
}

// ---------- setup ----------
function cmdSetup() {
  step(`[setup] 服务器环境初始化（${CFG.server.host}）`);
  remote(
    `set -e; ` +
      `echo "node: $(node -v)  npm: $(npm -v)  git: $(git --version | awk '{print $3}')"; ` +
      `if [ -d ${CFG.repo.remotePath}/.git ]; then ` +
      `  echo "仓库已存在: ${CFG.repo.remotePath}"; ` +
      `else ` +
      `  git clone --depth 1 ${CFG.repo.url} ${CFG.repo.remotePath}; ` +
      `  echo "已克隆到 ${CFG.repo.remotePath}"; ` +
      `fi`
  );
  ok("setup 完成。之后即可运行 node deploy.mjs web / admin");
}

// ---------- status ----------
function cmdStatus() {
  step(`[status] ${CFG.server.host} 当前发布状态`);
  const { code, out, err } = remoteOut(
    [
      `echo "── C 端 (baicai-public)"`,
      `readlink ${CFG.web.currentLink} || true`,
      `ls -1 ${CFG.web.releasesDir} 2>/dev/null | sort | tail -5`,
      `systemctl is-active ${CFG.web.service} | sed 's/^/服务状态: /'`,
      `echo "── 管理端 (/var/www/admin)"`,
      `stat -c '最后更新: %y' ${CFG.admin.wwwDir}/index.html 2>/dev/null || true`,
      `echo "── 后端 (baicai-backend)"`,
      `stat -c 'jar 时间: %y' ${CFG.backend.remoteJar} 2>/dev/null || true`,
      `systemctl is-active ${CFG.backend.service} | sed 's/^/服务状态: /'`,
      `echo "── 磁盘"`,
      `df -h / | tail -1`,
    ].join("; ")
  );
  if (code !== 0) die(`连接服务器失败：${err}`);
  say(out);
}

// ---------- web ----------
function cmdWeb() {
  const required = [
    "apps/web/public/avatar.jpg",
    "apps/web/public/bg-1.webp",
    "apps/web/public/bg-2.webp",
    "apps/web/public/bg-3.webp",
    "apps/web/public/bg-4.webp",
    "apps/web/public/bg-5.webp",
    "apps/web/public/favicon.ico",
  ];
  const missing = required.filter((file) => !existsSync(join(ROOT, file)));
  if (missing.length) die(`缺少必需静态资源：\n${missing.join("\n")}`);
  syncRepo("C 端");
  step("[构建发布] C 端 apps/web → baicai-public");
  const w = CFG.web;
  remote(
    `set -e; ` +
      `cd ${CFG.repo.remotePath}/${w.dir}; ` +
      `echo "npm ci 开始（可能需要几分钟）..."; npm ci --no-audit --no-fund; ` +
      `npm run build; ` +
      `TS=$(date +%Y%m%d-%H%M); REL=${w.releasesDir}/$TS; ` +
      `mkdir -p "$REL"; ` +
      `cp -a .next/standalone/. "$REL"/; ` +
      `mkdir -p "$REL/.next"; cp -a .next/static "$REL/.next/static"; ` +
      `if [ -d public ]; then cp -a public "$REL/public"; fi; ` +
      `chown -R ${w.owner} "$REL"; ` +
      `ln -sfn "$REL" ${w.currentLink}; ` +
      `systemctl restart ${w.service}; sleep 3; ` +
      `curl -sfI http://127.0.0.1:${w.port}/ > /dev/null && echo "本机 3001 探活正常"; ` +
      `echo "已发布 release: $REL"`
  );
  verifyUrl(w.url + "/");
  for (const path of w.healthPaths || []) verifyUrl(w.url + path);
  ok("C 端发布完成");
}

// ---------- admin ----------
async function cmdAdmin() {
  await confirm(`即将替换线上 ${CFG.admin.wwwDir}（旧目录会自动备份）。继续？`, process.argv.includes("--yes"));
  syncRepo("管理端");
  step("[构建发布] 管理端 apps/admin → /var/www/admin");
  const a = CFG.admin;
  remote(
    `set -e; ` +
      `cd ${CFG.repo.remotePath}/${a.dir}; ` +
      `echo "npm ci 开始..."; npm ci --no-audit --no-fund; ` +
      `npm run build; ` +
      `TS=$(date +%Y%m%d-%H%M%S); BAK=${a.wwwDir}.bak.$TS; ` +
      `if [ -d ${a.wwwDir} ]; then cp -a ${a.wwwDir} "$BAK"; else BAK="(首次部署，无旧目录)"; fi; ` +
      `rm -rf ${a.wwwDir}.new; mkdir -p ${a.wwwDir}.new; ` +
      `tar -C dist -cf - . | tar -C ${a.wwwDir}.new -xf -; ` +
      `chmod -R u+rwX,go+rX ${a.wwwDir}.new; chown -R www-data:www-data ${a.wwwDir}.new; ` +
      `rm -rf ${a.wwwDir}; mv ${a.wwwDir}.new ${a.wwwDir}; ` +
      `curl -skfI https://${a.url.replace(/^https:\/\//, "")}/ > /dev/null && echo "管理端探活正常"; ` +
      `echo "旧版备份: $BAK"`
  );
  verifyUrl(a.url + "/");
  ok("管理端发布完成");
}

// ---------- backend ----------
function cmdBackend() {
  const b = CFG.backend;
  const jarPath = join(ROOT, b.localJar);
  if (!existsSync(jarPath)) {
    die(
      `未找到本地 jar：${b.localJar}\n` +
        `  本机没有 Maven，请先在 IDEA 里打包（Maven 面板 → my-blog-backend → Lifecycle → package），\n` +
        `  或用其他方式生成 jar 后重试。`
    );
  }
  step("[上传] 后端 jar");
  say(`  ${C.d}${b.localJar} → ${CFG.server.host}:${b.remoteJar}${C.x}`);
  scp(b.localJar, `${b.remoteJar}.upload.tmp`);

  step("[发布] 后端服务");
  remote(
    `set -e; ` +
      `mkdir -p ${CFG.backupDir}; ` +
      `TS=$(date +%Y%m%d-%H%M%S); ` +
      `cp -a ${b.remoteJar} ${CFG.backupDir}/$(basename ${b.remoteJar}).bak-$TS; ` +
      `mv ${b.remoteJar}.upload.tmp ${b.remoteJar}; ` +
      `systemctl restart ${b.service}; sleep 6; ` +
      `curl -sf http://127.0.0.1:${b.port}${b.healthPath} > /dev/null && echo "后端探活正常"; ` +
      `echo "旧 jar 已备份: ${CFG.backupDir}/$(basename ${b.remoteJar}).bak-$TS"`
  );
  verifyUrl(b.url + b.healthPath);
  ok("后端发布完成");
}

// ---------- rollback ----------
async function cmdRollback(target) {
  if (target === "web") {
    const w = CFG.web;
    const { out } = remoteOut(
      `ls -1 ${w.releasesDir} | sort; echo ---; readlink ${w.currentLink}`
    );
    const [listStr, curRaw] = out.split("---");
    const releases = listStr.trim().split("\n").filter(Boolean);
    const cur = (curRaw || "").trim().split("/").pop();
    if (releases.length < 2) die("只有一个 release，无处可回。");
    const idx = releases.indexOf(cur);
    const toFlag = process.argv.indexOf("--to");
    const target_release = toFlag > -1 ? process.argv[toFlag + 1] : releases[Math.max(0, idx - 1)];
    if (!releases.includes(target_release)) die(`找不到 release：${target_release}`);
    if (target_release === cur) die("当前已在该版本。");

    say(`当前: ${C.y}${cur}${C.x}  →  回滚到: ${C.g}${target_release}${C.x}`);
    await confirm("确认回滚 C 端？", process.argv.includes("--yes"));
    remote(
      `set -e; ln -sfn ${w.releasesDir}/${target_release} ${w.currentLink}; ` +
        `systemctl restart ${w.service}; sleep 3; ` +
        `curl -sfI http://127.0.0.1:${w.port}/ > /dev/null && echo "本机 3001 探活正常"`
    );
    verifyUrl(w.url + "/");
    ok("C 端已回滚（release 目录都保留着，可再次切换）");
  } else if (target === "admin") {
    const a = CFG.admin;
    const { out } = remoteOut(`ls -1dt ${a.wwwDir}.bak.* 2>/dev/null | head -5`);
    const baks = out.trim().split("\n").filter(Boolean);
    if (!baks.length) die("没有任何管理端备份可恢复。");
    say("可用备份（近 5 个）：");
    baks.forEach((b, i) => say(`  ${i === 0 ? C.g + "*" : " "}${C.x} ${b}`));
    await confirm(`恢复到最近的备份 ${baks[0]} ？`, process.argv.includes("--yes"));
    remote(
      `set -e; rm -rf ${a.wwwDir}; cp -a ${baks[0]} ${a.wwwDir}; ` +
        `curl -skfI https://${a.url.replace(/^https:\/\//, "")}/ > /dev/null && echo "管理端探活正常"`
    );
    verifyUrl(a.url + "/");
    ok("管理端已回滚");
  } else if (target === "backend") {
    const b = CFG.backend;
    const base = b.remoteJar.split("/").pop();
    const { out } = remoteOut(`ls -1dt ${CFG.backupDir}/${base}.bak-* 2>/dev/null | head -5`);
    const backups = out.trim().split("\n").filter(Boolean);
    if (!backups.length) die("没有任何后端 jar 备份可恢复。");
    say("可用备份（近 5 个）：");
    backups.forEach((backup, index) => say(`  ${index === 0 ? C.g + "*" : " "}${C.x} ${backup}`));
    await confirm(`恢复到最近的备份 ${backups[0]} ？`, process.argv.includes("--yes"));
    remote(
      `set -e; cp -a ${backups[0]} ${b.remoteJar}; systemctl restart ${b.service}; sleep 6; ` +
        `curl -sf http://127.0.0.1:${b.port}${b.healthPath} > /dev/null && echo "后端探活正常"`
    );
    verifyUrl(b.url + b.healthPath);
    ok("后端已回滚");
  } else {
    die("用法：node deploy.mjs rollback web|admin|backend");
  }
}

// ---------- 入口 ----------
async function main() {
  const cmd = process.argv[2];
  say(`${C.b}🥬 白菜博客部署工具${C.x}  ${C.d}→ ${CFG.server.host}${C.x}`);

  switch (cmd) {
    case "setup":
      cmdSetup();
      break;
    case "status":
      cmdStatus();
      break;
    case "web":
      cmdWeb();
      break;
    case "admin":
      await cmdAdmin();
      break;
    case "backend":
      cmdBackend();
      break;
    case "all":
      say("依次执行：web → admin → backend");
      await confirm("全量发布到线上，继续？", process.argv.includes("--yes"));
      cmdWeb();
      await cmdAdmin();
      cmdBackend();
      break;
    case "rollback":
      await cmdRollback(process.argv[3]);
      break;
    default:
      say(
        [
          "",
          "用法: node deploy.mjs <命令>",
          "",
          "  setup      一次性初始化（服务器克隆仓库）",
          "  status     查看服务器发布状态（只读）",
          "  web        发布 C 端",
          "  admin      发布管理端",
          "  backend    发布后端 jar",
          "  all        全量发布（web+admin+backend）",
          "  rollback web|admin   回滚",
          "",
        ].join("\n")
      );
      process.exit(cmd ? 1 : 0);
  }
  say(`\n${C.g}全部完成 🥬${C.x}`);
}

main().catch((e) => die(e.message));
