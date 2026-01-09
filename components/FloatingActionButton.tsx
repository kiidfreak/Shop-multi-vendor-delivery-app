import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Plus } from "lucide-react-native";
import React, { useRef } from "react";
import { StyleSheet, TouchableOpacity, Platform, View, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FloatingActionButton() {
    const insets = useSafeAreaInsets();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const bottomOffset = (Platform.OS === 'android' ? 90 : 80) + (insets.bottom || 0);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.85,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 12,
            bounciness: 10,
        }).start();
    };

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        router.push("/modal");
    };

    return (
        <View style={styles.container} pointerEvents="box-none">
            <Animated.View
                style={[
                    styles.fab,
                    {
                        bottom: bottomOffset,
                        right: 25,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.fabTouchable}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handlePress}
                    activeOpacity={1}
                >
                    <Plus size={36} color="#FFFFFF" strokeWidth={4} />
                </TouchableOpacity>
            </Animated.View>
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 15,
    },
    fabTouchable: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
});
