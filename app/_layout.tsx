// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "@/contexts/AppContext";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { View, StyleSheet, Image, Animated, Text, Dimensions } from "react-native";
import Colors from "@/constants/colors";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function CustomSplashScreen({ onFinish }: { onFinish: () => void }) {
    const fadeAnim = React.useRef(new Animated.Value(1)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
    const textTranslateY = React.useRef(new Animated.Value(20)).current;
    const textOpacity = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        // Hide native splash immediately when this component mounts
        const hideNativeSplash = async () => {
            await SplashScreen.hideAsync();
        };
        hideNativeSplash();

        Animated.sequence([
            // Animate Icon and Text
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 7,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.delay(100),
                    Animated.parallel([
                        Animated.spring(textTranslateY, {
                            toValue: 0,
                            friction: 6,
                            tension: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(textOpacity, {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                    ]),
                ]),
            ]),
            // Wait a bit to show off the logo
            Animated.delay(1200),
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start(() => onFinish());
    }, []);

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
    return (
        <View style={styles.root}>
            <StatusBar style="dark" />
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
        backgroundColor: "#F57C00", // Vibrant Orange
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
        color: "#FFFFFF",
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
