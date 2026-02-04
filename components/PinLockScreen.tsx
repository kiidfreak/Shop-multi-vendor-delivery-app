import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock, ShieldCheck } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";

interface PinLockScreenProps {
    storedPin: string;
    onSuccess: () => void;
}

export default function PinLockScreen({ storedPin, onSuccess }: PinLockScreenProps) {
    const { colors: Colors } = useApp();
    const [pinInput, setPinInput] = useState("");
    const [pinError, setPinError] = useState(false);

    const handlePinPress = (num: string) => {
        if (pinInput.length < 4) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const newPin = pinInput + num;
            setPinInput(newPin);
            setPinError(false);

            if (newPin.length === 4) {
                verifyPin(newPin);
            }
        }
    };

    const handlePinBackspace = () => {
        if (pinInput.length > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPinInput(pinInput.slice(0, -1));
            setPinError(false);
        }
    };

    const verifyPin = async (input: string) => {
        // Small delay for visual feedback of 4th dot
        await new Promise(resolve => setTimeout(resolve, 100));

        if (input === storedPin) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSuccess();
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Vibration.vibrate();
            setPinError(true);
            setPinInput("");
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.secondary }]}>
                    <Lock size={32} color={Colors.primary} />
                </View>
                <Text style={[styles.title, { color: Colors.text }]}>Eddu Locked</Text>
                <Text style={[styles.subtitle, { color: Colors.textLight }]}>Enter your PIN to continue</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.dotsContainer}>
                    {[1, 2, 3, 4].map((i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                { borderColor: Colors.textLight },
                                pinInput.length >= i && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                                pinError && { backgroundColor: Colors.error, borderColor: Colors.error }
                            ]}
                        />
                    ))}
                </View>

                <View style={styles.keypad}>
                    <View style={styles.row}>
                        {[1, 2, 3].map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={[styles.key, { backgroundColor: Colors.card, shadowColor: Colors.shadow }]}
                                onPress={() => handlePinPress(num.toString())}
                            >
                                <Text style={[styles.keyText, { color: Colors.text }]}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.row}>
                        {[4, 5, 6].map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={[styles.key, { backgroundColor: Colors.card, shadowColor: Colors.shadow }]}
                                onPress={() => handlePinPress(num.toString())}
                            >
                                <Text style={[styles.keyText, { color: Colors.text }]}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.row}>
                        {[7, 8, 9].map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={[styles.key, { backgroundColor: Colors.card, shadowColor: Colors.shadow }]}
                                onPress={() => handlePinPress(num.toString())}
                            >
                                <Text style={[styles.keyText, { color: Colors.text }]}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.row}>
                        <View style={styles.keyPlaceholder} />
                        <TouchableOpacity
                            style={[styles.key, { backgroundColor: Colors.card, shadowColor: Colors.shadow }]}
                            onPress={() => handlePinPress("0")}
                        >
                            <Text style={[styles.keyText, { color: Colors.text }]}>0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.keyPlaceholder}
                            onPress={handlePinBackspace}
                        >
                            <Text style={[styles.deleteText, { color: Colors.text }]}>⌫</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={styles.securedContainer}>
                        <ShieldCheck size={14} color={Colors.textLight} />
                        <Text style={[styles.securedText, { color: Colors.textLight }]}>Secured by Eddu</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        justifyContent: "space-between",
    },
    header: {
        alignItems: "center",
        marginTop: 60,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
    },
    content: {
        flex: 1,
        justifyContent: "center",
    },
    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 24,
        marginBottom: 60,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
    },
    keypad: {
        paddingHorizontal: 40,
        gap: 20,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    key: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    keyText: {
        fontSize: 28,
        fontWeight: "600",
    },
    keyPlaceholder: {
        width: 72,
        height: 72,
        alignItems: "center",
        justifyContent: "center",
    },
    deleteText: {
        fontSize: 24,
        fontWeight: "600",
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    securedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        opacity: 0.6,
    },
    securedText: {
        fontSize: 12,
        fontWeight: '500',
    }
});
