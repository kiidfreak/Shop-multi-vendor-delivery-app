import { Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { Store, Phone, MapPin, CheckCircle, DollarSign, Search } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal, Alert, Pressable, TextInput, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import ConfettiCannon from "react-native-confetti-cannon";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";
import type { Shop, Delivery } from "@/types";

export default function ShopsScreen() {
    const { getActiveShops, getUnpaidDeliveriesByShop, recordPayment, settings, shops: allShops } = useApp();
    const shops = getActiveShops();
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [paymentAmount, setPaymentAmount] = useState("");
    const [payingDeliveryId, setPayingDeliveryId] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const confettiRef = React.useRef<any>(null);

    const filteredShops = React.useMemo(() => {
        return shops.filter(
            (shop: Shop) =>
                shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                shop.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                shop.owner.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [shops, searchQuery]);

    // Close modal if all payments are cleared for the selected shop
    React.useEffect(() => {
        if (selectedShop && showPaymentModal) {
            const unpaid = getUnpaidDeliveriesByShop(selectedShop.id);
            if (unpaid.length === 0) {
                const timer = setTimeout(() => {
                    setShowPaymentModal(false);
                    setSelectedShop(null);
                }, 1000); // Leave modal open for a sec to show success
                return () => clearTimeout(timer);
            }
        }
    }, [selectedShop, showPaymentModal, getUnpaidDeliveriesByShop]);

    const handleShopPress = (shop: Shop) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedShop(shop);
        const unpaidDeliveries = getUnpaidDeliveriesByShop(shop.id);
        if (unpaidDeliveries.length > 0) {
            setShowPaymentModal(true);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Toast.show({
                type: "success",
                text1: "All Cleared! ✅",
                text2: `${shop.name} has no pending payments`,
                visibilityTime: 2500,
            });
        }
    };

    const handleMarkAsPaid = async (deliveryId: string, total: number, alreadyPaid: number) => {
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert("Error", "Please enter a valid amount");
            return;
        }
        const remaining = total - alreadyPaid;
        if (amount > remaining) {
            Alert.alert("Error", `Cannot pay more than remaining balance (KES ${remaining.toLocaleString()})`);
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await recordPayment(deliveryId, amount);
        setPaymentAmount("");
        setPayingDeliveryId(null);
        setShowConfetti(true);

        Toast.show({
            type: "success",
            text1: "Payment Received! 💰",
            text2: `Recorded KES ${amount.toLocaleString()} for ${selectedShop?.name}`,
            visibilityTime: 3000,
        });
    };

    const handleFullPayment = async (deliveryId: string, amount: number) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await recordPayment(deliveryId, amount);
        setShowConfetti(true);

        Toast.show({
            type: "success",
            text1: "Full Payment Clear! 🎉",
            text2: `Account settled for ${selectedShop?.name}`,
            visibilityTime: 3000,
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.title}>Manage Shops</Text>
                            <Text style={styles.subtitle}>Track deliveries and payments</Text>
                        </View>
                    </View>

                    <View style={styles.searchContainer}>
                        <Search size={20} color={Colors.textLight} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search shops..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={Colors.textLight}
                        />
                    </View>
                </View>

                <View style={styles.shopsContainer}>
                    {filteredShops.length > 0 ? (
                        filteredShops.map((shop) => {
                            const unpaidDeliveries = getUnpaidDeliveriesByShop(shop.id);
                            const totalAmountPending = unpaidDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);
                            const totalPaidPending = unpaidDeliveries.reduce((sum, d) => sum + (d.paidAmount || 0), 0);
                            const totalRemaining = totalAmountPending - totalPaidPending;
                            const isPartial = totalPaidPending > 0 && totalRemaining > 0;

                            return (
                                <Pressable
                                    key={shop.id}
                                    style={({ pressed }) => [
                                        styles.shopCard,
                                        isPartial && styles.shopCardPartial,
                                        pressed && styles.shopCardPressed,
                                    ]}
                                    onPress={() => handleShopPress(shop)}
                                >
                                    <View style={styles.shopHeader}>
                                        <View style={[
                                            styles.shopIconContainer,
                                            unpaidDeliveries.length > 0 ? styles.shopIconUnpaid : styles.shopIconPaid,
                                        ]}>
                                            <Store size={24} color={unpaidDeliveries.length > 0 ? Colors.error : Colors.success} />
                                        </View>
                                        <View style={styles.shopInfo}>
                                            <Text style={styles.shopName}>{shop.name}</Text>
                                            <Text style={styles.shopOwner}>{shop.owner}</Text>
                                        </View>
                                        {unpaidDeliveries.length > 0 && (
                                            <View style={styles.unpaidBadge}>
                                                <Text style={styles.unpaidBadgeText}>{unpaidDeliveries.length}</Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.shopDetails}>
                                        <View style={styles.detailRow}>
                                            <MapPin size={16} color={Colors.textLight} />
                                            <Text style={styles.detailText}>{shop.location}</Text>
                                        </View>
                                        {shop.phone && (
                                            <View style={styles.detailRow}>
                                                <Phone size={16} color={Colors.textLight} />
                                                <Text style={styles.detailText}>{shop.phone}</Text>
                                            </View>
                                        )}
                                    </View>

                                    {unpaidDeliveries.length > 0 ? (
                                        <View style={isPartial ? styles.partialSection : styles.unpaidSection}>
                                            <DollarSign size={18} color={Colors.card} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.unpaidText}>
                                                    KES {totalRemaining.toLocaleString()}
                                                </Text>
                                                {isPartial && (
                                                    <Text style={styles.partialInfoText}>
                                                        Paid KES {totalPaidPending.toLocaleString()}
                                                    </Text>
                                                )}
                                            </View>
                                            <Text style={styles.tapToPayText}>{isPartial ? "Complete payment" : "Tap to mark paid"}</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.paidSection}>
                                            <CheckCircle size={18} color={Colors.success} />
                                            <Text style={styles.paidText}>All paid</Text>
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })
                    ) : (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconContainer}>
                                {searchQuery ? (
                                    <Search size={48} color={Colors.textLight} />
                                ) : (
                                    <CheckCircle size={48} color={Colors.success} />
                                )}
                            </View>
                            <Text style={styles.emptyTitle}>
                                {searchQuery ? "No matching shops" : "All caught up!"}
                            </Text>
                            <Text style={styles.emptyText}>
                                {searchQuery
                                    ? `Could not find any shops matching "${searchQuery}"`
                                    : settings.hideShopsAfterPaid
                                        ? "All your active shops have paid their balances. You can see them by disabling 'Hide shops after paid' in Settings."
                                        : "You haven't added any active shops yet."}
                            </Text>
                            {!searchQuery && settings.hideShopsAfterPaid && (
                                <View style={styles.tipContainer}>
                                    <Text style={styles.tipText}>Tip: Toggle the visibility setting to manage past deliveries for paid shops.</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal
                visible={showPaymentModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPaymentModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pending Payments</Text>
                            <Text style={styles.modalSubtitle}>{selectedShop?.name}</Text>
                        </View>

                        <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                            {selectedShop &&
                                getUnpaidDeliveriesByShop(selectedShop.id).map((delivery) => {
                                    const remaining = delivery.totalAmount - (delivery.paidAmount || 0);
                                    const isPaying = payingDeliveryId === delivery.id;

                                    return (
                                        <View key={delivery.id} style={styles.deliveryItemContainer}>
                                            <View style={styles.deliveryItem}>
                                                <View style={styles.deliveryInfo}>
                                                    <Text style={styles.deliveryDate}>
                                                        {new Date(delivery.deliveryDate).toLocaleDateString()}
                                                    </Text>
                                                    <Text style={styles.deliveryAmount}>
                                                        KES {delivery.totalAmount.toLocaleString()}
                                                    </Text>
                                                    {delivery.paidAmount > 0 && (
                                                        <Text style={styles.paidAmountText}>
                                                            Paid: KES {delivery.paidAmount.toLocaleString()} (Bal: KES {remaining.toLocaleString()})
                                                        </Text>
                                                    )}
                                                    {delivery.notes && (
                                                        <Text style={styles.deliveryNotes}>{delivery.notes}</Text>
                                                    )}
                                                </View>
                                                <View style={styles.paymentActions}>
                                                    <TouchableOpacity
                                                        style={styles.fullPayButton}
                                                        onPress={() => handleFullPayment(delivery.id, remaining)}
                                                    >
                                                        <CheckCircle size={14} color={Colors.card} />
                                                        <Text style={styles.fullPayText}>Full</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.partialPayButton}
                                                        onPress={() => setPayingDeliveryId(isPaying ? null : delivery.id)}
                                                    >
                                                        <DollarSign size={14} color={Colors.primary} />
                                                        <Text style={styles.partialPayText}>Partial</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                            {isPaying && (
                                                <View style={styles.partialInputContainer}>
                                                    <TextInput
                                                        style={styles.partialInput}
                                                        placeholder="Amount..."
                                                        keyboardType="numeric"
                                                        value={paymentAmount}
                                                        onChangeText={setPaymentAmount}
                                                        autoFocus
                                                    />
                                                    <TouchableOpacity
                                                        style={styles.confirmPayButton}
                                                        onPress={() => handleMarkAsPaid(delivery.id, delivery.totalAmount, delivery.paidAmount || 0)}
                                                    >
                                                        <Text style={styles.confirmPayText}>Pay</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowPaymentModal(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {showConfetti && (
                <ConfettiCannon
                    count={200}
                    origin={{ x: Dimensions.get("window").width / 2, y: 0 }}
                    fadeOut={true}
                    fallSpeed={3000}
                    onAnimationEnd={() => setShowConfetti(false)}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
        backgroundColor: Colors.card,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 12,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.background,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: Colors.text,
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
    shopsContainer: {
        paddingHorizontal: 20,
        gap: 12,
        paddingBottom: 20,
    },
    shopCard: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
    },
    shopCardPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.96 }],
    },
    shopHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    shopIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    shopIconUnpaid: {
        backgroundColor: "#FFEBEE",
    },
    shopIconPaid: {
        backgroundColor: "#E8F5E9",
    },
    shopInfo: {
        flex: 1,
    },
    shopName: {
        fontSize: 18,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 4,
    },
    shopOwner: {
        fontSize: 14,
        color: Colors.textLight,
    },
    unpaidBadge: {
        backgroundColor: Colors.error,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        minWidth: 28,
        alignItems: "center",
    },
    unpaidBadgeText: {
        color: Colors.card,
        fontSize: 14,
        fontWeight: "700" as const,
    },
    shopDetails: {
        gap: 8,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: Colors.textLight,
    },
    unpaidSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: Colors.error,
        padding: 14,
        borderRadius: 12,
    },
    unpaidText: {
        fontSize: 16,
        fontWeight: "700" as const,
        color: Colors.card,
        flex: 1,
    },
    tapToPayText: {
        fontSize: 12,
        fontWeight: "500" as const,
        color: Colors.secondary,
    },
    paidSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#E8F5E9",
        padding: 14,
        borderRadius: 12,
        justifyContent: "center",
    },
    paidText: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: Colors.success,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: Colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: "80%",
    },
    modalHeader: {
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 16,
        color: Colors.textLight,
    },
    modalScroll: {
        maxHeight: 400,
    },
    deliveryItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: Colors.background,
        borderRadius: 12,
        marginBottom: 12,
    },
    deliveryInfo: {
        flex: 1,
    },
    deliveryDate: {
        fontSize: 14,
        color: Colors.textLight,
        marginBottom: 4,
    },
    deliveryAmount: {
        fontSize: 18,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 4,
    },
    deliveryNotes: {
        fontSize: 12,
        color: Colors.textLight,
        fontStyle: "italic" as const,
    },
    markPaidButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.success,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 10,
    },
    markPaidButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.95 }],
    },
    markPaidButtonText: {
        color: Colors.card,
        fontSize: 14,
        fontWeight: "700" as const,
    },
    closeButton: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 12,
    },
    closeButtonText: {
        color: Colors.card,
        fontSize: 16,
        fontWeight: "700" as const,
    },
    deliveryItemContainer: {
        marginBottom: 12,
    },
    paidAmountText: {
        fontSize: 12,
        color: Colors.success,
        fontWeight: "600" as const,
        marginBottom: 4,
    },
    paymentActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    fullPayButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Colors.success,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    fullPayText: {
        color: Colors.card,
        fontSize: 12,
        fontWeight: "700" as const,
    },
    partialPayButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    partialPayText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: "700" as const,
    },
    partialInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
        backgroundColor: Colors.card,
        padding: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    partialInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.text,
        paddingVertical: 4,
    },
    confirmPayButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 6,
    },
    confirmPayText: {
        color: Colors.card,
        fontSize: 12,
        fontWeight: "700" as const,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        backgroundColor: Colors.card,
        borderRadius: 24,
        marginTop: 20,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.background,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textLight,
        textAlign: "center",
        lineHeight: 20,
    },
    tipContainer: {
        marginTop: 20,
        padding: 12,
        backgroundColor: Colors.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tipText: {
        fontSize: 12,
        color: Colors.primary,
        textAlign: "center",
        fontWeight: "600" as const,
    },
    shopCardPartial: {
        borderColor: Colors.warning,
        borderWidth: 1,
    },
    partialSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: Colors.warning,
        padding: 14,
        borderRadius: 12,
    },
    partialInfoText: {
        fontSize: 10,
        color: Colors.card,
        fontWeight: "600" as const,
        opacity: 0.9,
    },
});
