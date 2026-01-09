import { Tabs, usePathname } from "expo-router";
import { Home, Store, Package, User } from "lucide-react-native";
import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import FloatingActionButton from "@/components/FloatingActionButton";

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const pathname = usePathname();

    // Show FAB only on Dashboard and Shops
    const isDashboard = pathname === "/" || pathname === "/index" || pathname.includes("index");
    const isShops = pathname.includes("shops");
    const showFab = isDashboard || isShops;

    return (
        <View style={styles.container}>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: Colors.primary,
                    tabBarInactiveTintColor: Colors.textLight,
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: Colors.card,
                        borderTopColor: Colors.border,
                        borderTopWidth: 1,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        height: 60 + (insets.bottom || 0),
                        paddingBottom: Math.max(8, insets.bottom),
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 10,
                    },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "Dashboard",
                        tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="shops"
                    options={{
                        title: "Shops",
                        tabBarIcon: ({ color }) => <Store size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="inventory"
                    options={{
                        title: "Inventory",
                        tabBarIcon: ({ color }) => <Package size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: "Profile",
                        tabBarIcon: ({ color }) => <User size={24} color={color} />,
                    }}
                />
            </Tabs>

            {showFab && <FloatingActionButton />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
