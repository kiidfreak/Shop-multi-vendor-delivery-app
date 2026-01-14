// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { View, StyleSheet, Image, Animated, Text, Dimensions, Platform } from "react-native";

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

    // Wave effect for tagline
    const [taglineChars] = useState("Stay High, Stay Fly".split(""));
    const charAnimations = React.useRef(taglineChars.map(() => new Animated.Value(0))).current;

    React.useEffect(() => {
        const animations = taglineChars.map((_, i) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 50),
                    Animated.timing(charAnimations[i], {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(charAnimations[i], {
                        toValue: 0.3,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            );
        });
        Animated.parallel(animations).start();
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
            }, 2000); // Extended a bit for effect
        }
    }, [isLoaded]);

    return (
        <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
            <View style={styles.splashContent}>
                <Animated.Image
                    source={require("@/assets/images/adaptive-icon.png")}
                    style={[styles.splashIcon, { transform: [{ scale: scaleAnim }] }]}
                    resizeMode="cover"
                />
                <Animated.Text style={[styles.splashText, {
                    opacity: textOpacity,
                    transform: [{ translateY: textTranslateY }]
                }]}>
                    MAYHEM
                </Animated.Text>

                <View style={styles.taglineContainer}>
                    {taglineChars.map((char, index) => (
                        <Animated.Text
                            key={index}
                            style={[
                                styles.taglineChar,
                                { opacity: charAnimations[index] }
                            ]}
                        >
                            {char}
                        </Animated.Text>
                    ))}
                </View>
            </View>
        </Animated.View>
    );
}

function RootLayoutNav() {
    const { settings, currentUser, isLoaded } = useApp();
    const router = useRouter();
    const [hasRedirected, setHasRedirected] = useState(false);

    React.useEffect(() => {
        if (isLoaded && !currentUser && !hasRedirected) {
            router.replace("/onboarding");
            setHasRedirected(true);
        }
    }, [isLoaded, currentUser, hasRedirected]);

    return (
        <View style={styles.root}>
            <StatusBar style={settings.darkMode ? "light" : "dark"} />
            <Stack screenOptions={{ headerBackTitle: "Back" }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "fade" }} />
                <Stack.Screen
                    name="modal"
                    options={{
                        presentation: "transparentModal",
                        headerShown: false,
                        animation: "fade_from_bottom",
                        contentStyle: { backgroundColor: 'transparent' }
                    }}
                />
                <Stack.Screen
                    name="riders"
                    options={{
                        headerShown: false,
                        presentation: "card",
                    }}
                />
                <Stack.Screen
                    name="inventory"
                    options={{
                        headerShown: false,
                        presentation: "card",
                    }}
                />
            </Stack>
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
        backgroundColor: "#000000",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
    },
    splashContent: {
        alignItems: "center",
        justifyContent: "center",
    },
    splashIcon: {
        width: 180,
        height: 180,
        borderRadius: 90, // Circular profile-like
        borderWidth: 4,
        borderColor: "#009B3A", // Rasta Green border
        backgroundColor: '#1a1a1a',
    },
    splashText: {
        fontSize: 52,
        fontWeight: "900",
        color: "#FFF",
        marginTop: 24,
        letterSpacing: 6,
        fontStyle: "italic", // Fun effect
        textShadowColor: "rgba(0, 155, 58, 0.75)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    taglineContainer: {
        flexDirection: "row",
        marginTop: 16,
    },
    taglineChar: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FED100", // Rasta Yellow
        fontFamily: Platform.OS === 'ios' ? 'Chalkboard SE' : 'monospace', // Attempt at 'fun' font
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
