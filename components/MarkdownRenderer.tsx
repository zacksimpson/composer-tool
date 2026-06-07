import Markdown from "@ronradtke/react-native-markdown-display";
import { StyleSheet } from "react-native";
import { n } from "@/utils/scaling";

interface MarkdownRendererProps {
  children: string;
  textColor: string;
}

export function MarkdownRenderer({
  children,
  textColor,
}: MarkdownRendererProps) {
  return <Markdown style={markdownStyles(textColor)}>{children}</Markdown>;
}

const markdownStyles = (textColor: string) =>
  StyleSheet.create({
    body: {
      color: textColor,
      fontFamily: "PublicSans-Regular",
      fontSize: n(18),
      lineHeight: n(28),
    },
    heading1: {
      color: textColor,
      fontFamily: "PublicSans-Regular",
      fontSize: n(28),
      lineHeight: n(38),
      marginBottom: n(4),
      marginTop: n(8),
      fontWeight: "600",
    },
    heading2: {
      color: textColor,
      fontFamily: "PublicSans-Regular",
      fontSize: n(24),
      lineHeight: n(34),
      marginBottom: n(3),
      marginTop: n(6),
      fontWeight: "600",
    },
    heading3: {
      color: textColor,
      fontFamily: "PublicSans-Regular",
      fontSize: n(21),
      lineHeight: n(30),
      marginBottom: n(2),
      marginTop: n(4),
      fontWeight: "600",
    },
    strong: {
      fontWeight: "700",
      color: textColor,
    },
    em: {
      fontStyle: "italic",
      color: textColor,
    },
    code_inline: {
      color: textColor,
      fontFamily: "PublicSans-Regular",
      fontSize: n(16),
      backgroundColor: "transparent",
      borderWidth: n(1),
      borderColor: textColor,
      borderRadius: n(2),
      paddingHorizontal: n(4),
    },
    blockquote: {
      borderLeftWidth: n(2),
      borderLeftColor: textColor,
      paddingLeft: n(12),
      marginLeft: 0,
      opacity: 0.7,
    },
    bullet_list: {
      marginLeft: n(4),
    },
    ordered_list: {
      marginLeft: n(4),
    },
    list_item: {
      color: textColor,
      fontFamily: "PublicSans-Regular",
      fontSize: n(18),
      lineHeight: n(28),
    },
    bullet_list_icon: {
      color: textColor,
      marginTop: n(8),
    },
    ordered_list_icon: {
      color: textColor,
      fontFamily: "PublicSans-Regular",
      fontSize: n(18),
    },
    paragraph: {
      marginBottom: n(6),
    },
    // Suppress unsupported block-level elements
    fence: { display: "none" },
    code_block: { display: "none" },
    hr: {
      backgroundColor: textColor,
      height: n(1),
      marginVertical: n(10),
      opacity: 0.4,
    },
  });
