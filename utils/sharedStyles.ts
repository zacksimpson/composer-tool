import { StyleSheet } from "react-native";
import { n } from "./scaling";

export const sharedStyles = StyleSheet.create({
  headerBtn: {
    width: n(32),
    height: n(32),
    alignItems: "center",
    paddingTop: n(6),
    paddingRight: n(4),
  },
});
