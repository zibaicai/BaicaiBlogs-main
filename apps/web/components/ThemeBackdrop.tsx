"use client";

import { useSiteConfigContext } from "../context/SiteConfigProvider";
import BackgroundEffects from "./BackgroundEffects";
import BackgroundSlider from "./BackgroundSlider";
import { useTheme } from "./ThemeProvider";

const VIOLET_BACKGROUND = {
  useGradient: false,
  themeColors: ["#a18cd1", "#fbc2eb", "#a1c4fd", "#c2e9fb"],
  bgImages: ["/bg-1.webp", "/bg-2.webp", "/bg-3.webp", "/bg-5.webp"],
};

const OCEAN_FALLBACK = {
  useGradient: false,
  themeColors: ["#1e3a6e", "#3157b7", "#5b8bd0", "#dcebff"],
  bgImages: ["/bg-1.webp", "/bg-2.webp", "/bg-5.webp"],
};

export default function ThemeBackdrop() {
  const { preset } = useTheme();
  const { background } = useSiteConfigContext();

  const presetBackground = preset === "violet" ? VIOLET_BACKGROUND : background || OCEAN_FALLBACK;
  const images = preset === "violet" ? VIOLET_BACKGROUND.bgImages : presetBackground.bgImages || OCEAN_FALLBACK.bgImages;
  const colors = preset === "violet" ? VIOLET_BACKGROUND.themeColors : presetBackground.themeColors || OCEAN_FALLBACK.themeColors;
  const gradient = colors.join(", ");
  const showSlider = preset === "violet" ? true : !presetBackground.useGradient;

  return (
    <div className="site-backdrop fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
      {showSlider && <BackgroundSlider images={images} />}
      <div className="absolute inset-0 z-[-9] bg-white/30 dark:bg-slate-900/40 backdrop-blur-md transition-colors duration-1000" />
      <div
        className="site-gradient absolute inset-0 z-[-8] opacity-40 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen transition-opacity duration-1000 transform-gpu"
        style={{
          background: `linear-gradient(-45deg, ${gradient})`,
          backgroundSize: "400% 400%",
          animation: "gradientMove 15s ease infinite",
        }}
      />
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-white/40 mix-blend-overlay blur-[100px] dark:bg-indigo-900/20 z-[-7]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-400/30 mix-blend-overlay blur-[100px] dark:bg-purple-900/30 z-[-7]" />
      <div className="bg-effects-wrapper transition-opacity duration-1000">
        <BackgroundEffects />
      </div>
    </div>
  );
}
