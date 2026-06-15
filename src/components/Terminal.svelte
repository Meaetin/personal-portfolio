<script lang="ts">
  import { onMount, tick } from "svelte";
  import {
    runCommand,
    COMMAND_NAMES,
    SECTION_NAMES,
    HEADER_TITLE,
    BOOT_LINES,
    HINT_CHIPS,
    type OutputLine,
    type CommandContext,
  } from "../lib/commands";

  type Line = OutputLine & { id: number };

  const PROMPT = "guest@martin:~$ ";

  let scrollback = $state<Line[]>([]);
  let input = $state("");
  let booting = $state(true);

  let cmdHistory: string[] = [];
  let historyIndex = -1;
  let draftBeforeHistory = "";
  let seq = 0;

  let inputEl: HTMLInputElement;
  let scroller: HTMLElement;

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ctx: CommandContext = {
    clear: () => {
      scrollback = [];
    },
  };

  function push(line: OutputLine) {
    scrollback = [...scrollback, { id: seq++, ...line } as Line];
  }

  /* --------------------------------------------------------- scrolling */
  async function scrollToBottom() {
    await tick();
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }

  /* Bring a freshly-run command's echo line to the top of the viewport, so
     the visitor reads its output top-down and clearly sees new content load. */
  async function scrollCmdToTop(id: number) {
    await tick();
    if (!scroller) return;
    const el = scroller.querySelector<HTMLElement>(`[data-id="${id}"]`);
    if (!el) {
      scroller.scrollTop = scroller.scrollHeight;
      return;
    }
    const top =
      el.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop;
    scroller.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? "auto" : "smooth" });
  }

  /* ---------------------------------------------------------- boot */
  let bootIndex = 0;
  let bootTimer: ReturnType<typeof setTimeout> | undefined;

  function bootLine(i: number): OutputLine {
    const s = BOOT_LINES[i];
    if (s === "") return { kind: "blank" };
    return { kind: "text", text: s, tone: "dim" };
  }

  function bootStep() {
    if (bootIndex >= BOOT_LINES.length) return endBoot();
    push(bootLine(bootIndex));
    bootIndex++;
    scrollToBottom();
    bootTimer = setTimeout(bootStep, 200);
  }

  function startBoot() {
    if (reducedMotion) {
      for (; bootIndex < BOOT_LINES.length; bootIndex++) push(bootLine(bootIndex));
      scrollToBottom();
      return endBoot();
    }
    bootStep();
  }

  function fastForwardBoot() {
    if (bootTimer) clearTimeout(bootTimer);
    for (; bootIndex < BOOT_LINES.length; bootIndex++) push(bootLine(bootIndex));
    scrollToBottom();
    endBoot();
  }

  function endBoot() {
    booting = false;
    focusInput();
  }

  /* --------------------------------------------------------- submit */
  function submit(raw: string) {
    const echoId = seq;
    push({ kind: "echo", text: PROMPT + raw });
    for (const line of runCommand(raw, ctx)) push(line);

    const t = raw.trim();
    if (t && cmdHistory[cmdHistory.length - 1] !== t) cmdHistory.push(t);
    historyIndex = -1;
    draftBeforeHistory = "";
    input = "";
    scrollCmdToTop(echoId);
  }

  /* -------------------------------------------------------- history */
  function caretToEnd() {
    requestAnimationFrame(() => {
      if (inputEl) inputEl.setSelectionRange(input.length, input.length);
    });
  }

  function historyPrev() {
    if (cmdHistory.length === 0) return;
    if (historyIndex === -1) {
      draftBeforeHistory = input;
      historyIndex = cmdHistory.length - 1;
    } else if (historyIndex > 0) {
      historyIndex--;
    }
    input = cmdHistory[historyIndex];
    caretToEnd();
  }

  function historyNext() {
    if (historyIndex === -1) return;
    if (historyIndex < cmdHistory.length - 1) {
      historyIndex++;
      input = cmdHistory[historyIndex];
    } else {
      historyIndex = -1;
      input = draftBeforeHistory;
    }
    caretToEnd();
  }

  /* --------------------------------------------------- autocomplete */
  function longestCommonPrefix(strs: string[]): string {
    if (strs.length === 0) return "";
    let p = strs[0];
    for (const s of strs) {
      while (!s.startsWith(p)) p = p.slice(0, -1);
      if (p === "") break;
    }
    return p;
  }

  function autocomplete() {
    const parts = input.split(/\s+/);
    let candidates: string[];
    let base: string;

    if (parts.length <= 1) {
      const prefix = (parts[0] ?? "").toLowerCase();
      candidates = COMMAND_NAMES.filter((c) => c.startsWith(prefix));
      base = "";
    } else if (parts[0].toLowerCase() === "ls") {
      const prefix = parts[parts.length - 1].toLowerCase();
      candidates = SECTION_NAMES.filter((s) => s.startsWith(prefix));
      base = "ls ";
    } else {
      return;
    }

    if (candidates.length === 0) return;

    if (candidates.length === 1) {
      const completed = candidates[0];
      input = base === "" ? completed + (completed === "ls" ? " " : "") : base + completed;
      caretToEnd();
      return;
    }

    input = base + longestCommonPrefix(candidates);
    push({ kind: "text", text: candidates.join("   "), tone: "dim" });
    scrollToBottom();
    caretToEnd();
  }

  /* ------------------------------------------------------ keyboard */
  function onKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        submit(input);
        break;
      case "ArrowUp":
        e.preventDefault();
        historyPrev();
        break;
      case "ArrowDown":
        e.preventDefault();
        historyNext();
        break;
      case "Tab":
        e.preventDefault();
        autocomplete();
        break;
    }
  }

  function onWindowKeydown(e: KeyboardEvent) {
    if (booting) {
      e.preventDefault();
      fastForwardBoot();
    }
  }

  /* --------------------------------------------------------- focus */
  function focusInput() {
    requestAnimationFrame(() => inputEl?.focus());
  }

  function onTerminalClick() {
    if (booting) return;
    if (window.getSelection()?.toString()) return; // preserve copy
    inputEl?.focus();
  }

  function runChip(cmd: string) {
    if (booting) return;
    submit(cmd);
    focusInput();
  }

  /* ----------------------------------------------------- lifecycle */
  onMount(() => {
    const body = document.body;
    const screen = document.querySelector(".js-screen");
    let started = false;

    const begin = () => {
      if (started) return;
      started = true;
      cleanup();
      startBoot();
    };

    function cleanup() {
      clearTimeout(fallback);
      screen?.removeEventListener("animationend", begin);
    }

    let fallback: ReturnType<typeof setTimeout>;

    if (body.hasAttribute("data-tv-on")) {
      startBoot();
      cleanup();
    } else {
      screen?.addEventListener("animationend", begin, { once: true });
      fallback = setTimeout(begin, 1200);
    }

    return () => {
      cleanup();
      if (bootTimer) clearTimeout(bootTimer);
    };
  });
