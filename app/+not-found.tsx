import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useApp } from "@/contexts/AppContext";
import { useMemo } from "react";

export default function NotFoundScreen() {
  const { colors: Colors } = useApp();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return (
    <>
      <Stack.Screen options={{ title: "Oops!", headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn&apos;t exist.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const createStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: Colors.primary,
  },
});
