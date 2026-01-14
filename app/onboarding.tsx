import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";

export default function OnboardingScreen() {
    const { colors, createUserAccount, loginAsGuest, checkPhoneRole, attemptLogin } = useApp();
    const router = useRouter();

    const [phone, setPhone] = useState("");
    const [name, setName] = useState("");
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [detectedRole, setDetectedRole] = useState<"USER" | "RIDER" | "ADMIN">("USER");

    // Check role as they type
    useEffect(() => {
        if (phone.length >= 10) {
            const role = checkPhoneRole(phone);
            setDetectedRole(role);
        } else {
            setDetectedRole("USER");
        }
    }, [phone]);

    const handleCreateAccount = async () => {
        if (!phone || phone.length < 10) {
            Alert.alert("Invalid Phone", "Please enter a valid phone number (at least 10 digits)");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            if (detectedRole !== "USER") {
                if (!pin) {
                    Alert.alert("PIN Required", "This account is linked to a restricted role. Please enter your PIN.");
                    setLoading(false);
                    return;
                }
                const success = await attemptLogin(pin, phone);
                if (success) {
                    router.replace("/(tabs)");
                } else {
                    Alert.alert("Access Denied", "Incorrect PIN for this role.");
                }
            } else {
                await createUserAccount(phone, name || undefined);
                router.replace("/(tabs)");
            }
        } catch (error: any) {
            if (error.message === "ACCOUNT_BANNED") {
                Alert.alert("Account Locked 🚫", "Your account has been banned for violating our terms. Contact support if this is a mistake.");
            } else if (error.message === "IS_RIDER") {
                // User requested: Remove alert, just signal via UI (Color Change)
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                setDetectedRole("RIDER");
            } else {
                Alert.alert("Error", "Failed to create account. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await loginAsGuest();
        router.replace("/(tabs)");
    };

    return (
        <LinearGradient
            colors={["#0B1020", "#1A1A2E", "#0B1020"]}
            style={styles.container}
        >
            <StatusBar style="light" />
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={styles.content}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1 }}
                    >
                        {/* Logo/Brand */}
                        <View style={styles.brandSection}>
                            <Text style={styles.logo}>🔥</Text>
                            <Text style={styles.brandName}>MAYHEM</Text>
                            <Text style={styles.tagline}>Your delivery plug</Text>
                        </View>

                        {/* Form */}
                        <View style={styles.formSection}>
                            <Text style={styles.formTitle}>LOGIN / SIGNUP</Text>
                            <Text style={{ color: colors.textLight, textAlign: 'center', marginBottom: 20 }}>Enter your phone to fetch your stash or start a new one.</Text>

                            <View style={styles.inputContainer}>
                                <Ionicons name="call-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Phone Number"
                                    placeholderTextColor={colors.textLight}
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={setPhone}
                                    maxLength={15}
                                />
                            </View>

                            {detectedRole === "USER" ? (
                                <View style={styles.inputContainer}>
                                    <Ionicons name="person-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        placeholder="Your Name (optional)"
                                        placeholderTextColor={colors.textLight}
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                            ) : (
                                <View style={[styles.inputContainer, { borderColor: detectedRole === "ADMIN" ? colors.accent : colors.secondary, borderWidth: 1 }]}>
                                    <Ionicons name="lock-closed-outline" size={20} color={detectedRole === "ADMIN" ? colors.accent : colors.secondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        placeholder={`Enter ${detectedRole} PIN`}
                                        placeholderTextColor={colors.textLight}
                                        value={pin}
                                        onChangeText={setPin}
                                        keyboardType="number-pad"
                                        secureTextEntry
                                        maxLength={8}
                                    />
                                </View>
                            )}

                            {detectedRole !== "USER" && (
                                <Text style={{ color: detectedRole === "ADMIN" ? colors.accent : colors.secondary, textAlign: 'center', marginBottom: 15, fontWeight: 'bold' }}>
                                    {detectedRole} ACCOUNT DETECTED 🛡️
                                </Text>
                            )}

                            <TouchableOpacity
                                style={[styles.primaryButton, { opacity: loading ? 0.7 : 1 }]}
                                onPress={handleCreateAccount}
                                disabled={loading}
                            >
                                <Text style={styles.primaryButtonText}>
                                    {loading ? "CHECKING TAGS..." : "START MAYHEM 🚀"}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>or</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity
                                style={styles.skipButton}
                                onPress={handleSkip}
                            >
                                <Text style={styles.skipButtonText}>SKIP - Browse as Guest</Text>
                            </TouchableOpacity>

                            <Text style={styles.guestNote}>
                                Guest orders won't be saved
                            </Text>
                        </View>

                        {/* Benefits */}
                        <View style={styles.benefitsSection}>
                            <Text style={styles.benefitsTitle}>Why create an account?</Text>
                            <View style={styles.benefitRow}>
                                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                                <Text style={styles.benefitText}>Track your orders in real-time</Text>
                            </View>
                            <View style={styles.benefitRow}>
                                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                                <Text style={styles.benefitText}>Quick reorder with one tap</Text>
                            </View>
                            <View style={styles.benefitRow}>
                                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                                <Text style={styles.benefitText}>Order history saved forever</Text>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: "space-between",
    },
    brandSection: {
        alignItems: "center",
        marginTop: 40,
    },
    logo: {
        fontSize: 64,
        marginBottom: 8,
    },
    brandName: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#FFF",
        letterSpacing: 4,
    },
    tagline: {
        fontSize: 16,
        color: "rgba(255,255,255,0.6)",
        marginTop: 4,
    },
    formSection: {
        marginTop: 40,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#FFF",
        marginBottom: 24,
        textAlign: "center",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 16,
        marginBottom: 24, // increased spacing
        paddingHorizontal: 20, // increased horizontal padding
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
        height: 60, // Fixed height for consistency
    },
    inputIcon: {
        marginRight: 16, // increased icon spacing
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 18, // larger font
        fontWeight: "500",
        letterSpacing: 0.5,
    },
    primaryButton: {
        backgroundColor: "#00C853",
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 8,
    },
    primaryButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
        letterSpacing: 1,
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.2)",
    },
    dividerText: {
        color: "rgba(255,255,255,0.5)",
        marginHorizontal: 16,
    },
    skipButton: {
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    skipButtonText: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 14,
        fontWeight: "600",
    },
    guestNote: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 12,
        textAlign: "center",
        marginTop: 12,
    },
    benefitsSection: {
        marginTop: 32,
        padding: 20,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 16,
    },
    benefitsTitle: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 12,
    },
    benefitRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
    },
    benefitText: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
    },
});
