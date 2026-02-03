import { Stack, router } from "expo-router";
import { ArrowLeft, User, Store, DollarSign, TrendingUp, AlertCircle, ChevronLeft, ChevronRight, Calendar } from "lucide-react-native";
import React, { useState, useCallback } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput, Pressable, RefreshControl, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";


export default function AnalyticsScreen() {
    const { getSellerAnalytics, shops, deliveries, sellers, colors: Colors } = useApp();
    const styles = React.useMemo(() => createStyles(Colors), [Colors]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [expandedSellers, setExpandedSellers] = useState<string[]>([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
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

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
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

    const toggleSellerExpanded = (sellerId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpandedSellers(prev =>
            prev.includes(sellerId)
                ? prev.filter(id => id !== sellerId)
                : [...prev, sellerId]
        );
    };

    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => setRefreshing(false), 800);
    }, []);

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            {/* Custom Header */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Sales Analytics</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Sticky Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Performance</Text>
                <Text style={styles.subtitle}>Detailed breakdown by seller</Text>

                {/* Date Navigation */}
                <View style={styles.dateNav}>
                    <Pressable style={styles.dateArrow} onPress={goToPrevDay}>
                        <ChevronLeft size={24} color={Colors.primary} />
                    </Pressable>
                    <Pressable
                        style={styles.dateDisplay}
                        onPress={() => setShowDatePicker(true)}
                    >
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

                {isToday && (
                    <TouchableOpacity style={styles.todayBadge} onPress={goToToday}>
                        <Text style={styles.todayBadgeText}>TODAY</Text>
                    </TouchableOpacity>
                )}

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
                            <Pressable
                                key={sellerId}
                                style={styles.sellerCard}
                                onPress={() => toggleSellerExpanded(sellerId)}
                            >
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
                                            <View style={[styles.statBadge, sellerPending > 0 ? styles.pendingBadge : styles.paidBadge]}>
                                                <Text style={[styles.statBadgeText, sellerPending > 0 ? styles.pendingBadgeText : styles.paidBadgeText]}>
                                                    {sellerPending > 0 ? `KES ${sellerPending.toLocaleString()} pending` : 'Fully paid'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.sellerTotal}>
                                        <Text style={styles.sellerTotalAmount}>KES {sellerTotalSales.toLocaleString()}</Text>
                                        <ChevronRight
                                            size={20}
                                            color={Colors.textLight}
                                            style={{ transform: [{ rotate: expandedSellers.includes(sellerId) ? '90deg' : '0deg' }] }}
                                        />
                                    </View>
                                </View>

                                {expandedSellers.includes(sellerId) && sellerDeliveries.length > 0 && (
                                    <View style={styles.deliveriesSection}>
                                        {sellerDeliveries.map((delivery) => {
                                            const isPartial = (delivery.paidAmount || 0) > 0 && !delivery.isPaid;
                                            return (
                                                <View key={delivery.id} style={styles.deliveryItem}>
                                                    <View style={styles.deliveryLeft}>
                                                        <Text style={styles.deliveryTime}>{formatTime(delivery.deliveryDate)}</Text>
                                                        <View style={[
                                                            styles.statusDot,
                                                            delivery.isPaid ? styles.statusPaid : (isPartial ? styles.statusPartial : styles.statusUnpaid)
                                                        ]} />
                                                    </View>
                                                    <View style={styles.deliveryCenter}>
                                                        <Text style={styles.deliveryShop} numberOfLines={1}>{getShopName(delivery.shopId)}</Text>
                                                        {isPartial && (
                                                            <Text style={styles.partialText}>
                                                                Paid: KES {(delivery.paidAmount || 0).toLocaleString()}
                                                            </Text>
                                                        )}
                                                    </View>
                                                    <View style={styles.deliveryRight}>
                                                        <Text style={styles.deliveryAmount}>KES {delivery.totalAmount.toLocaleString()}</Text>
                                                        {!delivery.isPaid && isPartial && (
                                                            <Text style={styles.remainingText}>
                                                                Bal: KES {(delivery.totalAmount - (delivery.paidAmount || 0)).toLocaleString()}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </Pressable>
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

            {/* Date Picker Modal */}
            <Modal
                visible={showDatePicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDatePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarModalRoot}>
                        <Text style={styles.datePickerTitle}>Select Date</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {[...Array(14)].map((_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() - i);
                                const isSel = formatDate(date) === formatDate(selectedDate);
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.dateOption, isSel && styles.dateOptionSelected]}
                                        onPress={() => {
                                            setSelectedDate(date);
                                            setShowDatePicker(false);
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        }}
                                    >
                                        <Text style={[styles.dateOptionText, isSel && styles.dateOptionTextSelected]}>
                                            {displayDate(date)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.closePickerButton}
                            onPress={() => setShowDatePicker(false)}
                        >
                            <Text style={styles.closePickerButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const createStyles = (Colors: any) => StyleSheet.create({
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
        backgroundColor: Colors.secondary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        gap: 4,
    },
    statBadgeText: {
        fontSize: 10,
        fontWeight: "600" as const,
        color: Colors.text,
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
    statusPartial: {
        backgroundColor: Colors.warning,
    },
    deliveryLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        width: 80,
    },
    deliveryCenter: {
        flex: 1,
    },
    deliveryRight: {
        alignItems: "flex-end",
    },
    partialText: {
        fontSize: 10,
        color: Colors.success,
        fontWeight: "500" as const,
    },
    remainingText: {
        fontSize: 10,
        color: Colors.error,
        fontWeight: "500" as const,
    },
    // Styles for collapsible cards
    sellerTotal: {
        alignItems: "flex-end",
    },
    sellerTotalAmount: {
        fontSize: 16,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 2,
    },
    pendingBadge: {
        backgroundColor: "#FFEBEE",
        borderWidth: 1,
        borderColor: "#FFCDD2",
    },
    paidBadge: {
        backgroundColor: "#E8F5E9",
        borderWidth: 1,
        borderColor: "#C8E6C9",
    },
    pendingBadgeText: {
        color: Colors.error,
        fontWeight: "600" as const,
    },
    paidBadgeText: {
        color: Colors.success,
        fontWeight: "600" as const,
    },
    todayBadge: {
        position: "absolute",
        top: 20,
        right: 20,
        backgroundColor: Colors.secondary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    todayBadgeText: {
        fontSize: 10,
        fontWeight: "700" as const,
        color: Colors.primary,
    },
    datePickerTitle: {
        fontSize: 20,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 20,
        textAlign: "center",
    },
    dateOption: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        alignItems: "center",
    },
    dateOptionSelected: {
        backgroundColor: Colors.secondary,
        borderRadius: 12,
        borderBottomWidth: 0,
    },
    dateOptionText: {
        fontSize: 16,
        color: Colors.text,
    },
    dateOptionTextSelected: {
        color: Colors.primary,
        fontWeight: "700" as const,
    },
    closePickerButton: {
        marginTop: 20,
        backgroundColor: Colors.background,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: Colors.border,
    },
    closePickerButtonText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: "700" as const,
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
    deliveryTime: {
        fontSize: 11,
        color: Colors.textLight,
        fontWeight: "500" as const,
        minWidth: 60,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: Colors.background,
    },
    topBarTitle: {
        fontSize: 18,
        fontWeight: "700" as const,
        color: Colors.text,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "flex-end",
    },
    calendarModalRoot: {
        backgroundColor: Colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: "80%",
    },
});
