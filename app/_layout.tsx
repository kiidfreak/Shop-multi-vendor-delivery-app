// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "@/contexts/AppContext";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { View, StyleSheet } from "react-native";

const queryClient = new QueryClient();

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
    }
});

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <AppProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                        <RootLayoutNav />
                    </GestureHandlerRootView>
                </AppProvider>
            </QueryClientProvider>
        </SafeAreaProvider>
    );
}
