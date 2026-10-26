#!/usr/bin/env node
/**
 * 白菜博客本地开发一键启动
 *
 * 用法：node start.mjs
 *
 * 做四件事：
 *   1. 环境自检（node / npm / java / MySQL 3306）
 *   2. 后端：优先 mvn spring-boot:run；没有 Maven 就用 target 下现成 jar；都没有则提示用 IDEA 启动
 *   3. C 端 apps/web   → http://localhost:3001（新窗口）
 *   4. 管理端 apps/admin → http://localhost:5173（新窗口）
 *
 * 某个端口已被占用时自动跳过对应启动项（说明已经在跑了）。
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const WEB_DIR = join(ROOT, "apps", "web");
const ADMIN_DIR = join(ROOT, "apps", "admin");
const BACKEND_DIR = join(ROOT, "my-blog-backend");
const BACKEND_JAR = join(BACKEND_DIR, "target", "my-blog-backend-1.0.0.jar");

const C = { g: "\x1b[32m", r: "\x1b[31m", y: "\x1b[33m", b: "\x1b[36m", d: "\x1b[2m", x: "\x1b[0m" };
const ok = (m) => console.log(`${C.g}✓${C.x} ${m}`);
const warn = (m) => console.log(`${C.y}!${C.x} ${m}`);
const fail = (m) => console.log(`${C.r}✗${C.x} ${m}`);
const step = (t) => console.log(`\n${C.b}━━ ${t} ━━${C.x}`);

/** 探测本机端口是否已被监听（1.5 秒超时） */
function portOpen(port) {
  return new Promise((resolve) => {
    const s = net.createConnection({ port, host: "127.0.0.1" });
    const done = (v) => {
      s.destroy();
      resolve(v);
    };
    s.setTimeout(1500);
    s.on("connect", () => done(true));
    s.on("timeout", () => done(false));
    s.on("error", () => done(false));
  });
}

function cmdOut(command) {
  const r = spawnSync("cmd.exe", ["/c", command], { encoding: "utf8", windowsVerbatimArguments: true });
  return r.status === 0;
}

/** 新开一个 cmd 窗口跑长驻命令 */
function openWindow(title, cwd, command) {
  spawn("cmd.exe", ["/c", `start "${title}" /D "${cwd}" cmd /k ${command}`], {
    shell: false,
    detached: false,
    stdio: "ignore",
  });
}

async function main() {
  console.log(`${C.b}🥬 白菜博客本地开发启动${C.x}`);

  // 1. 环境自检
  step("[1/4] 环境自检");
  let missing = false;
  if (cmdOut("node -v")) ok(`node ${spawnSync("node", ["-v"], { encoding: "utf8" }).stdout.trim()}`);
  else (fail("未找到 node"), (missing = true));
  if (cmdOut("npm -v")) ok("npm 可用");
  else (fail("未找到 npm"), (missing = true));
  if (cmdOut("java -version")) ok("java 可用");
  else (fail("未找到 java（后端需要 JDK 17+）"), (missing = true));

  const mysqlUp = await portOpen(3306);
  if (mysqlUp) ok("MySQL 3306 在线");
  else warn("MySQL 3306 未监听 —— 后端起来后连不上数据库（Docker/服务没启动？）");

  if (missing) {
    fail("缺少必要环境，退出。");
    process.exit(1);
  }

  // 2. 后端
  step("[2/4] 后端 (8080)");
  if (await portOpen(8080)) {
    ok("8080 已有服务在跑，跳过后端启动");
  } else if (cmdOut("mvn -v")) {
    openWindow("白菜-后端", BACKEND_DIR, "mvn spring-boot:run");
    ok("已在新窗口用 mvn spring-boot:run 启动（首次编译要等一会）");
  } else if (existsSync(BACKEND_JAR)) {
    warn("本机没有 mvn，改用 target 里的现成 jar（注意：可能是旧代码打的包）");
    openWindow("白菜-后端", BACKEND_DIR, `java -jar target\\my-blog-backend-1.0.0.jar`);
    ok("已在新窗口用 java -jar 启动");
  } else {
    warn("既没有 mvn 也没有现成 jar：请用 IDEA 启动 MyBlogApplication，其余前端不受影响");
  }

  // 3. C 端
  step("[3/4] C 端 apps/web (3001)");
  if (await portOpen(3001)) {
    ok("3001 已有服务在跑，跳过");
  } else {
    if (!existsSync(join(WEB_DIR, "node_modules"))) {
      console.log(`  ${C.d}首次运行，安装依赖中（几分钟）...${C.x}`);
      const r = spawnSync("cmd.exe", ["/c", "npm install --no-audit --no-fund"], {
        cwd: WEB_DIR,
        stdio: "inherit",
      });
      if (r.status !== 0) {
        fail("apps/web 依赖安装失败，请手动查看");
        process.exit(1);
      }
    }
    openWindow("白菜-C端", WEB_DIR, "npm run dev");
    ok("已在新窗口启动 npm run dev");
  }

  // 4. 管理端
  step("[4/4] 管理端 apps/admin (5173)");
  if (await portOpen(5173)) {
    ok("5173 已有服务在跑，跳过");
  } else {
    if (!existsSync(join(ADMIN_DIR, "node_modules"))) {
      console.log(`  ${C.d}首次运行，安装依赖中（几分钟）...${C.x}`);
      const r = spawnSync("cmd.exe", ["/c", "npm install --no-audit --no-fund"], {
        cwd: ADMIN_DIR,
        stdio: "inherit",
      });
      if (r.status !== 0) {
        fail("apps/admin 依赖安装失败，请手动查看");
        process.exit(1);
      }
    }
    openWindow("白菜-管理端", ADMIN_DIR, "npm run dev");
    ok("已在新窗口启动 npm run dev");
  }

  say(`
${C.g}━━ 启动指令已发出 ━━${C.x}
  C 端    ${C.b}http://localhost:3001${C.x}
  管理端  ${C.b}http://localhost:5173${C.x}
  后端    ${C.b}http://localhost:8080/api${C.x}
${C.d}各服务在独立窗口运行，关窗即停。首次启动Next.js编译较慢，稍等片刻再刷新。${C.x}
`);
}

main().catch((e) => {
  fail(e.message);
  process.exit(1);
});
