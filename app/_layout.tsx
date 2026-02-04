// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { View, StyleSheet, Image, Animated, Text, Dimensions } from "react-native";
import PinLockScreen from "@/components/PinLockScreen";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function CustomSplashScreen({ onFinish }: { onFinish: () => void }) {
    const { isLoaded } = useApp();
    const fadeAnim = React.useRef(new Animated.Value(1)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
    const textTranslateY = React.useRef(new Animated.Value(0)).current;
    const textOpacity = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const hideNativeSplash = async () => {
            await SplashScreen.hideAsync();
        };
        hideNativeSplash();

        // Initial entrance animation
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 7,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(textOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        // Bouncing text animation loop
        const bounceAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(textTranslateY, {
                    toValue: -10,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(textTranslateY, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        );
        bounceAnimation.start();

        return () => bounceAnimation.stop();
    }, []);

    // Watch for isLoaded to trigger exit
    React.useEffect(() => {
        if (isLoaded) {
            // Smooth exit after a minimum short delay to show the brand
            setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }).start(() => onFinish());
            }, 1000);
        }
    }, [isLoaded]);

    return (
        <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
            <View style={styles.splashContent}>
                <Animated.Image
                    source={require("@/assets/images/adaptive-icon.png")}
                    style={[styles.splashIcon, { transform: [{ scale: scaleAnim }] }]}
                    resizeMode="contain"
                />
                <Animated.Text style={[styles.splashText, {
                    opacity: textOpacity,
                    transform: [{ translateY: textTranslateY }]
                }]}>
                    EDDU
                </Animated.Text>
            </View>
        </Animated.View>
    );
}

function RootLayoutNav() {
    const { settings, isLoaded } = useApp();
    const [isUnlocked, setIsUnlocked] = useState(false);

    // Effect to handle initial unlock state
    React.useEffect(() => {
        if (isLoaded) {
            if (!settings.appPin) {
                setIsUnlocked(true);
            }
        }
    }, [isLoaded, settings.appPin]);

    const showPinLock = isLoaded && !!settings.appPin && !isUnlocked;

    return (
        <View style={styles.root}>
            <StatusBar style={settings.darkMode ? "light" : "dark"} />
            <Stack screenOptions={{ headerBackTitle: "Back" }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="modal"
                    options={{
                        presentation: "transparentModal",
                        headerShown: false,
                        animation: "fade_from_bottom",
                        contentStyle: { backgroundColor: 'transparent' }
                    }}
                />
            </Stack>
            {showPinLock && (
                <PinLockScreen
                    storedPin={settings.appPin!}
                    onSuccess={() => setIsUnlocked(true)}
                />
            )}
            <Toast />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    splashContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#FFFFFF", // White to blend with icon background
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
    },
    splashContent: {
        alignItems: "center",
        justifyContent: "center",
    },
    splashIcon: {
        width: 200,
        height: 200,
    },
    splashText: {
        fontSize: 48,
        fontWeight: "800",
        color: "#F57C00",
        marginTop: 20,
        letterSpacing: 4, // Make it look premium/fancy
        fontFamily: "System", // Or custom font if available
    }
});

export default function RootLayout() {
    const [isSplashAnimationFinished, setIsSplashAnimationFinished] = useState(false);

    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <AppProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                        <RootLayoutNav />
                        {!isSplashAnimationFinished && (
                            <CustomSplashScreen onFinish={() => setIsSplashAnimationFinished(true)} />
                        )}
                    </GestureHandlerRootView>
                </AppProvider>
            </QueryClientProvider>
        </SafeAreaProvider>
    );
}
