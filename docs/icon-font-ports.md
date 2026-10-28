# Icon and font ports

## Icons

The C-end uses one central registry:

```text
apps/web/components/ui/AppIcon.tsx
```

Components should import:

```tsx
import { AppIcon } from "../ui/AppIcon";

<AppIcon name="settings" size={16} />
```

To switch icon families, replace the imports and entries in `ICONS`; feature
components do not need to change. Add new glyphs to the map before using them.

The admin has the same pattern:

```text
apps/admin/src/components/ui/AppIcon.tsx
```

```tsx
import { AppIcon } from "../ui/AppIcon";

<AppIcon name="save" size={16} />
```

Keep one visual family (line icons, one stroke weight) unless a brand mark is
required.

## Fonts

C-end font presets:

```text
apps/web/components/TypographyProvider.tsx
```

Admin font presets:

```text
apps/admin/src/components/TypographyProvider.tsx
```

Available presets:

```text
editorial   current serif/sans mix
modern      Inter / Noto Sans
system      OS native stacks
```

The provider writes these CSS variables:

```text
--font-body
--font-serif
--font-display
--font-mono
```

To add a preset, add an entry to `FONT_PRESETS` and use `setPreset` from
`useTypography` (web) or `useAdminTypography` (admin) when a settings control is
ready.

C-end preference key:

```text
font-preset
```

Admin preference key:

```text
admin-font-preset
```

No font files are bundled by these providers; they only select local/system
font stacks. If webfonts are added later, include the font license and serve the
files locally.
