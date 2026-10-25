"use client";

/**
 * 右上角的两个光源（纯 CSS，不碰着色器）
 *
 * - SakuraBacklight：放在樱花层「下面」，做逆光——花瓣被后面的亮场衬成剪影，
 *   边缘因为花瓣本身是半透明的，会自然透出一圈亮边。
 * - SakuraGlare：放在樱花层「上面」，做镜头眩光/空气散射。
 *
 * 关键点：光源的「核」必须落在视口内，否则只吃到梯度外圈，亮度几乎看不出变化。
 * 之前把元素推到 -20vh / -14vw，核在屏幕外，整块只亮了 5%。
 */

// 位置都用百分比，铺满整屏，让核稳定落在右上角内侧
const CORE_AT = "circle at 86% 9%";

const BACK_LIGHT = `
  radial-gradient(${CORE_AT}, rgba(255,249,240,0.78) 0%, rgba(255,246,236,0.52) 3.2%, rgba(255,243,232,0.24) 9%, rgba(255,242,230,0.09) 20%, rgba(255,240,228,0.035) 36%, rgba(255,240,228,0) 54%),
  radial-gradient(circle at 78% 20%, rgba(255,245,236,0.22) 0%, rgba(255,242,232,0.08) 26%, rgba(255,240,230,0) 52%)
`;

const GLARE_LIGHT = `
  radial-gradient(${CORE_AT}, rgba(255,253,250,0.30) 0%, rgba(255,252,248,0.14) 4%, rgba(255,251,247,0.05) 12%, rgba(255,251,247,0.025) 26%, rgba(255,250,246,0) 44%)
`;

export function SakuraBacklight() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ background: BACK_LIGHT, mixBlendMode: "screen" }}
    />
  );
}

export function SakuraGlare() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ background: GLARE_LIGHT, mixBlendMode: "screen" }}
    />
  );
}

