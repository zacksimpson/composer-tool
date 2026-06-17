import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Animated, Keyboard } from "react-native";
import type WebView from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";
import { n } from "@/utils/scaling";
import { useComposer } from "./ComposerContext";

const PERSIST_DEBOUNCE_MS = 600;
const HEADING_ONLY_RE = /^#{1,3}$/;

interface ActiveNote {
  id: string;
  initialBody: string;
  title: string | null;
}

interface EditorContextType {
  activeNote: ActiveNote | null;
  body: string;
  closeNote: () => void;
  dismissKeyboard: () => void;
  handleMessage: (event: WebViewMessageEvent) => void;
  isEditorReady: boolean;
  keyboardVisible: boolean;
  openNote: (params: {
    id: string;
    body: string;
    title: string | null;
    autoFocus?: boolean;
  }) => void;
  scrollIndicatorHeight: number;
  scrollIndicatorPosition:
    | Animated.Value
    | Animated.AnimatedInterpolation<number>;
  webViewRef: React.RefObject<WebView | null>;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const useEditor = (): EditorContextType => {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error("useEditor must be used within EditorProvider");
  }
  return ctx;
};

export function EditorProvider({ children }: { children: ReactNode }) {
  const { updateNote, deleteNote } = useComposer();

  const webViewRef = useRef<WebView | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [activeNote, setActiveNote] = useState<ActiveNote | null>(null);
  const [body, setBody] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [editorScrollHeight, setEditorScrollHeight] = useState(0);
  const [editorClientHeight, setEditorClientHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  const bodyRef = useRef("");
  const activeNoteRef = useRef<ActiveNote | null>(null);
  const isEditorReadyRef = useRef(false);
  const pendingOpenRef = useRef<{ body: string; autoFocus: boolean } | null>(
    null
  );
  const persistDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const updateNoteRef = useRef(updateNote);
  updateNoteRef.current = updateNote;
  const deleteNoteRef = useRef(deleteNote);
  deleteNoteRef.current = deleteNote;

  bodyRef.current = body;
  activeNoteRef.current = activeNote;
  isEditorReadyRef.current = isEditorReady;

  const needsIndicator = editorScrollHeight > editorClientHeight;
  const scrollIndicatorHeight = needsIndicator
    ? Math.max(
        (editorClientHeight * editorClientHeight) / editorScrollHeight,
        n(20)
      )
    : 0;
  const scrollIndicatorPosition = needsIndicator
    ? scrollY.interpolate({
        inputRange: [0, editorScrollHeight - editorClientHeight],
        outputRange: [0, editorClientHeight - scrollIndicatorHeight],
        extrapolate: "clamp",
      })
    : scrollY;

  const injectContent = useCallback((markdown: string, autoFocus: boolean) => {
    webViewRef.current?.injectJavaScript(
      `window.composerBridge?.setContent(${JSON.stringify(markdown)}); true;`
    );
    if (autoFocus) {
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(
          "window.composerBridge?.focus(); true;"
        );
      }, 150);
    }
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      const h = Math.round(e.endCoordinates.height);
      setKeyboardVisible(true);
      webViewRef.current?.injectJavaScript(
        `window.composerBridge?.setKeyboardHeight(${h}); true;`
      );
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
      webViewRef.current?.injectJavaScript(
        "window.composerBridge?.setKeyboardHeight(0); true;"
      );
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const openNote = useCallback(
    ({
      id,
      body: initialBody,
      title,
      autoFocus = false,
    }: {
      id: string;
      body: string;
      title: string | null;
      autoFocus?: boolean;
    }) => {
      const note: ActiveNote = { id, initialBody, title };
      setActiveNote(note);
      setBody(initialBody);
      bodyRef.current = initialBody;
      activeNoteRef.current = note;
      scrollY.setValue(0);
      setEditorScrollHeight(0);
      setEditorClientHeight(0);

      if (isEditorReadyRef.current) {
        injectContent(initialBody, autoFocus);
      } else {
        pendingOpenRef.current = { body: initialBody, autoFocus };
      }
    },
    [injectContent, scrollY]
  );

  const closeNote = useCallback(() => {
    const note = activeNoteRef.current;
    if (!note) {
      return;
    }
    if (persistDebounceRef.current) {
      clearTimeout(persistDebounceRef.current);
    }

    const trimmed = bodyRef.current.trim();
    const isEmpty =
      (trimmed === "" || HEADING_ONLY_RE.test(trimmed)) && note.title === null;
    const bodyChanged = bodyRef.current !== note.initialBody;

    if (isEmpty) {
      deleteNoteRef.current(note.id);
    } else if (bodyChanged) {
      updateNoteRef.current(note.id, {
        body: bodyRef.current,
        updatedAt: Date.now(),
      });
    }

    setActiveNote(null);
    activeNoteRef.current = null;
    webViewRef.current?.injectJavaScript(
      'window.composerBridge?.setContent(""); true;'
    );
  }, []);

  const dismissKeyboard = useCallback(() => {
    webViewRef.current?.injectJavaScript(
      "document.activeElement?.blur(); true;"
    );
  }, []);

  const onEditorReady = useCallback(() => {
    setIsEditorReady(true);
    isEditorReadyRef.current = true;
    if (pendingOpenRef.current) {
      const { body: pendingBody, autoFocus } = pendingOpenRef.current;
      pendingOpenRef.current = null;
      injectContent(pendingBody, autoFocus);
    }
  }, [injectContent]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as {
          type: string;
          markdown?: string;
          scrollTop?: number;
          scrollHeight?: number;
          clientHeight?: number;
        };

        if (data.type === "editorReady") {
          onEditorReady();
        } else if (data.type === "change" && data.markdown !== undefined) {
          const { markdown } = data;
          setBody(markdown);
          bodyRef.current = markdown;
          if (persistDebounceRef.current) {
            clearTimeout(persistDebounceRef.current);
          }
          const noteId = activeNoteRef.current?.id;
          if (noteId) {
            persistDebounceRef.current = setTimeout(() => {
              updateNoteRef.current(noteId, {
                body: markdown,
                updatedAt: Date.now(),
              });
            }, PERSIST_DEBOUNCE_MS);
          }
        } else if (data.type === "scroll") {
          scrollY.setValue(data.scrollTop ?? 0);
          setEditorScrollHeight(data.scrollHeight ?? 0);
          setEditorClientHeight(data.clientHeight ?? 0);
        }
      } catch {
        // non-JSON WebView message — ignore
      }
    },
    [onEditorReady, scrollY]
  );

  return (
    <EditorContext.Provider
      value={{
        webViewRef,
        isEditorReady,
        activeNote,
        body,
        keyboardVisible,
        scrollIndicatorHeight,
        scrollIndicatorPosition,
        openNote,
        closeNote,
        dismissKeyboard,
        handleMessage,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}
