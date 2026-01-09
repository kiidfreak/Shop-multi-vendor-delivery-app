import { Stack, router } from "expo-router";
import { ArrowLeft, User, Store, DollarSign, TrendingUp, AlertCircle } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

export default function AnalyticsScreen() {
    const { getSellerAnalytics, shops, deliveries } = useApp();
    const [searchQuery, setSearchQuery] = useState("");
    const analytics = getSellerAnalytics();

    const today = new Date().toISOString().split("T")[0];
    const todayDeliveries = deliveries.filter((d) => d.deliveryDate.startsWith(today));

    const totalSales = analytics.reduce((sum, a) => sum + a.totalSales, 0);
    const totalPaid = analytics.reduce((sum, a) => sum + a.totalPaid, 0);
    const totalPending = analytics.reduce((sum, a) => sum + a.totalPending, 0);

    const getShopName = (shopId: string) => {
        return shops.find((s) => s.id === shopId)?.name || "Unknown Shop";
    };

    const getSellerDeliveries = (sellerId: string) => {
        return todayDeliveries.filter((d) => {
            const shopName = getShopName(d.shopId).toLowerCase();
            return d.sellerId === sellerId && (searchQuery === "" || shopName.includes(searchQuery.toLowerCase()));
        });
    };

    const filteredAnalytics = analytics.filter((data: any) => {
        if (searchQuery === "") return true;
        const sellerMatch = data.seller.name.toLowerCase().includes(searchQuery.toLowerCase());
        const shopMatch = getSellerDeliveries(data.seller.id).length > 0;
        return sellerMatch || shopMatch;
    });

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
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.title}>Today&apos;s Performance</Text>
                    <Text style={styles.subtitle}>Detailed breakdown by seller</Text>
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

                    {filteredAnalytics.map((data) => (
                        <View key={data.seller.id} style={styles.sellerCard}>
                            <View style={styles.sellerHeader}>
                                <View style={styles.sellerIconContainer}>
                                    <User size={24} color={Colors.primary} />
                                </View>
                                <View style={styles.sellerInfo}>
                                    <Text style={styles.sellerName}>{data.seller.name}</Text>
                                    <View style={styles.sellerStats}>
                                        <View style={styles.statBadge}>
                                            <Store size={12} color={Colors.textLight} />
                                            <Text style={styles.statBadgeText}>{data.customerCount} shops</Text>
                                        </View>
                                        <View style={styles.statBadge}>
                                            <TrendingUp size={12} color={Colors.textLight} />
                                            <Text style={styles.statBadgeText}>{data.deliveryCount} deliveries</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.metricsContainer}>
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricLabel}>Total Sales</Text>
                                    <Text style={styles.metricValue}>KES {data.totalSales.toLocaleString()}</Text>
                                </View>
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricLabel}>Paid</Text>
                                    <Text style={[styles.metricValue, styles.successText]}>
                                        KES {data.totalPaid.toLocaleString()}
                                    </Text>
                                </View>
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricLabel}>Pending</Text>
                                    <Text style={[styles.metricValue, styles.errorText]}>
                                        KES {data.totalPending.toLocaleString()}
                                    </Text>
                                </View>
                            </View>

                            {data.deliveryCount > 0 && (
                                <View style={styles.deliveriesSection}>
                                    <Text style={styles.deliveriesTitle}>Today&apos;s Deliveries</Text>
                                    {getSellerDeliveries(data.seller.id).map((delivery) => (
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
                    ))}

                    {analytics.length === 0 && (
                        <View style={styles.emptyState}>
                            <TrendingUp size={40} color={Colors.textLight} />
                            <Text style={styles.emptyStateText}>No sales data for today</Text>
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
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textLight,
    },
    statsContainer: {
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
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
    statLabel: {
        fontSize: 14,
        color: Colors.secondary,
        marginTop: 8,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 28,
        fontWeight: "700" as const,
        color: Colors.card,
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
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 16,
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
        marginBottom: 16,
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
        fontSize: 18,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 8,
    },
    sellerStats: {
        flexDirection: "row",
        gap: 12,
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
        fontSize: 12,
        color: Colors.textLight,
    },
    metricsContainer: {
        gap: 8,
        marginBottom: 16,
    },
    metricRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    metricLabel: {
        fontSize: 14,
        color: Colors.textLight,
    },
    metricValue: {
        fontSize: 16,
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
        borderTopWidth: 2,
        borderTopColor: Colors.border,
        paddingTop: 12,
    },
    deliveriesTitle: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: Colors.text,
        marginBottom: 12,
    },
    deliveryItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 8,
    },
    deliveryShop: {
        flex: 1,
        fontSize: 13,
        color: Colors.text,
    },
    deliveryAmount: {
        fontSize: 13,
        fontWeight: "600" as const,
        color: Colors.text,
        marginRight: 8,
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
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    searchInputWrapper: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchInput: {
        fontSize: 14,
        color: Colors.text,
    },
});
