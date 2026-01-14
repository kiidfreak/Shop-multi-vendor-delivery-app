import { Tabs } from "expo-router";
import { Home, Package, User } from "lucide-react-native";
import React from "react";
import { View, StyleSheet, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";

export default function TabLayout() {
    const { colors: Colors, activeRole, orders, currentRider } = useApp();
    const insets = useSafeAreaInsets();

    // Calculate badge count - ONLY for Admin pending orders
    const pendingCount = orders.filter(o => o.status === "Pending").length;

    // Badge only shows for Admin role with pending orders
    const badgeCount = activeRole === "ADMIN" ? pendingCount : 0;

    return (
        <View style={styles.container}>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: Colors.tabBarActive,
                    tabBarInactiveTintColor: Colors.tabBarInactive,
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: Colors.card,
                        borderTopColor: Colors.border,
                        borderTopWidth: 0,
                        height: 52 + (insets.bottom > 0 ? insets.bottom - 10 : 0),
                        paddingBottom: insets.bottom > 0 ? insets.bottom - 10 : 0,
                    },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: activeRole === "USER" ? "Mayhem" : activeRole === "RIDER" ? "Duty" : "Overview",
                        tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="orders"
                    options={{
                        title: activeRole === "USER" ? "My Stash" : activeRole === "RIDER" ? "Tasks" : "Control",
                        href: activeRole === "RIDER" ? null : undefined, // Hide for riders
                        tabBarIcon: ({ color }) => (
                            <View>
                                <Package size={24} color={color} />
                                {badgeCount > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
                                    </View>
                                )}
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: activeRole === "USER" ? "Fam" : activeRole === "RIDER" ? "Ops" : "God Mode",
                        tabBarIcon: ({ color }) => <User size={24} color={color} />,
                    }}
                />

                {/* Hide old routes */}
                <Tabs.Screen name="shops" options={{ href: null }} />

            </Tabs>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -10,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
