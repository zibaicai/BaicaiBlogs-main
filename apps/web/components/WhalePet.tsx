"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Fish, X } from "lucide-react";

type PetState = "idle" | "blink" | "eat" | "sleep" | "thinking";

const EAT_ANIM = "/pet/whale-eat.webp"; // 暂时回滚为静态，等正式动画素材
const FRAMES: Record<"idle" | "blink" | "eat", string> = {
  idle: "/pet/whale-idle.webp",
  blink: "/pet/whale-blink.webp",
  eat: "/pet/whale-eat.webp",
};

const LINES = [
  "200 OK，今天也要好好写代码。",
  "抓到一只在摸鱼的铲屎官。",
  "饭碗见底了，请求补充算力。",
  "我在加载中……其实是在发呆。",
  "这个请求我收下了，返回 200 OK。",
  "摸鱼可以，但记得保存。",
  "今天的 bug 也会变成明天的经验。",
];

const CHAT_REPLIES = [
  "收到，200 OK。先去把手里的事情做完吧。",
  "这个问题有点深，建议先保存一下再继续折腾。",
  "我听见了。虽然只是一只桌宠，但我会在这里陪着你。",
  "先喝口水，再回来解决它。",
  "请求已记录，返回 200 OK。",
];

export default function WhalePet() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [state, setState] = useState<PetState>("idle");
  const [speech, setSpeech] = useState<string | null>(null);
  const [showOk, setShowOk] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isBouncing, setIsBouncing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isEating, setIsEating] = useState(false);
  const [eatRun, setEatRun] = useState(0);
  const [showStars, setShowStars] = useState(false);
  const [showDrool, setShowDrool] = useState(false);
  const [eatReady, setEatReady] = useState(false);

  const speechTimer = useRef<number | null>(null);
  const actionTimer = useRef<number | null>(null);
  const eatTimer = useRef<number | null>(null);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    Object.values(FRAMES).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    const eat = new Image();
    eat.src = EAT_ANIM;
  }, []);

  useEffect(() => {
    return () => {
      if (speechTimer.current) window.clearTimeout(speechTimer.current);
      if (actionTimer.current) window.clearTimeout(actionTimer.current);
      if (eatTimer.current) window.clearTimeout(eatTimer.current);
    };
  }, []);

  const speak = (text: string, duration = 4200) => {
    setSpeech(text);
    if (speechTimer.current) window.clearTimeout(speechTimer.current);
    speechTimer.current = window.setTimeout(() => setSpeech(null), duration);
  };

  const markActive = () => {
    lastActivity.current = Date.now();
    if (state === "sleep") setState("idle");
  };

  const showOkBadge = () => {
    setShowOk(true);
    window.setTimeout(() => setShowOk(false), 1800);
  };

  const handlePet = () => {
    if (isEating) return;
    markActive();
    setState("idle");
    setIsBouncing(true);
    speak(LINES[Math.floor(Math.random() * LINES.length)]);
    showOkBadge();
    window.setTimeout(() => setIsBouncing(false), 480);
  };

  const handleFeed = () => {
    if (isEating || state === "thinking") return;
    markActive();
    setShowInput(false);
    setState("eat");
    setIsEating(true);
    setEatRun((v) => v + 1);
    setShowStars(true);
    setShowDrool(true);
    speak("开饭！这碗算力我先收下了。", 2600);

    if (eatTimer.current) window.clearTimeout(eatTimer.current);
    if (actionTimer.current) window.clearTimeout(actionTimer.current);
    window.setTimeout(() => setShowDrool(false), 720);
    window.setTimeout(() => setShowStars(false), 920);
    eatTimer.current = window.setTimeout(() => {
      setIsEating(false);
      setState("idle");
      showOkBadge();
      speak("吃饱了，200 OK。", 3200);
    }, 3000);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || state === "thinking" || isEating) return;
    const message = inputValue.trim().slice(0, 100);
    setInputValue("");
    setShowInput(false);
    markActive();
    setState("thinking");
    speak("让我想想……", 4000);

    if (actionTimer.current) window.clearTimeout(actionTimer.current);
    actionTimer.current = window.setTimeout(() => {
      const reply = CHAT_REPLIES[Math.floor(Math.random() * CHAT_REPLIES.length)];
      setState("idle");
      speak(`「${message.slice(0, 18)}」\n${reply}`, 6000);
      showOkBadge();
    }, 900);
  };

  useEffect(() => {
    if (!isDesktop) return;
    const timer = window.setInterval(() => {
      if (showInput || isDragging || isBouncing || isEating || state !== "idle") return;
      if (Date.now() - lastActivity.current > 90000) {
        setState("sleep");
        return;
      }
      if (Math.random() < 0.42) {
        setState("blink");
        window.setTimeout(() => setState((current) => (current === "blink" ? "idle" : current)), 220);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isDesktop, showInput, isDragging, isBouncing, isEating, state]);

  if (!isDesktop) return null;

  const frame = state === "eat" ? "eat" : state === "sleep" || state === "blink" ? "blink" : "idle";
  const frameClass =
    state === "sleep"
      ? "whale-sleep"
      : isBouncing
        ? "whale-hop"
        : "whale-bob";

  return (
    <motion.div
      drag
      dragElastic={0.08}
      dragMomentum={false}
      onDragStart={() => {
        setIsDragging(true);
        lastActivity.current = Date.now();
      }}
      onDragEnd={() => {
        setIsDragging(false);
        lastActivity.current = Date.now();
      }}
      whileDrag={{ scale: 1.04, cursor: "grabbing" }}
      className="whale-pet fixed bottom-32 right-8 z-[90] flex w-[180px] cursor-grab flex-col items-center select-none active:cursor-grabbing"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes whale-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes whale-hop {
          0% { transform: translateY(0) scale(1); }
          35% { transform: translateY(-12px) scale(1.03); }
          70% { transform: translateY(2px) scale(0.99); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes whale-sleep {
          0%, 100% { transform: translateY(2px) rotate(-2deg); }
          50% { transform: translateY(4px) rotate(-3deg); }
        }
        .whale-bob { animation: whale-bob 4.8s ease-in-out infinite; }
        .whale-hop { animation: whale-hop 0.46s ease-out; }
        .whale-sleep { animation: whale-sleep 3.8s ease-in-out infinite; filter: brightness(0.88) saturate(0.9); }
        @keyframes whale-star {
          0%, 100% { opacity: 0; transform: scale(0.45) rotate(0deg); }
          35%, 70% { opacity: 1; transform: scale(1.1) rotate(14deg); }
        }
        .whale-star {
          animation: whale-star 0.46s ease-in-out infinite;
          color: #fde68a;
          text-shadow: 0 0 8px rgba(253, 230, 138, 0.9), 0 1px 2px rgba(15, 23, 42, 0.5);
        }
        @keyframes whale-drool {
          0% { opacity: 0; transform: scaleY(0.2); }
          25%, 75% { opacity: 1; transform: scaleY(1); }
          100% { opacity: 0; transform: scaleY(0.8); }
        }
        .whale-drool {
          animation: whale-drool 0.7s ease-in-out infinite;
          transform-origin: top center;
          background: linear-gradient(180deg, rgba(224, 242, 254, 0.4), rgba(125, 211, 252, 0.9));
          box-shadow: 0 0 4px rgba(186, 230, 253, 0.8);
        }
        @media (prefers-reduced-motion: reduce) {
          .whale-bob, .whale-hop, .whale-sleep, .whale-star, .whale-drool { animation: none !important; }
        }
      `}} />

      <div className="relative flex w-full justify-center">
        <AnimatePresence>
          {speech && !showInput && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.94 }}
              className="absolute bottom-full left-1/2 z-30 mb-3 w-max max-w-[250px] -translate-x-1/2 rounded-2xl border border-white/60 bg-white/95 px-4 py-3 text-center text-xs font-bold leading-relaxed text-slate-700 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95 dark:text-slate-200"
            >
              {speech}
              <span className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-white/60 bg-white/95 dark:border-slate-700 dark:bg-slate-800/95" />
            </motion.div>
          )}
        </AnimatePresence>
        {showOk && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-1 top-0 z-30 rounded-full bg-emerald-500 px-2.5 py-1 text-[9px] font-black tracking-widest text-white shadow-lg"
          >
            200 OK
          </motion.span>
        )}
      </div>

      <div className="relative mt-1">
        <div className="absolute -left-10 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              markActive();
              setSpeech(null);
              setShowInput((v) => !v);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/85 text-indigo-500 shadow-md backdrop-blur-md transition-transform hover:scale-110 active:scale-95 dark:border-white/10 dark:bg-slate-800/85"
            title="和小深聊天"
            aria-label="和小深聊天"
          >
            {showInput ? <X size={15} /> : <MessageCircle size={15} />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleFeed();
            }}
            disabled={isEating || state === "thinking"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/85 text-base shadow-md backdrop-blur-md transition-transform hover:scale-110 active:scale-95 disabled:opacity-40 dark:border-white/10 dark:bg-slate-800/85"
            title="喂一碗米饭"
            aria-label="喂一碗米饭"
          >
            <Fish size={15} className="text-sky-500" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (state === "sleep") {
              markActive();
              speak("醒了醒了，200 OK。");
              showOkBadge();
              return;
            }
            handlePet();
          }}
          className="relative block h-[168px] w-[168px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 rounded-2xl"
          aria-label="和鲸鱼娘互动"
        >
          <img
            key={isEating ? "idle" : frame}
            src={FRAMES[isEating ? "idle" : frame]}
            alt="鲸鱼娘桌宠"
            draggable={false}
            className={`h-full w-full object-contain drop-shadow-[0_12px_18px_rgba(15,23,42,0.28)] ${
              isEating ? "" : frameClass
            } ${isEating && eatReady ? "opacity-0" : ""}`}
          />
          {isEating && (
            <img
              key={`eat-${eatRun}`}
              src={EAT_ANIM}
              alt=""
              aria-hidden="true"
              draggable={false}
              onLoad={() => setEatReady(true)}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain drop-shadow-[0_12px_18px_rgba(15,23,42,0.28)]"
            />
          )}
          {showStars && (
            <span className="pointer-events-none absolute inset-0 z-20">
              <span className="whale-star absolute left-2 top-3 text-lg" style={{ animationDelay: "0ms" }}>✦</span>
              <span className="whale-star absolute right-3 top-7 text-sm" style={{ animationDelay: "120ms" }}>✦</span>
              <span className="whale-star absolute left-8 top-12 text-[10px]" style={{ animationDelay: "220ms" }}>✦</span>
            </span>
          )}
          {showDrool && (
            <span className="whale-drool pointer-events-none absolute left-[96px] top-[96px] z-20 h-3 w-[3px] rounded-full" />
          )}
          {state === "sleep" && (
            <span className="pointer-events-none absolute -right-1 -top-2 text-xs font-black text-indigo-300/90">
              z <span className="text-[10px]">z</span> <span className="text-[8px]">z</span>
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showInput && (
          <motion.form
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            onSubmit={handleChatSubmit}
            className="absolute bottom-full left-1/2 z-30 mb-2 flex w-[260px] -translate-x-1/2 items-center rounded-full border border-white/60 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95"
          >
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.slice(0, 100))}
              placeholder="跟小深说点啥..."
              maxLength={100}
              disabled={state === "thinking"}
              className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
            />
            <button
              type="submit"
              disabled={state === "thinking" || !inputValue.trim()}
              className="rounded-full bg-indigo-500 px-3 py-1.5 text-[10px] font-black text-white disabled:opacity-40"
            >
              发送
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
