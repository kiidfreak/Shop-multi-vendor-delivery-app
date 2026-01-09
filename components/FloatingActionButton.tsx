import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Plus } from "lucide-react-native";
import React from "react";
import { StyleSheet, Pressable, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FloatingActionButton() {
    const insets = useSafeAreaInsets();

    const bottomOffset = (Platform.OS === 'android' ? 90 : 80) + (insets.bottom || 0);

    return (
        <View style={styles.container} pointerEvents="box-none">
            <Pressable
                style={({ pressed }) => [
                    styles.fab,
                    {
                        bottom: bottomOffset,
                        right: 25
                    },
                    pressed && styles.fabPressed,
                ]}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    router.push("/modal");
                }}
            >
                <Plus size={36} color="#FFFFFF" strokeWidth={4} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "box-none",
        zIndex: 99999,
    },
    fab: {
        position: "absolute",
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: "#FF6D00",
        alignItems: "center",
        justifyContent: "center",
        // Multi-layered high-end shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 15,
    },
    fabPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.88 }],
    },
});
