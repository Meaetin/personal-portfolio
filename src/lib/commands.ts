/**
 * Terminal content + command registry — the single source of truth.
 * Pure data/logic, no UI. Edit section copy and projects here.
 */

/* ------------------------------------------------------------------ types */

export type Tone = "normal" | "dim" | "error" | "accent";

export interface LinkItem {
  label: string;
  href: string;
}

export type OutputLine =
  | { kind: "text"; text: string; tone?: Tone }
  | { kind: "echo"; text: string }
  | { kind: "links"; label?: string; items: LinkItem[] }
  | { kind: "blank" };

export interface Project {
  name: string;
  desc: string;
  stack?: string;
  href?: string;
}

export interface ExperienceItem {
  role: string;
  org: string;
  period: string;
  points: string[];
}

export interface EducationItem {
  credential: string;
  school: string;
  period: string;
  note?: string;
}

export interface SkillGroup {
  label: string;
  items: string;
}

export interface CommandContext {
  clear: () => void;
}

export type CommandHandler = (
  args: string[],
  ctx: CommandContext,
) => OutputLine[];

export interface Command {
  description: string;
  handler: CommandHandler;
  hidden?: boolean;
}

/* ------------------------------------------------------- helpers */

const text = (t: string, tone?: Tone): OutputLine => ({ kind: "text", text: t, tone });
const dim = (t: string): OutputLine => ({ kind: "text", text: t, tone: "dim" });
const blank = (): OutputLine => ({ kind: "blank" });

/* --------------------------------------------------------- content
   Placeholder copy — replace with real bio/projects/links.            */

/* profile — the professional / recruiter view: who I am, where I've
   worked, what I studied, what I work with. */

const profileIntro: OutputLine[] = [
  text("Martin Teo", "accent"),
  dim("full-stack engineer & co-founder · singapore"),
  blank(),
  text("I build apps that take tedious, manual work off people's plates"),
  text("(trip planning, job hunting, training logs), usually starting"),
  text("with mine."),
];

const experience: ExperienceItem[] = [
  {
    role: "co-founder & full-stack engineer",
    org: "Argo",
    period: "Aug 2025 - present",
    points: [
      "Event-driven travel platform turning unstructured content into",                                                                                                      
      "structured, collaborative itineraries.",                                                                                                                              
        "Next.js · GCP (Cloud Run, Pub/Sub) · Supabase · LLM pipelines.",  
    ],
  },
];

const education: EducationItem[] = [
  {
    credential: "BSc (Hons), Applied Computing",
    school: "Singapore Institute of Technology (SIT)",
    period: "2026 - 2029",
  },
  {
    credential: "Diploma in Information Technology",
    school: "Singapore Institute of Management",
    period: "2022 - 2023",
  },
];

const skills: SkillGroup[] = [
  { label: "languages", items: "TypeScript · Python" },
  { label: "frontend", items: "React · Next.js · Svelte" },
  { label: "backend", items: "Node.js · Express" },
  { label: "databases", items: "PostgreSQL · Supabase" },
  {
    label: "cloud & devops",
    items: "GCP · Docker · Terraform · GitHub Actions · Vercel",
  },
  { label: "ai", items: "OpenAI · Gemini · Claude · LLM pipelines" },
];

function profileLines(): OutputLine[] {
  const lines: OutputLine[] = [...profileIntro, blank()];

  lines.push(text("experience", "accent"));
  for (const e of experience) {
    lines.push(text(`  ${e.role} · ${e.org}`));
    lines.push(dim(`  ${e.period}`));
    for (const p of e.points) lines.push(dim(`    ${p}`));
    lines.push(blank());
  }

  lines.push(text("education", "accent"));
  for (const ed of education) {
    lines.push(text(`  ${ed.credential} · ${ed.school}`));
    lines.push(dim(`  ${ed.period}`));
    if (ed.note) lines.push(dim(`    ${ed.note}`));
  }
  lines.push(blank());

  lines.push(text("skills", "accent"));
  const labelWidth = Math.max(...skills.map((s) => s.label.length));
  for (const s of skills) {
    lines.push(dim(`  ${s.label.padEnd(labelWidth)}  ${s.items}`));
  }
  lines.push(blank());

  lines.push(dim("run 'ls projects' for work · 'ls contact' for resume + links."));
  return lines;
}

/* aboutme — the personal view: who I am away from the keyboard. */

const aboutme: OutputLine[] = [
  text("Hey, I'm Martin, the bit that doesn't fit on a resume.", "accent"),
  blank(),
  text("I like systems that stay calm under load, interfaces that"),
  text("feel tactile, and shipping small things I actually use myself."),
  text("Why pay for apps when you can build them yourself?"),
  blank(),
  text("Off the clock you'll find me:"),
  dim("  · tinkering with side projects that solve my own problems"),
  dim("  · drinking way too much Creamy Dreamy Latte at luckin coffee"),
  dim("  · bouldering for 6hrs straight and then wondering why my fingers hurt"),
];

