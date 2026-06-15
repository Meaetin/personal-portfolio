# Portfolio

An interactive, terminal-style personal portfolio with a CRT / VCR aesthetic —
scanlines, chromatic-aberration text, animated static, and a power-on
animation. Visitors explore my profile, projects, and contact details by typing
commands (or clicking chips) into an in-page terminal.

Built with [Astro](https://astro.build) for static output and a single
[Svelte](https://svelte.dev) island for the interactive terminal.

## Tech stack

- **Astro 5** — static site, View Transitions via `<ClientRouter />`
- **Svelte 5** — the interactive `Terminal` (hydrated with `client:only`)
- **Native CSS** — custom properties + nesting, no preprocessor
- **TypeScript** — strict mode

## Getting started

```bash
npm install
npm run dev        # local dev server at http://localhost:4321
```

## Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start the dev server                     |
| `npm run build`   | Build the static site to `dist/`         |
| `npm run preview` | Preview the production build locally     |
| `npm run astro`   | Run Astro CLI commands                   |

## Project structure

```
src/
  components/
    Terminal.svelte    # interactive terminal island
    TVEffects.astro    # CRT overlays (scanlines, static, vignette)
  layouts/
    TVLayout.astro     # TV chrome + power-on animation
  lib/
    commands.ts        # command registry + all section content (edit copy here)
  pages/
    index.astro        # entry page
  styles/
    global.css         # design tokens + base styles
public/
  assets/              # fonts, images, resume
```

## Editing content

All terminal copy — profile, projects, experience, contact links — lives in
`src/lib/commands.ts`. Section text and the command registry are defined there;
no UI changes are needed to update what the terminal prints.

## Terminal commands

| Command | Description                                      |
| ------- | ------------------------------------------------ |
| `ls`    | List sections, or print one with `ls <section>`  |
| `help`  | Show available commands                          |
| `clear` | Clear the screen                                 |
| `whoami`| Print the current user                           |
| `date`  | Print the current date                           |

Tab completes commands, ↑/↓ recall history, and the chips below the prompt run
common commands on click.
