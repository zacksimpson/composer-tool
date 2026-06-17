import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Note {
  body: string;
  createdAt: number;
  id: string;
  title: string | null; // null = derive display title from first line of body
  updatedAt: number;
}

export type NewNoteFormat = "h1" | "h2" | "h3" | "body";
export type NoteSortOrder = "edited" | "created";

export interface ComposerSettings {
  newNoteFormat: NewNoteFormat;
  sortOrder: NoteSortOrder;
}

const DEFAULT_SETTINGS: ComposerSettings = {
  newNoteFormat: "body",
  sortOrder: "edited",
};

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const NOTES_KEY = "composer:notes";
const SETTINGS_KEY = "composer:settings";

// ─── Welcome Note ─────────────────────────────────────────────────────────────

const WELCOME_NOTE_BODY = [
  "# Welcome to Composer",
  "",
  "Composer supports Markdown formatting. Here's what you can use:",
  "",
  "**bold** — `**bold**`",
  "",
  "*italic* — `*italic*`",
  "",
  " ",
  "",
  "# Heading 1 — `# text`",
  "",
  "## Heading 2 — `## text`",
  "",
  "### Heading 3 — `### text`",
  "",
  " ",
  "",
  "- List item — `- text`",
  "- Another item",
  "",
  " ",
  "",
  "1. First item — `1. text`",
  "2. Second item",
  "",
  " ",
  "",
  "`inline code` — wrap with backticks",
  "",
  " ",
  "",
  "> Blockquote — `> text`",
].join("\n");

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const FORMAT_PREFIX: Record<NewNoteFormat, string> = {
  h1: "# ",
  h2: "## ",
  h3: "### ",
  body: "",
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface ComposerContextType {
  addNote: () => string;
  deleteNote: (id: string) => void;
  deleteNotes: (ids: string[]) => void;
  loaded: boolean;
  notes: Note[];
  renameNote: (id: string, title: string | null) => void;
  settings: ComposerSettings;
  updateNote: (
    id: string,
    updates: Partial<Omit<Note, "id" | "createdAt">>
  ) => void;
  updateSettings: (updates: Partial<ComposerSettings>) => void;
}

const ComposerContext = createContext<ComposerContextType | null>(null);

export const useComposer = () => {
  const ctx = useContext(ComposerContext);
  if (!ctx) {
    throw new Error("useComposer must be used within ComposerProvider");
  }
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ComposerProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [settings, setSettings] = useState<ComposerSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(NOTES_KEY),
      AsyncStorage.getItem(SETTINGS_KEY),
    ]).then(([rawNotes, rawSettings]) => {
      if (rawNotes) {
        try {
          setNotes(JSON.parse(rawNotes));
        } catch {
          /* ignore corrupt data */
        }
      } else {
        const now = Date.now();
        const welcomeNote: Note = {
          id: generateId(),
          title: null,
          body: WELCOME_NOTE_BODY,
          createdAt: now,
          updatedAt: now,
        };
        setNotes([welcomeNote]);
        AsyncStorage.setItem(NOTES_KEY, JSON.stringify([welcomeNote]));
      }
      if (rawSettings) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) });
        } catch {
          /* ignore corrupt data */
        }
      }
      setLoaded(true);
    });
  }, []);

  const persistNotes = useCallback(async (next: Note[]) => {
    setNotes(next);
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(next));
  }, []);

  const addNote = useCallback((): string => {
    const id = generateId();
    const now = Date.now();
    const newNote: Note = {
      id,
      title: null,
      body: FORMAT_PREFIX[settings.newNoteFormat],
      createdAt: now,
      updatedAt: now,
    };
    persistNotes([newNote, ...notes]);
    return id;
  }, [notes, settings.newNoteFormat, persistNotes]);

  const updateNote = useCallback(
    (id: string, updates: Partial<Omit<Note, "id" | "createdAt">>) => {
      persistNotes(notes.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    },
    [notes, persistNotes]
  );

  const renameNote = useCallback(
    (id: string, title: string | null) => {
      persistNotes(
        notes.map((n) =>
          n.id === id ? { ...n, title, updatedAt: Date.now() } : n
        )
      );
    },
    [notes, persistNotes]
  );

  const deleteNote = useCallback(
    (id: string) => {
      persistNotes(notes.filter((n) => n.id !== id));
    },
    [notes, persistNotes]
  );

  const deleteNotes = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      persistNotes(notes.filter((n) => !idSet.has(n.id)));
    },
    [notes, persistNotes]
  );

  const updateSettings = useCallback(
    async (updates: Partial<ComposerSettings>) => {
      const next = { ...settings, ...updates };
      setSettings(next);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    },
    [settings]
  );

  return (
    <ComposerContext.Provider
      value={{
        notes,
        loaded,
        settings,
        addNote,
        updateNote,
        renameNote,
        deleteNote,
        deleteNotes,
        updateSettings,
      }}
    >
      {children}
    </ComposerContext.Provider>
  );
}