const projects: Project[] = [
  {
    name: "argo",
    desc: "Event-driven travel platform that turns unstructured content into structured, collaborative itineraries.",
    stack: "Next.js · GCP (Cloud Run, Pub/Sub) · Supabase · LLM pipelines",
    href: "https://argo.so",
  },
  {
    name: "discord-helper-bot",
    desc: "Meeting intelligence for my team: recordings → diarization + structured extraction → summaries, decisions, action items.",
    stack: "Python · Deepgram · OpenAI · Railway",
  },
  {
    name: "crux",
    desc: "Offline-first fitness PWA with a custom outbox sync engine reconciling writes against Supabase on flaky networks.",
    stack: "SvelteKit · TypeScript · Supabase · D3",
  },
  {
    name: "jacker",
    desc: "AI job-application assistant: Gmail → LLM extraction → structured tracking, plus a Chrome scraper extension.",
    stack: "Next.js · Supabase · OpenAI",
  },
];

function projectLines(): OutputLine[] {
  const lines: OutputLine[] = [];
  for (const p of projects) {
    lines.push(text(p.name, "accent"));
    if (p.stack) lines.push(dim("  " + p.stack));
    lines.push(text("  " + p.desc));
    if (p.href) lines.push({ kind: "links", items: [{ label: "  → " + p.href, href: p.href }] });
    lines.push(blank());
  }
  lines.pop(); // drop trailing blank
  return lines;
}

const contact: OutputLine[] = [
  text("Let's build something. Reach me at:"),
  blank(),
  {
    kind: "links",
    items: [
      { label: "email", href: "mailto:martinteoyz@gmail.com" },
      { label: "github", href: "https://github.com/Meaetin" },
      { label: "linkedin", href: "https://linkedin.com/in/martin-teo" },
      { label: "resume (pdf)", href: "/assets/docs/resume.pdf" },
    ],
  },
];

const SECTIONS: Record<string, OutputLine[]> = {
  aboutme,
  contact,
  get profile() {
    return profileLines();
  },
  get projects() {
    return projectLines();
  },
};

export const SECTION_NAMES = ["profile", "projects", "aboutme", "contact"];

/* -------------------------------------------------------- commands */

function formatDate(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

export const commands: Record<string, Command> = {
  ls: {
    description: "list sections, or print one with 'ls <section>'",
    handler: (args) => {
      if (args.length === 0) {
        return [
          text(SECTION_NAMES.join("   "), "accent"),
          dim("run 'ls <section>' to read one."),
        ];
      }
      const section = args[0].toLowerCase();
      if (!SECTION_NAMES.includes(section)) {
        return [
          { kind: "text", text: `ls: no such section: ${section}`, tone: "error" },
          dim(`available: ${SECTION_NAMES.join(", ")}`),
        ];
      }
      return SECTIONS[section];
    },
  },

  help: {
    description: "show this help",
    handler: () => {
      const lines: OutputLine[] = [text("available commands:", "accent")];
      for (const [name, cmd] of Object.entries(commands)) {
        if (cmd.hidden) continue;
        lines.push(text(`  ${name.padEnd(8)} ${cmd.description}`));
      }
      lines.push(blank());
      lines.push(dim("tip: Tab completes · ↑/↓ recall history · or click a chip below."));
      return lines;
    },
  },

  clear: {
    description: "clear the screen",
    handler: (_args, ctx) => {
      ctx.clear();
      return [];
    },
  },

  whoami: {
    description: "who are you?",
    handler: () => [
      text("guest"),
      dim("(but you came here for martin, try 'ls profile')"),
    ],
  },

  date: {
    description: "print the current date",
    handler: () => [text(formatDate())],
  },
};

export const COMMAND_NAMES = Object.keys(commands).filter((n) => !commands[n].hidden);

/* --------------------------------------------------------- parser */

export function runCommand(raw: string, ctx: CommandContext): OutputLine[] {
  const trimmed = raw.trim();
  if (trimmed === "") return [];

  const [name, ...args] = trimmed.split(/\s+/);
  const cmd = commands[name.toLowerCase()];

  if (!cmd) {
    return [
      { kind: "text", text: `command not found: ${name}`, tone: "error" },
      dim("type 'help' for a list of commands."),
    ];
  }

  return cmd.handler(args, ctx);
}

/* ----------------------------------------------------- boot + hints */

/** Persistent header title — always shown, survives `clear`. The divider
    below it is drawn in CSS (not as a fixed-width string) so it never wraps. */
export const HEADER_TITLE = "MARTIN TEO // SOFTWARE ENGINEER";

/** Typed-in boot intro — lives in the scrollback, cleared by `clear`. */
export const BOOT_LINES: string[] = [
  "system ready.",
  "",
  "type 'help' to start, or click a command below.",
];

export interface HintChip {
  /** plain-English label shown to the visitor */
  label: string;
  /** the actual command that runs when clicked */
  command: string;
}

export const HINT_CHIPS: HintChip[] = [
  { label: "profile", command: "ls profile" },
  { label: "about me", command: "ls aboutme" },
  { label: "projects", command: "ls projects" },
  { label: "contact", command: "ls contact" },
  { label: "help", command: "help" },
  { label: "clear", command: "clear" },
];
