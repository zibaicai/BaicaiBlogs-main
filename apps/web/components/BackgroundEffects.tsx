"use client";

import { useTheme } from "./ThemeProvider";
import Fireflies from "./Fireflies";
import SakuraGL from "./SakuraGL";
import { SakuraBacklight, SakuraGlare } from "./SakuraLights";

/**
 * 背景特效的分发器。
 *
 * 夜间：萤火虫
 * 日间：樱花层 + 它自己的两个光源（背光 / 眩光）
 *
 * 樱花这一组是「按需挂载」而不是「切换透明度」：
 * 切到夜间时组件直接卸载，WebGL context、离屏纹理、两个光源 div 一起销毁；
 * 切回日间重新初始化。这样两套特效互不干扰，也不会在夜间空跑 GPU。
 */
export default function BackgroundEffects() {
  const { isDark } = useTheme();

  return (
    <>
      <style>{`
        @keyframes sakuraLayerIn { from { opacity: 0 } to { opacity: 1 } }
        .sakura-layer { animation: sakuraLayerIn 900ms ease both; }
      `}</style>

      {isDark ? (
        <div className="transition-opacity duration-1000 opacity-100">
          <Fireflies />
        </div>
      ) : (
        <div className="sakura-layer">
          <SakuraBacklight />
          <SakuraGL />
          <SakuraGlare />
        </div>
      )}

    </>
  );
}
