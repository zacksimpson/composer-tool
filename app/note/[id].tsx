import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Toast } from "@/components/Toast";
import { useComposer } from "@/contexts/ComposerContext";
import { useEditor } from "@/contexts/EditorContext";

export default function NoteEditorScreen() {
  const { id, autoFocus, toast } = useLocalSearchParams<{
    id: string;
    autoFocus?: string;
    toast?: string;
  }>();

  const { notes } = useComposer();
  const { openNote, closeNote } = useEditor();

  const note = notes.find((n) => n.id === id);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const mountParamsRef = useRef({
    id,
    body: note?.body ?? "",
    title: note?.title ?? null,
    autoFocus: autoFocus === "1",
  });

  useEffect(() => {
    const {
      id: noteId,
      body: initialBody,
      title,
      autoFocus: af,
    } = mountParamsRef.current;
    openNote({ id: noteId, body: initialBody, title, autoFocus: af });
    return closeNote;
  }, [openNote, closeNote]);

  useFocusEffect(
    useCallback(() => {
      if (toast) {
        setToastMessage(toast);
        setToastVisible(true);
        router.setParams({ toast: undefined });
      }
    }, [toast])
  );

  if (!note) {
    return null;
  }

  return (
    <>
      <SafeAreaView
        edges={["top"]}
        pointerEvents="box-none"
        style={styles.container}
      />
      <Toast
        message={toastMessage}
        onHide={() => setToastVisible(false)}
        visible={toastVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
