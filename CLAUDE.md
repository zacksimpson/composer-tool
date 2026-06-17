# Composer — Claude Project Context

## Project Overview
A LightOS markdown notes app for the **Light Phone III**. Built as a native Android app using React Native / Expo. Android only — no iOS target. Minimal and monochromatic to match the Light Phone aesthetic.

Users write notes in Markdown. While typing, raw syntax is displayed. After a ~300ms pause, the text snaps to rendered Markdown (bold, italic, headings, lists, inline code, blockquotes). Tapping the rendered text returns to edit mode.

**GitHub:** https://github.com/zacksimpson/composer-tool
**Working directory:** `~/Dev/composer-tool`
**Primary branch:** `main`

---

## Tech Stack
- **React Native** 0.83.4 + **Expo** ~55
- **Expo Router** (file-based routing, stack only — no tabs)
- **TypeScript**
- **Bun** (package manager — use `bun install`, never npm/yarn)
- **AsyncStorage** for all data persistence
- **`@ronradtke/react-native-markdown-display`** for markdown rendering
- **`expo-clipboard`** for copy-to-clipboard actions
- **`expo-dev-client`** for development builds (required by expo-router SDK 50+ to enable hot reload via the dev server)
- **EAS Build** for production APKs
- **Biome / Ultracite** for linting (`bun run check` / `bun run fix`)
- **PublicSans-Regular** font throughout

---

## Key Files

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root stack layout with providers |
| `app/index.tsx` | Notes list — main screen |
| `app/settings.tsx` | Settings screen |
| `app/confirm.tsx` | Generic delete confirmation screen |
| `app/note/[id].tsx` | Note editor — raw/rendered snap-on-pause |
| `app/note-actions/[id].tsx` | Hamburger menu actions (Rename, Copy, Delete) |
| `contexts/ComposerContext.tsx` | All note data + persistence |
| `contexts/InvertColorsContext.tsx` | Inverted colors toggle + persistence |
| `components/MarkdownRenderer.tsx` | Styled markdown renderer (PublicSans, white/black) |
| `components/PlusEditIcon.tsx` | Custom SVG pencil+ icon for new note button |
| `components/SettingsIcon.tsx` | Custom SVG settings/gear icon (from Nourish) |
| `utils/stripMarkdown.ts` | `stripMarkdown()` and `getDisplayTitle()` helpers |
| `utils/scaling.ts` | `n()` scaling utility — use for ALL dimensions |
| `hooks/useScrollIndicator.ts` | Custom scroll indicator logic |

---

## Data Model

```ts
interface Note {
  id: string;
  title: string | null;  // null = derive from first line of body
  body: string;          // raw Markdown
  createdAt: number;
  updatedAt: number;
}
```

Notes stored in AsyncStorage as `composer:notes` (JSON array).
Notes sorted by `updatedAt` or `createdAt` descending based on `settings.sortOrder` ("edited" | "created").

---

## Editor Behavior (snap-on-pause)

- `isRawMode: true` → `TextInput` is visible, user types raw Markdown
- `isRawMode: false` → `MarkdownRenderer` is visible, tapping it re-enters raw mode
- Snaps from raw → rendered after **300ms** of no typing (`RENDER_DEBOUNCE_MS`)
- Persists note body after **600ms** of no typing (`PERSIST_DEBOUNCE_MS`)
- New notes (`autoFocus=1`) start in raw mode with keyboard open
- Existing notes start in rendered mode
- Title is tappable in header for inline rename; "Rename" in actions menu does the same

---

## Screen Flow

```
/ (index)              Notes list
  → /note/[id]         Editor
      → /note-actions/[id]   Hamburger menu
          → /confirm   Delete confirmation (returns to /)
  → /settings          Settings
```

Confirm screen returns to `/` with `?toast=Deleted`.
Note actions returns to `/note/[id]` with `?action=rename` or `?toast=Copied`.

---

## Supported Markdown

- `**bold**`, `*italic*`
- `# H1`, `## H2`, `### H3`
- Unordered lists (`- item`)
- Ordered lists (`1. item`)
- `` `inline code` ``
- `> blockquotes`

Code fences and HR are suppressed in `MarkdownRenderer.tsx`.

---

## Design Rules (strict — same as all LightOS tools)

- **No gray** — all text is white on black (or black on white in inverted mode). Never use any gray-toned color.
- **No dividers** — no `borderBottomWidth`, `borderTopWidth`, or separator Views anywhere.
- **Always use `n()`** for every dimension — padding, margin, font size, border width, icon size.
- **`HapticPressable`** instead of `Pressable`, `TouchableOpacity`, or `TouchableWithoutFeedback` everywhere.
- **`allowFontScaling={false}`** on all `Text` and `TextInput` elements.
- **`overScrollMode="never"`** on all `ScrollView`s.
- **`cursorColor={textColor}`** and **`selectionColor={textColor}`** on all `TextInput`s.
- **`paddingLeft: 0`** on `TextInput` styles to override Android's default offset.
- Standard horizontal padding: `n(22)` on most screens.

---

## Component Patterns

### Theme Colors
```ts
const { invertColors } = useInvertColors();
const bg = invertColors ? "white" : "black";
const textColor = invertColors ? "black" : "white";
```

### Navigation / Back
Use `goBack()` from `utils/navigation` — never inline `router.canGoBack()` / `router.back()`.

### Note Display Title
```ts
import { getDisplayTitle } from "@/utils/stripMarkdown";
getDisplayTitle(note.title, note.body); // returns title, first line, or "Untitled"
```

### Confirm + Toast Pattern
Navigate to `/confirm` with params, it executes the action and returns with `?toast=Deleted`.
Note actions return to editor with `?toast=Copied` or `?action=rename`.
Use `useFocusEffect` to consume these params on return.

---

## Build & Release

### Dev
```bash
bun run dev
```
Requires phone connected via USB with USB debugging enabled.

### Production
Triggered by pushing a `v*` tag (GitHub Actions → EAS cloud build).

```bash
git tag v1.0.0
git push origin v1.0.0
```

**EAS credits are limited** — don't push `v*` tags unless intentionally triggering a build.

### `android/` directory
Not committed. Regenerated by `expo prebuild`. The `withDebugApplicationIdSuffix` plugin allows debug + production APKs to coexist on device as `com.zacksimpson.composer.debug`.

---

## Do's and Don'ts

### Do
- Use `n()` for every dimension
- Use `HapticPressable` for all interactive elements
- Use `goBack()` from `utils/navigation`
- Use `getDisplayTitle()` for note list titles
- Set `allowFontScaling={false}` on all Text and TextInput
- Set `cursorColor` and `selectionColor` to `textColor` on all TextInputs
- Use `useFocusEffect` to consume action/toast params on screen focus

### Don't
- Don't use gray or any muted color for UI elements
- Don't add dividers or separator Views
- Don't use raw pixel values — always `n()`
- Don't use `TouchableWithoutFeedback` (audible system click sound)
- Don't push `v*` git tags unless you want to trigger an EAS cloud build
- Don't commit the `android/` directory