</script>

<svelte:window onkeydown={onWindowKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<section class="terminal" onclick={onTerminalClick}>
  <header class="term-header">
    <div class="line accent">{HEADER_TITLE}</div>
    <div class="term-divider" aria-hidden="true"></div>
  </header>

  <ul class="scrollback" bind:this={scroller} aria-live="polite" aria-atomic="false">
    {#each scrollback as line (line.id)}
      {#if line.kind === "blank"}
        <li class="line blank" data-id={line.id}>&nbsp;</li>
      {:else if line.kind === "echo"}
        <li class="line echo" data-id={line.id}>{line.text}</li>
      {:else if line.kind === "text"}
        <li class="line {line.tone ?? 'normal'}" data-id={line.id}>{line.text}</li>
      {:else if line.kind === "links"}
        <li class="line links" data-id={line.id}>
          {#if line.label}<span class="links-label">{line.label} </span>{/if}
          {#each line.items as item, i (item.href + i)}
            {#if i > 0}<span class="sep"> · </span>{/if}
            <a
              href={item.href}
              target={item.href.startsWith("mailto:") ? undefined : "_blank"}
              rel="noopener noreferrer">{item.label}</a
            >
          {/each}
        </li>
      {/if}
    {/each}
  </ul>

  {#if !booting}
    <div class="input-line">
      <span class="prompt">{PROMPT}</span>
      <span class="mirror">{input}<span class="caret"></span></span>
      <input
        class="real-input"
        type="text"
        bind:this={inputEl}
        bind:value={input}
        onkeydown={onKeydown}
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        inputmode="text"
        aria-label="terminal input"
      />
    </div>

    <div class="hints">
      <span class="hints-label">try:</span>
      {#each HINT_CHIPS as chip (chip.command)}
        <button class="button-text chip" type="button" onclick={() => runChip(chip.command)}>
          {chip.label}
        </button>
      {/each}
    </div>
  {/if}
</section>

<style>
  .terminal {
    display: flex;
    flex-direction: column;
    /* bound to the viewport so .scrollback becomes the real inner scroller,
       keeping the header + input + chips pinned while output scrolls */
    height: 100dvh;
    max-height: 100dvh;
    padding: 1.5rem 0 1rem;
    gap: 0.4rem;
  }

  .term-header {
    flex: 0 0 auto;
    margin-bottom: 0.6rem;
  }
  /* a real CSS rule — never wraps, regardless of how the title wraps */
  .term-divider {
    width: 100%;
    height: 2px;
    margin-top: 0.35rem;
    background-color: var(--text-primary);
    opacity: 0.5;
    box-shadow:
      2px 1px 0 var(--glitchy-blue),
      -2px -1px 0 var(--glitchy-red);
  }

  .scrollback {
    /* fill the available space so the prompt + chips stay pinned to the
       bottom of the screen; output scrolls inside this region */
    flex: 0 1 auto;                                                                                                                                                          
    min-height: 0;  
    overflow-y: auto;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .line {
    white-space: pre-wrap;
    word-break: break-word;
  }
  .line.normal {
    color: var(--text-primary);
  }
  .line.dim {
    color: var(--text-primary);
    opacity: 0.55;
  }
  .line.error {
    color: #ff6b6b;
  }
  .line.accent,
  .line.echo {
    color: var(--text-secondary);
  }
  .line.echo {
    opacity: 0.85;
  }

  .links-label {
    color: var(--text-primary);
  }
  .sep {
    color: var(--text-primary);
    opacity: 0.5;
  }

  .input-line {
    position: relative;
    display: flex;
    align-items: baseline;
  }
  .prompt {
    color: var(--text-secondary);
    white-space: pre;
  }
  .mirror {
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--text-secondary);
  }
  .caret {
    display: inline-block;
    width: 0.55em;
    height: 1.05em;
    margin-left: 1px;
    transform: translateY(0.12em);
    background-color: var(--text-secondary);
    animation: caret-blink 1s step-end infinite;
  }
  .real-input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: transparent;
    caret-color: transparent;
    font: inherit;
    outline: none;
  }

  .hints {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem 1.25rem;
    padding-top: 0.5rem;
  }
  .hints-label {
    font-size: 0.78rem;
    opacity: 0.45;
    text-transform: lowercase;
  }
  .chip {
    font-size: 0.78rem;
    opacity: 0.7;
    text-transform: lowercase;
  }
</style>
