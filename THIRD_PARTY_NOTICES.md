# Third-party notices

This file records third-party software and assets used by the project. It is a
compliance checklist, not a substitute for the full license texts.

## Frontend

| Component | License | Source |
|---|---|---|
| Next.js / React / React DOM | MIT | https://nextjs.org/ |
| Framer Motion | MIT | https://www.framer.com/motion/ |
| Lucide React | ISC | https://lucide.dev/ |
| KaTeX | MIT | https://katex.org/ |
| highlight.js | BSD-3-Clause | https://highlightjs.org/ |
| TipTap and TipTap extensions | MIT | https://tiptap.dev/ |
| tiptap-markdown | MIT | https://github.com/aguingand/tiptap-markdown |
| lowlight | MIT | https://github.com/wooorm/lowlight |
| github-markdown-css | MIT | https://github.com/sindresorhus/github-markdown-css |

`github-markdown-light.css` and `github-markdown-dark.css` retain the upstream
MIT notice in their file headers. Keep that notice when the files are copied or
redistributed.

## Backend

| Component | License | Notes |
|---|---|---|
| Spring Boot / Spring Framework | Apache-2.0 | |
| MySQL Connector/J | GPL-2.0 with FOSS exception | Review before distributing a backend jar |
| Lombok | MIT | |
| JJWT | Apache-2.0 | |
| CommonMark | BSD-2-Clause | |
| OWASP Java HTML Sanitizer | Apache-2.0 | |
| Aliyun OSS SDK | Apache-2.0 | |
| TwelveMonkeys ImageIO | BSD-3-Clause | |

## Build and transitive packages

| Component | License | Notes |
|---|---|---|
| lightningcss | MPL-2.0 | Build-time CSS tooling |
| sharp / libvips | LGPL-3.0-or-later | May be included by Next.js image handling; review distribution obligations |
| caniuse-lite data | CC-BY-4.0 | Attribution required |
| argparse | Python-2.0 | Development dependency |

Before distributing a built server image, jar, or frontend package, include the
full license texts and any required source/relink offer for LGPL/GPL components.

## Project-original demos

The following effects were created for this project during development. No
third-party source code or asset is known to be included:

- `apps/web/components/SakuraGL.tsx`
- `apps/web/components/SakuraLights.tsx`
- `apps/web/components/Fireflies.tsx`
- `apps/web/components/ClickEffect.tsx`
- WebGL/CSS demos under `theme-demos/`

Record the creation date and author when these files are substantially changed.
If a future version incorporates an external shader or demo, add its author,
URL, and license here.

## Brand assets

The footer includes brand names and simplified brand SVG paths for Next.js,
React, and Tailwind CSS. These marks belong to their respective owners and are
used only to describe the technology stack. Do not modify them or imply
sponsorship or endorsement.

## Content

Music playback, lyrics, album covers, and imported playlists are not covered by
this software notice. They require separate rights or a licensed playback
service. See the audit notes for the current NetEase/Meting integration.
