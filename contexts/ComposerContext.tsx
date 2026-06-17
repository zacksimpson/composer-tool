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
  folderId: string | null;
  id: string;
  title: string | null; // null = derive display title from first line of body
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  order: number;
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
const FOLDERS_KEY = "composer:folders";
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
  " ",
  "",
  "# Heading 1 — `# text`",
  "",
  "## Heading 2 — `## text`",
  "",
  "### Heading 3 — `### text`",
  "",
  " ",
  "",
  "- List item — `- text`",
  "- Another item",
  "",
  " ",
  "",
  "1. First item — `1. text`",
  "2. Second item",
  "",
  " ",
  "",
  "`inline code` — wrap with backticks",
  "",
  " ",
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
  addFolder: (name: string) => void;
  addNote: (folderId?: string | null) => string;
  deleteFolder: (id: string) => void;
  deleteNote: (id: string) => void;
  deleteNotes: (ids: string[]) => void;
  folders: Folder[];
  loaded: boolean;
  moveNotesToFolder: (noteIds: string[], folderId: string | null) => void;
  notes: Note[];
  reorderFolders: (orderedIds: string[]) => void;
  renameFolder: (id: string, name: string) => void;
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
  const [folders, setFolders] = useState<Folder[]>([]);
  const [settings, setSettings] = useState<ComposerSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(NOTES_KEY),
      AsyncStorage.getItem(FOLDERS_KEY),
      AsyncStorage.getItem(SETTINGS_KEY),
    ]).then(([rawNotes, rawFolders, rawSettings]) => {
      if (rawNotes) {
        try {
          const parsed: Note[] = JSON.parse(rawNotes);
          // Migrate notes that don't have folderId yet
          setNotes(parsed.map((n) => ({ ...n, folderId: n.folderId ?? null })));
        } catch {
          /* ignore corrupt data */
        }
      } else {
        const now = Date.now();
        const welcomeNote: Note = {
          id: generateId(),
          title: null,
          body: WELCOME_NOTE_BODY,
          folderId: null,
          createdAt: now,
          updatedAt: now,
        };
        setNotes([welcomeNote]);
        AsyncStorage.setItem(NOTES_KEY, JSON.stringify([welcomeNote]));
      }
      if (rawFolders) {
        try {
          setFolders(JSON.parse(rawFolders));
        } catch {
          /* ignore corrupt data */
        }
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

  const persistFolders = useCallback(async (next: Folder[]) => {
    setFolders(next);
    await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(next));
  }, []);

  const addNote = useCallback(
    (folderId: string | null = null): string => {
      const id = generateId();
      const now = Date.now();
      const newNote: Note = {
        id,
        title: null,
        body: FORMAT_PREFIX[settings.newNoteFormat],
        folderId,
        createdAt: now,
        updatedAt: now,
      };
      persistNotes([newNote, ...notes]);
      return id;
    },
    [notes, settings.newNoteFormat, persistNotes]
  );

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

  const moveNotesToFolder = useCallback(
    (noteIds: string[], folderId: string | null) => {
      const idSet = new Set(noteIds);
      persistNotes(
        notes.map((n) => (idSet.has(n.id) ? { ...n, folderId } : n))
      );
    },
    [notes, persistNotes]
  );

  const addFolder = useCallback(
    (name: string) => {
      const newFolder: Folder = {
        id: generateId(),
        name: name.trim(),
        order: folders.length,
      };
      persistFolders([...folders, newFolder]);
    },
    [folders, persistFolders]
  );

  const renameFolder = useCallback(
    (id: string, name: string) => {
      persistFolders(
        folders.map((f) => (f.id === id ? { ...f, name: name.trim() } : f))
      );
    },
    [folders, persistFolders]
  );

  const deleteFolder = useCallback(
    (id: string) => {
      // Remove folder and un-assign notes in it
      persistFolders(folders.filter((f) => f.id !== id));
      persistNotes(
        notes.map((n) => (n.folderId === id ? { ...n, folderId: null } : n))
      );
    },
    [folders, notes, persistFolders, persistNotes]
  );

  const reorderFolders = useCallback(
    (orderedIds: string[]) => {
      const folderMap = new Map(folders.map((f) => [f.id, f]));
      const reordered = orderedIds
        .map((id, i) => {
          const f = folderMap.get(id);
          return f ? { ...f, order: i } : null;
        })
        .filter(Boolean) as Folder[];
      persistFolders(reordered);
    },
    [folders, persistFolders]
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
        folders,
        loaded,
        settings,
        addNote,
        updateNote,
        renameNote,
        deleteNote,
        deleteNotes,
        moveNotesToFolder,
        addFolder,
        renameFolder,
        deleteFolder,
        reorderFolders,
        updateSettings,
      }}
    >
      {children}
    </ComposerContext.Provider>
  );
}
