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

**`src/components/Reader.tsx` is the central orchestrator** (~1750 lines). It owns almost all application state and renders every mode. Most components are presentational and driven by props/callbacks from `Reader`. To understand any feature, start here.

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

## Component reference

Every component lives in `src/components/` with a co-located `.css` file. `Reader` renders or coordinates nearly all of them.

### Core / orchestration
- **Reader** — the ~1750-line orchestrator; owns all state and renders every mode. Start here for any feature.
- **Word** — single word span; handles click/long-press, LingQ/status/phrase highlighting, and phrase drag-select. The primitive leaf node.
- **Page** — one rendered page of paginated lesson text; lays out `Word`s with phrase/status highlighting.

### Reader chrome
- **LessonHeader** — top card with thumbnail, title, course/page label; tappable to open course info. Also appears atop audio/video settings sheets.
- **ReaderBottomBar** — fixed bottom control bar: page nav, mode toggles (sentence/review/Lynx), video/audio buttons, settings.
- **ReaderMenuSheet** — bottom-sheet menu: mode toggles, prev/next lesson, translation visibility, settings, help.
- **ExitLessonPopup** — confirmation dialog when leaving a lesson via the Library button.
- **CourseInfoSheet** — bottom sheet with course/lesson metadata, progress, related lessons.

### Word / phrase interaction
- **ReaderPopUp** — floating popup for a clicked word: definition, status, expand-to-detail, open Lynx, panel toggle.
- **QuickStatusPopup** — small horizontal icon row near a tapped word (Known / Ignore / Select Phrase).
- **PhrasePickTooltip** — snackbar-style hint shown while "Select a Phrase" mode is active.
- **PhrasePopUp** — floating popup for a selected phrase: validity, phrase text, meaning, per-word breakdown with inline status menus, detail/translate actions.
- **WordDetailBottomSheet** — large bottom sheet for a word: meaning, saved meanings, sentences, dictionaries, Lynx note, related-words strip.
- **DictionaryMenuSheet** — bottom sheet to add/remove/reorder dictionaries; opened from the word detail sheet.

### Status UI
- **LingQStatusBar** — horizontal/vertical picker for all six LingQ levels as colored pills.
- **LingQStatusButton** — single compact status button (number or Known/Ignored icon) used in lists/strips.
- **StatusPopover** — vertical status menu portaled to `body`, anchored beside its target; closes on outside tap/Escape.
- **StatusSnackbar** — bottom notification with undo + auto-dismiss; driven by snackbar state in `Reader`.

### Sentence mode
- **SentenceMode** — full-screen one-sentence-at-a-time view with a horizontal meaning strip and swipe nav (`sentenceMode`).
- **SentenceBlock** — card for a past-encounter sentence: original text, translation, audio/copy.
- **SentenceMenu** / **SentenceMenuItem** — rounded container + collapsible rows for past-encounter sentences.

### Review mode
- **ReviewMode** — full-screen scrollable vocab review list with filter/Lynx/stats controls (`reviewMode`).
- **ReviewFilterSheet** — bottom sheet to filter review by method (list/cards), scope (lesson/page/sentence), and status range.
- **VocabTermList** — scrollable vocab list with status badges, swipe-to-delete, add button.
- **HorizontalTermList** — horizontal scrolling vocab card strip with inline status menu via long-press drag; used in sentence mode and detail sheets.

### Media mode
- **VideoModeVideoPlayer** — video player placeholder at top of reader in video mode; maximizable.
- **VideoModeBottomBar** — fixed bottom chrome for video mode: lesson header, playback controls, scrubber, expand/collapse.
- **AudioMiniPlayer** — floating mini audio player shown when audio mode is active.
- **AudioSettingsSheet** — bottom sheet of audio controls (speed, timer, lessons, theme, settings, help).

### Lynx (AI) mode
- **LynxChatMode** — full-screen AI chat (`lynxChatOpen`).
- **LynxMessageActions** — trio of icon buttons (volume, copy, refresh) on AI messages; also used in `NoteField`.

### Meanings / notes
- **MeaningSection** — reusable label + rounded container section wrapper for lists of items.
- **MeaningListItem** — menu row for a meaning/definition with optional source text and trailing CTA.
- **SavedMeaningRow** — menu row for a user-saved definition with swipe-to-delete / tap-to-edit.
- **NoteField** — expandable note input with save/clear/audio/refresh and Lynx-generated content.

### Generic primitives
- **BottomSheet** — base modal with drag-to-dismiss, swipe-up-to-expand, exit animation. Ancestor for most sheets.
- **Menu** / **MenuItem** — rounded container + single row (icon, label, optional trailing control) building blocks for menus.
