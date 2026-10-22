# Tooling Runtime vs Project Runtime

> This file clarifies the distinction between the **tooling runtime** (Node.js — used to run
> lint, test, and CI scripts) and the **project runtime** (.NET 9 for the backend Minimal API
> and HTML5/CSS/JS for the frontend).

---

## The Distinction

| Layer | What it is | Required by |
| :--- | :--- | :--- |
| **Tooling runtime** | Node.js ≥ 24 | ESLint, Vitest, markdownlint-cli2, local template verification scripts |
| **Project runtime** | .NET 9 SDK (Backend) & HTML5/CSS/JS (Frontend) | The actual application code |

The template ships Node.js tooling because it is the most portable scripting runtime for cross-platform CI.

---

## What Node.js Is Used For in This Template

- `eslint` + `typescript-eslint` — lint of the template's own scripts
- `vitest` — the template's unit tests (`tests/unit/`)
- `markdownlint-cli2` — markdown lint (`npm run lint:md`)

---

## What Node.js Is NOT Used For

- Running the child project's application
- Building or testing the .NET backend (handled via native `dotnet build` & `dotnet test`)

---

## Project Setup

The template is configured out-of-the-box for a **.NET 9 Minimal API backend** and **HTML5/CSS/JS frontend**:

2. Build and run backend using `dotnet run` or `dotnet test`.
3. Open the frontend directly via `src/frontend/index.html` (no complex build step required).
4. Run governance verification locally using `npm test`.

---

## See Also

- `ADOPTION_GUIDE.md` — per-profile required vs optional files
- `docs/LANGUAGE_TOOLCHAINS.md` — per-language build/test toolchain reference
