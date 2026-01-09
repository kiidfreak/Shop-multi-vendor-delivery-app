import { Stack, router } from "expo-router";
import { ArrowLeft, User, Store, DollarSign, TrendingUp, AlertCircle, ChevronLeft, ChevronRight, Calendar } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

export default function AnalyticsScreen() {
    const { getSellerAnalytics, shops, deliveries, sellers } = useApp();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const analytics = getSellerAnalytics();

    const formatDate = (date: Date) => date.toISOString().split("T")[0];
    const displayDate = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (formatDate(date) === formatDate(today)) return "Today";
        if (formatDate(date) === formatDate(yesterday)) return "Yesterday";
        return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    };

    const dateDeliveries = deliveries.filter((d) => d.deliveryDate.startsWith(formatDate(selectedDate)));

    const totalSales = dateDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalPaid = dateDeliveries.reduce((sum, d) => sum + (d.paidAmount || (d.isPaid ? d.totalAmount : 0)), 0);
    const totalPending = totalSales - totalPaid;

    const getShopName = (shopId: string) => {
        return shops.find((s) => s.id === shopId)?.name || "Unknown Shop";
    };

    const getSellerName = (sellerId: string) => {
        return sellers.find((s) => s.id === sellerId)?.name || "Unknown Seller";
    };

    const getSellerDeliveries = (sellerId: string) => {
        return dateDeliveries.filter((d) => {
            const shopName = getShopName(d.shopId).toLowerCase();
            return d.sellerId === sellerId && (searchQuery === "" || shopName.includes(searchQuery.toLowerCase()));
        });
    };

    // Get unique sellers who have deliveries on this date
    const activeSellersOnDate = [...new Set(dateDeliveries.map(d => d.sellerId))];

    const filteredSellers = activeSellersOnDate.filter((sellerId) => {
        if (searchQuery === "") return true;
        const seller = sellers.find(s => s.id === sellerId);
        const sellerMatch = seller?.name.toLowerCase().includes(searchQuery.toLowerCase());
        const shopMatch = getSellerDeliveries(sellerId).length > 0;
        return sellerMatch || shopMatch;
    });

    const goToPrevDay = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const goToNextDay = () => {
        const today = new Date();
        if (formatDate(selectedDate) >= formatDate(today)) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    const goToToday = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedDate(new Date());
    };

    const isToday = formatDate(selectedDate) === formatDate(new Date());

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: "Sales Analytics",
                    headerStyle: { backgroundColor: Colors.background },
                    headerTintColor: Colors.text,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={24} color={Colors.text} />
                        </TouchableOpacity>
                    ),
                }}
            />

            {/* Sticky Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Performance</Text>
                <Text style={styles.subtitle}>Detailed breakdown by seller</Text>

                {/* Date Navigation */}
                <View style={styles.dateNav}>
                    <Pressable style={styles.dateArrow} onPress={goToPrevDay}>
                        <ChevronLeft size={24} color={Colors.primary} />
                    </Pressable>
                    <Pressable style={styles.dateDisplay} onPress={goToToday}>
                        <Calendar size={16} color={Colors.primary} />
                        <Text style={styles.dateText}>{displayDate(selectedDate)}</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.dateArrow, isToday && styles.dateArrowDisabled]}
                        onPress={goToNextDay}
                    >
                        <ChevronRight size={24} color={isToday ? Colors.textLight : Colors.primary} />
                    </Pressable>
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchInputWrapper}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search seller or shop..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={Colors.textLight}
                        />
                    </View>
                </View>
            </View>

            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, styles.primaryCard]}>
                        <TrendingUp size={20} color={Colors.card} />
                        <Text style={styles.statLabel}>Total Sales</Text>
                        <Text style={styles.statValue}>KES {totalSales.toLocaleString()}</Text>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.statCard, styles.successCard, styles.halfCard]}>
                            <DollarSign size={18} color={Colors.success} />
                            <Text style={styles.smallStatLabel}>Paid</Text>
                            <Text style={styles.smallStatValue}>KES {totalPaid.toLocaleString()}</Text>
                        </View>

                        <View style={[styles.statCard, styles.errorCard, styles.halfCard]}>
                            <AlertCircle size={18} color={Colors.error} />
                            <Text style={styles.smallStatLabel}>Pending</Text>
                            <Text style={styles.smallStatValue}>KES {totalPending.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Seller Performance</Text>

                    {filteredSellers.map((sellerId) => {
                        const sellerDeliveries = getSellerDeliveries(sellerId);
                        const sellerTotalSales = sellerDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);
                        const sellerTotalPaid = sellerDeliveries.reduce((sum, d) => sum + (d.paidAmount || (d.isPaid ? d.totalAmount : 0)), 0);
                        const sellerPending = sellerTotalSales - sellerTotalPaid;

                        if (sellerDeliveries.length === 0) return null;

                        return (
                            <View key={sellerId} style={styles.sellerCard}>
                                <View style={styles.sellerHeader}>
                                    <View style={styles.sellerIconContainer}>
                                        <User size={24} color={Colors.primary} />
                                    </View>
                                    <View style={styles.sellerInfo}>
                                        <Text style={styles.sellerName}>{getSellerName(sellerId)}</Text>
                                        <View style={styles.sellerStats}>
                                            <View style={styles.statBadge}>
                                                <Store size={12} color={Colors.textLight} />
                                                <Text style={styles.statBadgeText}>{sellerDeliveries.length} deliveries</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.metricsContainer}>
                                    <View style={styles.metricRow}>
                                        <Text style={styles.metricLabel}>Total Sales</Text>
                                        <Text style={styles.metricValue}>KES {sellerTotalSales.toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.metricRow}>
                                        <Text style={styles.metricLabel}>Paid</Text>
                                        <Text style={[styles.metricValue, styles.successText]}>
                                            KES {sellerTotalPaid.toLocaleString()}
                                        </Text>
                                    </View>
                                    <View style={styles.metricRow}>
                                        <Text style={styles.metricLabel}>Pending</Text>
                                        <Text style={[styles.metricValue, styles.errorText]}>
                                            KES {sellerPending.toLocaleString()}
                                        </Text>
                                    </View>
                                </View>

                                {sellerDeliveries.length > 0 && (
                                    <View style={styles.deliveriesSection}>
                                        <Text style={styles.deliveriesTitle}>Deliveries</Text>
                                        {sellerDeliveries.map((delivery) => (
                                            <View key={delivery.id} style={styles.deliveryItem}>
                                                <Store size={14} color={Colors.textLight} />
                                                <Text style={styles.deliveryShop}>{getShopName(delivery.shopId)}</Text>
                                                <Text style={styles.deliveryAmount}>KES {delivery.totalAmount}</Text>
                                                <View style={[styles.statusDot, delivery.isPaid ? styles.statusPaid : styles.statusUnpaid]} />
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    })}

                    {dateDeliveries.length === 0 && (
                        <View style={styles.emptyState}>
                            <TrendingUp size={40} color={Colors.textLight} />
                            <Text style={styles.emptyStateText}>No sales data for {displayDate(selectedDate).toLowerCase()}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    backButton: {
        marginLeft: 8,
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
        backgroundColor: Colors.card,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textLight,
        marginBottom: 16,
    },
    dateNav: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        gap: 12,
    },
    dateArrow: {
        padding: 8,
        backgroundColor: Colors.secondary,
        borderRadius: 12,
    },
    dateArrowDisabled: {
        opacity: 0.4,
    },
    dateDisplay: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: Colors.secondary,
        borderRadius: 20,
        gap: 8,
    },
    dateText: {
        fontSize: 16,
        fontWeight: "600" as const,
        color: Colors.primary,
    },
    searchContainer: {
        marginTop: 0,
    },
    searchInputWrapper: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchInput: {
        padding: 12,
        fontSize: 14,
        color: Colors.text,
    },
    statsContainer: {
        padding: 20,
        gap: 12,
    },
    statCard: {
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
    },
    primaryCard: {
        backgroundColor: Colors.primary,
    },
    successCard: {
        backgroundColor: "#E8F5E9",
        borderWidth: 1,
        borderColor: "#C8E6C9",
    },
    errorCard: {
        backgroundColor: "#FFEBEE",
        borderWidth: 1,
        borderColor: "#FFCDD2",
    },
    halfCard: {
        flex: 1,
    },
    row: {
        flexDirection: "row",
        gap: 12,
    },
    statLabel: {
        fontSize: 14,
        color: Colors.card,
        marginTop: 8,
        opacity: 0.9,
    },
    statValue: {
        fontSize: 28,
        fontWeight: "700" as const,
        color: Colors.card,
    },
    smallStatLabel: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 4,
    },
    smallStatValue: {
        fontSize: 18,
        fontWeight: "700" as const,
        color: Colors.text,
    },
    section: {
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 12,
    },
    sellerCard: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
    },
    sellerHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    sellerIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.secondary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    sellerInfo: {
        flex: 1,
    },
    sellerName: {
        fontSize: 16,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 4,
    },
    sellerStats: {
        flexDirection: "row",
        gap: 8,
    },
    statBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statBadgeText: {
        fontSize: 11,
        color: Colors.textLight,
    },
    metricsContainer: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    metricRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 6,
    },
    metricLabel: {
        fontSize: 14,
        color: Colors.textLight,
    },
    metricValue: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: Colors.text,
    },
    successText: {
        color: Colors.success,
    },
    errorText: {
        color: Colors.error,
    },
    deliveriesSection: {
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 12,
    },
    deliveriesTitle: {
        fontSize: 12,
        fontWeight: "600" as const,
        color: Colors.textLight,
        textTransform: "uppercase",
        marginBottom: 8,
    },
    deliveryItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        gap: 8,
    },
    deliveryShop: {
        flex: 1,
        fontSize: 14,
        color: Colors.text,
    },
    deliveryAmount: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: Colors.text,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusPaid: {
        backgroundColor: Colors.success,
    },
    statusUnpaid: {
        backgroundColor: Colors.error,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        backgroundColor: Colors.card,
        borderRadius: 16,
    },
    emptyStateText: {
        fontSize: 14,
        color: Colors.textLight,
        marginTop: 12,
        textAlign: "center",
    },
});
