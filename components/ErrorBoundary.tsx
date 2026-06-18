import { Component, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { StyledText } from "@/components/StyledText";
import { n } from "@/utils/scaling";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <StyledText style={styles.message}>Something went wrong.</StyledText>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: n(40),
  },
  message: {
    color: "white",
    fontSize: n(22),
    textAlign: "center",
    lineHeight: n(32),
  },
});
