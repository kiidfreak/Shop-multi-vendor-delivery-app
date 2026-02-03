import { Link, Stack, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Users, BarChart3, TrendingUp, DollarSign, AlertCircle, Package, Plus, User, Settings, Store, ChevronDown, Sun, Moon } from "lucide-react-native";
import React, { useState, useCallback, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, Pressable, useWindowDimensions, Modal, TouchableWithoutFeedback, Image, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";

import type { SellerAnalytics } from "@/types";

export default function DashboardScreen() {
    const { getTodaySummary, getSellerAnalytics, getDailyInventorySnapshot, inventory, deliveries, isLoaded, settings, colors: Colors } = useApp();
    const styles = React.useMemo(() => createStyles(Colors), [Colors]);
    const { width: windowWidth } = useWindowDimensions();
    const [activeSlide, setActiveSlide] = React.useState(0);
    const [showMenu, setShowMenu] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const carouselRef = React.useRef<ScrollView>(null);
    const navigation = useNavigation();

    // Scroll to first slide when dashboard tab is pressed while already on dashboard
    useEffect(() => {
        const unsubscribe = navigation.getParent()?.addListener("tabPress", (e: any) => {
            const isFocused = navigation.isFocused();
            if (isFocused) {
                carouselRef.current?.scrollTo({ x: 0, animated: true });
                setActiveSlide(0);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
        });
        return unsubscribe;
    }, [navigation]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Simulate refresh - data updates automatically from context
        setTimeout(() => setRefreshing(false), 800);
    }, []);

    const currentHour = new Date().getHours();
    const isNight = currentHour >= 18 || currentHour < 6;
    const summary = getTodaySummary();
    const sellers = getSellerAnalytics();
    const inventorySnapshot = getDailyInventorySnapshot();

    const lowStockItems = inventory.filter(
        (item) => item.currentStock <= item.lowStockThreshold
    );

    const unpaidDeliveries = deliveries.filter((d) => !d.isPaid);
    const totalUnpaid = unpaidDeliveries.reduce((sum, d) => sum + (d.totalAmount - (d.paidAmount || 0)), 0);

    // Handle carousel tap to navigate
    const handleSlidePress = () => {
        const nextSlide = (activeSlide + 1) % 3; // Now we have 3 slides
        setActiveSlide(nextSlide);
        carouselRef.current?.scrollTo({
            x: nextSlide * (windowWidth - 30),
            animated: true,
        });
        Haptics.selectionAsync();
    };

    if (!isLoaded) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading your data...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Sticky Header with Greeting and Profile */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <View>
                        <View style={styles.greetingRow}>
                            <Text style={styles.greeting}>Hello, {settings.userName}!</Text>
                            {isNight ? (
                                <Moon size={20} color={Colors.primary} fill={Colors.secondary} />
                            ) : (
                                <Sun size={24} color="#FFB300" fill="#FFD54F" />
                            )}
                        </View>
                        <Text style={styles.subtitle}>{settings.businessName}</Text>
                    </View>
                    <Pressable
                        style={styles.profileButton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowMenu(true);
                        }}
                    >
                        <View style={styles.profileImageContainer}>
                            {settings.profileImage ? (
                                <Image source={{ uri: settings.profileImage }} style={styles.profileImage} />
                            ) : (
                                <User size={24} color={Colors.primary} />
                            )}
                        </View>
                        <ChevronDown size={16} color={Colors.textLight} />
                    </Pressable>
                </View>
            </View>

            {/* Dropdown Menu Modal */}
            <Modal
                visible={showMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowMenu(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                    <View style={styles.menuOverlay}>
                        <View style={[styles.menuContainer, { right: 20, top: 80 }]}>
                            <Pressable
                                style={styles.menuItem}
                                onPress={() => {
                                    setShowMenu(false);
                                    router.push("/analytics");
                                }}
                            >
                                <BarChart3 size={20} color={Colors.primary} />
                                <Text style={styles.menuItemText}>View Analytics</Text>
                            </Pressable>

                            <Pressable
                                style={styles.menuItem}
                                onPress={() => {
                                    setShowMenu(false);
                                    router.push({ pathname: "/(tabs)/profile", params: { action: "add-shop" } });
                                }}
                            >
                                <Store size={20} color={Colors.textLight} />
                                <Text style={styles.menuItemText}>Add Shop</Text>
                            </Pressable>

                            <Pressable
                                style={styles.menuItem}
                                onPress={() => {
                                    setShowMenu(false);
                                    router.push({ pathname: "/(tabs)/profile", params: { action: "add-seller" } });
                                }}
                            >
                                <User size={20} color={Colors.textLight} />
                                <Text style={styles.menuItemText}>Add Seller</Text>
                            </Pressable>

                            <View style={styles.menuDivider} />

                            <Pressable
                                style={styles.menuItem}
                                onPress={() => {
                                    setShowMenu(false);
                                    router.push("/(tabs)/profile");
                                }}
                            >
                                <Settings size={20} color={Colors.textLight} />
                                <Text style={styles.menuItemText}>Settings</Text>
                            </Pressable>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                        progressBackgroundColor={Colors.card}
                    />
                }
            >
                <View style={styles.statsContainer}>
                    <ScrollView
                        ref={carouselRef}
                        horizontal
                        snapToInterval={windowWidth - 30}
                        decelerationRate="fast"
                        snapToAlignment="start"
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                        onScroll={(e) => {
                            const slide = Math.round(e.nativeEvent.contentOffset.x / (windowWidth - 30));
                            if (slide !== activeSlide) {
                                setActiveSlide(slide);
                                Haptics.selectionAsync();
                            }
                        }}
                        scrollEventThrottle={16}
                    >
                        {/* Slide 1: Today's Overview */}
                        <Pressable onPress={handleSlidePress} style={[styles.slide, { width: windowWidth - 30 }]}>
                            <View style={[styles.statCard, styles.primaryCard]}>
                                <View style={styles.statIconContainer}>
                                    <TrendingUp size={24} color={Colors.card} />
                                </View>
                                <Text style={styles.statLabel}>Today&apos;s Sales</Text>
                                <Text style={styles.statValue}>KES {summary.totalSales.toLocaleString()}</Text>
                                <View style={styles.slideFooter}>
                                    <View style={styles.miniStat}>
                                        <Text style={styles.miniStatLabel}>Paid</Text>
                                        <Text style={styles.miniStatValue}>KES {summary.totalPaid.toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.miniStat}>
                                        <Text style={styles.miniStatLabel}>Pending</Text>
                                        <Text style={styles.miniStatValue}>KES {summary.totalUnpaid.toLocaleString()}</Text>
                                    </View>
                                </View>
                            </View>
                        </Pressable>

                        {/* Slide 2: Seller Stats */}
                        <Pressable onPress={handleSlidePress} style={[styles.slide, { width: windowWidth - 30 }]}>
                            <View style={[styles.statCard, styles.sellersCard]}>
                                <View style={styles.statHeader}>
                                    <View style={styles.statIconContainer}>
                                        <Users size={24} color={Colors.card} />
                                    </View>
                                    <Text style={styles.statLabel}>Seller Performance</Text>
                                </View>
                                <ScrollView style={styles.sellersList}>
                                    {sellers.map((s: SellerAnalytics) => (
                                        <View key={s.seller.id} style={styles.sellerRow}>
                                            <Text style={styles.sellerName} numberOfLines={1}>{s.seller.name}</Text>
                                            <View style={styles.sellerStats}>
                                                <Text style={styles.sellerAmount}>KES {s.totalSales.toLocaleString()}</Text>
                                                <Text style={styles.sellerPending}>KES {s.totalPending.toLocaleString()} pending</Text>
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        </Pressable>

                        {/* Slide 3: Daily Inventory & Profit */}
                        <Pressable onPress={handleSlidePress} style={[styles.slide, { width: windowWidth - 30 }]}>
                            <View style={[styles.statCard, styles.inventoryCard]}>
                                <View style={styles.statHeader}>
                                    <View style={styles.statIconContainer}>
                                        <Package size={24} color={Colors.card} />
                                    </View>
                                    <Text style={styles.statLabel}>Today's Inventory</Text>
                                </View>
                                <View style={styles.inventoryContent}>
                                    <View style={styles.profitRow}>
                                        <Text style={styles.profitLabel}>Revenue</Text>
                                        <Text style={styles.profitValue}>KES {inventorySnapshot.totalRevenue.toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.profitRow}>
                                        <Text style={styles.profitLabel}>Items Sold</Text>
                                        <Text style={styles.profitValue}>{inventorySnapshot.totalItemsSold}</Text>
                                    </View>
                                    {inventorySnapshot.itemsDelivered.map((item, idx) => (
                                        <View key={idx} style={styles.inventoryItemRow}>
                                            <Text style={styles.inventoryItemName}>{item.name}</Text>
                                            <Text style={styles.inventoryItemQty}>{item.quantity} units • KES {item.revenue.toLocaleString()}</Text>
                                        </View>
                                    ))}
                                    {inventorySnapshot.itemsDelivered.length === 0 && (
                                        <Text style={styles.emptyInventoryText}>No sales yet today</Text>
                                    )}
                                </View>
                            </View>
                        </Pressable>
                    </ScrollView>

                    <View style={styles.dotContainer}>
                        <View style={[styles.dot, activeSlide === 0 && styles.activeDot]} />
                        <View style={[styles.dot, activeSlide === 1 && styles.activeDot]} />
                        <View style={[styles.dot, activeSlide === 2 && styles.activeDot]} />
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Pending Payments</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unpaidDeliveries.length}</Text>
                        </View>
                    </View>

                    {unpaidDeliveries.length === 0 ? (
                        <View style={styles.emptyState}>
                            <DollarSign size={40} color={Colors.textLight} />
                            <Text style={styles.emptyStateText}>All payments collected!</Text>
                        </View>
                    ) : (
                        <Pressable
                            style={({ pressed }) => [styles.card, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push("/shops");
                            }}
                        >
                            <Text style={styles.totalUnpaidText}>
                                Total Pending: <Text style={styles.totalUnpaidAmount}>KES {totalUnpaid.toLocaleString()}</Text>
                            </Text>
                            <Text style={styles.helpText}>Tap to go to Shops and mark payments</Text>
                        </Pressable>
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Inventory Alerts</Text>
                        <View style={[styles.badge, lowStockItems.length > 0 && styles.badgeWarning]}>
                            <Text style={styles.badgeText}>{lowStockItems.length}</Text>
                        </View>
                    </View>

                    {lowStockItems.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Package size={40} color={Colors.textLight} />
                            <Text style={styles.emptyStateText}>All items well stocked</Text>
                        </View>
                    ) : (
                        <View style={styles.card}>
                            {lowStockItems.map((item) => (
                                <View key={item.id} style={styles.alertItem}>
                                    <View style={styles.alertDot} />
                                    <View style={styles.alertContent}>
                                        <Text style={styles.alertTitle}>{item.name}</Text>
                                        <Text style={styles.alertText}>
                                            Only {item.currentStock} {item.unit} remaining
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Extra spacing at bottom for alerts to be visible */}
                <View style={{ height: 20 }} />
            </ScrollView >

        </SafeAreaView >
    );
}

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: Colors.textLight,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 20,
    },
    greeting: {
        fontSize: 28,
        fontWeight: "700" as const,
        color: Colors.text,
    },
    greetingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 18,
        color: Colors.textLight,
        fontWeight: "600" as const,
    },
    statsContainer: {
        paddingHorizontal: 20,
        gap: 12,
    },
    statCard: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 20,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
    },
    primaryCard: {
        backgroundColor: Colors.primary,
    },
    successCard: {
        backgroundColor: Colors.card,
        borderWidth: 2,
        borderColor: Colors.success,
    },
    errorCard: {
        backgroundColor: Colors.card,
        borderWidth: 2,
        borderColor: Colors.error,
    },
    halfCard: {
        flex: 1,
    },
    row: {
        flexDirection: "row",
        gap: 12,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#FF8F2980",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 18,
        fontWeight: "900" as const,
        color: Colors.card,
        opacity: 1,
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    statSubtext: {
        fontSize: 12,
        color: Colors.secondary,
    },
    smallStatLabel: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 8,
        marginBottom: 4,
    },
    smallStatValue: {
        fontSize: 20,
        fontWeight: "700" as const,
        color: Colors.text,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700" as const,
        color: Colors.text,
        marginRight: 8,
    },
    badge: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 24,
        alignItems: "center",
    },
    badgeWarning: {
        backgroundColor: Colors.warning,
    },
    badgeText: {
        color: Colors.card,
        fontSize: 12,
        fontWeight: "700" as const,
    },
    card: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 16,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
    },
    emptyState: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyStateText: {
        marginTop: 12,
        fontSize: 16,
        color: Colors.textLight,
    },
    totalUnpaidText: {
        fontSize: 16,
        color: Colors.text,
        marginBottom: 8,
    },
    totalUnpaidAmount: {
        fontSize: 18,
        fontWeight: "700" as const,
        color: Colors.error,
    },
    helpText: {
        fontSize: 14,
        color: Colors.textLight,
    },
    alertItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    alertDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.warning,
        marginTop: 6,
        marginRight: 12,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: "600" as const,
        color: Colors.text,
        marginBottom: 4,
    },
    alertText: {
        fontSize: 14,
        color: Colors.textLight,
    },
    syncStatus: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: "flex-start",
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "rgba(0, 0, 0, 0.05)",
    },
    syncDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.success,
        marginRight: 6,
    },
    syncText: {
        fontSize: 10,
        fontWeight: "600" as const,
        color: Colors.textLight,
        textTransform: "uppercase" as const,
    },
    fabPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.9 }],
    },
    carouselContent: {
        paddingRight: 20, // Hint of next card
    },
    slide: {
        paddingRight: 10,
    },
    sellersCard: {
        backgroundColor: Colors.text,
    },
    statHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    sellersList: {
        height: 120,
    },
    sellerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.1)",
    },
    sellerName: {
        color: Colors.card,
        fontSize: 14,
        fontWeight: "600" as const,
        flex: 1,
    },
    sellerStats: {
        alignItems: "flex-end",
    },
    sellerAmount: {
        color: Colors.card,
        fontSize: 14,
        fontWeight: "700" as const,
    },
    sellerPending: {
        color: Colors.error,
        fontSize: 10,
        fontWeight: "500" as const,
    },
    slideFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.1)",
    },
    miniStat: {
        flex: 1,
    },
    miniStatLabel: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 10,
        textTransform: "uppercase" as const,
        marginBottom: 2,
    },
    miniStatValue: {
        color: Colors.card,
        fontSize: 14,
        fontWeight: "700" as const,
    },
    miniStatPaid: {
        backgroundColor: "rgba(76, 175, 80, 0.3)",
        borderWidth: 1,
        borderColor: "rgba(76, 175, 80, 0.5)",
    },
    miniStatPending: {
        backgroundColor: "rgba(255, 152, 0, 0.3)",
        borderWidth: 1,
        borderColor: "rgba(255, 152, 0, 0.5)",
    },
    miniStatValuePaid: {
        color: "#E8F5E9",
    },
    miniStatValuePending: {
        color: "#FFF3E0",
    },
    dotContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
        marginTop: 12,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(0, 0, 0, 0.1)",
    },
    activeDot: {
        backgroundColor: Colors.primary,
        width: 16,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    profileButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        padding: 4,
        borderRadius: 20,
    },
    profileImageContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.secondary,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    profileImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.1)",
    },
    menuContainer: {
        position: "absolute",
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 8,
        width: 200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: 10,
    },
    menuItemText: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: Colors.text,
    },
    menuDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 4,
        marginHorizontal: 12,
    },
    inventoryCard: {
        backgroundColor: Colors.card,
        borderRadius: 20,
        padding: 20,
        minHeight: 180,
    },
    inventoryContent: {
        marginTop: 12,
        gap: 8,
    },
    profitRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    profitLabel: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: Colors.mutedText,
    },
    profitValue: {
        fontSize: 16,
        fontWeight: "700" as const,
        color: Colors.text,
    },
    inventoryItemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 6,
    },
    inventoryItemName: {
        fontSize: 13,
        fontWeight: "600" as const,
        color: Colors.text,
        flex: 1,
    },
    inventoryItemQty: {
        fontSize: 12,
        fontWeight: "500" as const,
        color: Colors.mutedText,
    },
    emptyInventoryText: {
        fontSize: 13,
        color: Colors.mutedText,
        textAlign: "center" as const,
        marginTop: 16,
        fontStyle: "italic" as const,
    },
});
