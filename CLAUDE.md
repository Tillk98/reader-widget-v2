# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **UI/UX prototype** of the LingQ language-learning reader (the in-lesson reading widget), built with React 19 + TypeScript + Vite. There is **no backend**: lesson content and translations are mocked in `src/data/lesson.ts` (a French→English lesson with a hardcoded word→translation map), and the only persistence is `localStorage`. Treat changes as front-end/interaction work, not API integration.

The README.md is the stock Vite template and can be ignored.

## Commands

```bash
npm run dev      # Vite dev server with HMR
npm run build    # tsc -b (typecheck) then vite build
npm run lint     # eslint .
npm run preview  # serve the production build locally
```

There is **no test framework** configured — do not assume `npm test` exists. Verify by typechecking (`npm run build`) and running the app. Several bug fixes in git history were production-build-only (e.g. status menus not opening); when touching interaction code, prefer checking `npm run preview` over just `dev`.

## Architecture

**`src/components/Reader.tsx` is the central orchestrator** (~1500 lines). It owns almost all application state and renders every mode. Most components are presentational and driven by props/callbacks from `Reader`. To understand any feature, start here.

### Modes (mutually-exclusive views toggled by Reader state)
- **Page reading** (default) — paginated word-by-word lesson text
- **Sentence mode** (`sentenceMode`) — one sentence at a time → `SentenceMode.tsx`
- **Review mode** (`reviewMode`) — flashcard/list review of saved terms → `ReviewMode.tsx`, filtered via `ReviewFilterSheet.tsx`
- **Video / Audio mode** (`mediaMode: 'none' | 'video' | 'audio'`) — media player chrome around the text → `VideoMode*`, `AudioMiniPlayer`, `AudioSettingsSheet`
- **Lynx chat mode** (`lynxChatOpen`) — full-screen AI chat → `LynxChatMode.tsx`

### Custom pagination (no library)
`Reader.calculatePages()` measures words into pages by appending spans to an off-screen temp container and comparing height against available space. A `ResizeObserver` + debounced `scheduleResizePaginate` re-paginate on resize. Note the deliberate guards against re-pagination flashes: `isPageSwipeDraggingRef` (skip during swipe), a post-page-change `paginationCooldownUntilRef`, and the debounce. Be careful editing this — remounting page rows mid-gesture causes visible white flashes.

### LingQ status model
`LingQStatusType` (`src/components/LingQStatusBar.tsx`): `New | Recognized | Familiar | Learned | Known | Ignored`. Per-word status lives in `Reader`'s `wordStatusMap` (`Record<wordId, status>`); `knownWords` / `ignoredWords` / `lingqWords` are derived `useMemo` sets. Phrases have a parallel `phraseStatusMap` keyed by joined word ids.

### Phrase selection
A phrase LingQ is created by long-pressing an anchor word then tapping a second word. Rules live in `src/utils/phrase.ts`: max `MAX_PHRASE_WORDS` (9) real words, single sentence, punctuation excluded from counts. Mobile ghost-click suppression is handled via `phrasePickStartTimeRef` / `ignoreNextWordClick` — this has been a recurring bug source.

### Conventions
- Each component has a **co-located `.css` file** of the same name; shared control styles in `src/styles/ui-controls.css`.
- Bottom sheets share `BottomSheet.tsx` as a base.
- Reader↔video transitions use the **View Transitions API** via `src/utils/viewTransition.ts` (falls back to synchronous update when unsupported).
- Per-word saved meanings persist to `localStorage` via `src/utils/savedMeanings.ts` (prefix `lingq.reader.savedMeanings.`).
- TypeScript is strict with `noUnusedLocals`/`noUnusedParameters` and `verbatimModuleSyntax` (use `import type` for type-only imports).
