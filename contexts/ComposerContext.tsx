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

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const NOTES_KEY = "composer:notes";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ComposerContextType {
  addNote: () => string;
  deleteNote: (id: string) => void;
  deleteNotes: (ids: string[]) => void;
  loaded: boolean;
  notes: Note[];
  renameNote: (id: string, title: string | null) => void;
  updateNote: (
    id: string,
    updates: Partial<Omit<Note, "id" | "createdAt">>
  ) => void;
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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(NOTES_KEY).then((raw) => {
      if (raw) {
        try {
          setNotes(JSON.parse(raw));
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
      body: "",
      createdAt: now,
      updatedAt: now,
    };
    persistNotes([newNote, ...notes]);
    return id;
  }, [notes, persistNotes]);

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

  return (
    <ComposerContext.Provider
      value={{
        notes,
        loaded,
        addNote,
        updateNote,
        renameNote,
        deleteNote,
        deleteNotes,
      }}
    >
      {children}
    </ComposerContext.Provider>
  );
}
