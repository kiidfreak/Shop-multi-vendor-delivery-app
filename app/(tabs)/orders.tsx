import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList, Alert, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { Bike, Package, CheckCircle } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";

export default function OrdersScreen() {
    const { colors, orders, updateOrderStatus, activeRole, riders, assignRiderToOrder, currentRider, products, currentUser } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (activeRole === "RIDER") {
            router.replace("/(tabs)");
        }
    }, [activeRole]);

    // --- Animation State ---
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.5,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // --- State for Admin Modal ---
    const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // --- Helper Functions ---
    const handleAssignRider = (riderId: string) => {
        if (selectedOrder) {
            assignRiderToOrder(selectedOrder, riderId);
            setModalVisible(false);
            setSelectedOrder(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    // --- RENDER: USER VIEW (Original) ---
    const renderUserView = () => {
        const activeOrders = orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled");
        const pastOrders = orders.filter(o => o.status === "Delivered" || o.status === "Cancelled");

        return (
            <ScrollView contentContainerStyle={styles.content}>
                {activeOrders.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Coming In Hot 🔥</Text>
                        {activeOrders.map((order) => {
                            const assignedRider = riders.find(r => r.id === order.riderId);
                            const isPending = order.status === "Pending";

                            return (
                                <View key={order.id} style={[styles.activeCard, { backgroundColor: colors.card, borderColor: isPending ? colors.accent : colors.primary }]}>
                                    <View style={styles.statusRow}>
                                        <Animated.View style={{ opacity: isPending ? pulseAnim : 1 }}>
                                            <Text style={[styles.statusText, { color: isPending ? colors.accent : colors.secondary }]}>
                                                {isPending ? "WAITING FOR PLUG 🔌" : order.status.toUpperCase()}
                                            </Text>
                                        </Animated.View>
                                        <Text style={{ color: colors.text, fontWeight: 'bold' }}>
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>

                                    {assignedRider ? (
                                        <View style={[styles.riderRow, { backgroundColor: 'rgba(0,155,58,0.1)' }]}>
                                            <View style={styles.riderInfo}>
                                                <Text style={[styles.riderName, { color: colors.text }]}>{assignedRider.name}</Text>
                                                <Text style={[styles.riderStatus, { color: colors.primary }]}>
                                                    {order.deliveryEstimate ? `ETA: ${order.deliveryEstimate}` : `"${assignedRider.statusSummary || 'On the move 🏍️'}"`}
                                                </Text>
                                            </View>
                                            <Bike size={32} color={colors.primary} />
                                        </View>
                                    ) : (
                                        <View style={[styles.pendingDispatchRow, { backgroundColor: 'rgba(206,17,38,0.1)' }]}>
                                            <Ionicons name="time-outline" size={20} color={colors.accent} />
                                            <Text style={{ color: colors.text, marginLeft: 8, fontWeight: '600' }}>Finding your rider... ⏳</Text>
                                        </View>
                                    )}

                                    {/* Ordered Items */}
                                    <View style={[styles.orderedItemsContainer, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                                        <Text style={{ color: colors.secondary, fontSize: 10, fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase' }}>Items in this stash:</Text>
                                        {order.items.map((item, idx) => {
                                            const product = products.find(p => p.id === item.productId);
                                            return (
                                                <View key={idx} style={styles.itemDetailRow}>
                                                    <Text style={{ color: colors.text, fontSize: 15, flex: 1 }}>
                                                        {product?.name || 'Unknown'} <Text style={{ color: colors.textLight }}>x{item.quantity}</Text>
                                                    </Text>
                                                    <Text style={{ color: colors.textLight, fontSize: 13 }}>KES {item.price * item.quantity}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>

                                    {order.deliveryFee && (
                                        <View style={styles.feeRow}>
                                            <Text style={{ color: colors.textLight }}>Delivery Fee</Text>
                                            <Text style={{ color: colors.text }}>KES {order.deliveryFee}</Text>
                                        </View>
                                    )}

                                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                    <View style={styles.totalRow}>
                                        <Text style={{ color: colors.textLight, fontWeight: '600' }}>TOTAL AMOUNT</Text>
                                        <Text style={[styles.orderTotal, { color: colors.success }]}>KES {order.totalAmount + (order.deliveryFee || 0)}</Text>
                                    </View>
                                </View>
                            )
                        })}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.secondary }]}>RUN IT BACK (History) 🔄</Text>
                    {pastOrders.length === 0 ? (
                        <Text style={{ color: colors.textLight, fontStyle: 'italic' }}>No past orders yet. Get some mayhem! 🌿</Text>
                    ) : (
                        pastOrders.map((order) => (
                            <View key={order.id} style={[styles.pastCard, { backgroundColor: colors.card, borderLeftWidth: 4, borderLeftColor: order.status === "Delivered" ? colors.success : colors.accent }]}>
                                <View style={styles.pastHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.pastDate, { color: colors.text, fontSize: 16 }]}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                                        <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500', marginTop: 2 }}>{order.items.length} items • {order.paymentMethod || 'Paid'}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.pastAmount, { color: colors.secondary, fontWeight: '900', fontSize: 16 }]}>KES {order.totalAmount + (order.deliveryFee || 0)}</Text>
                                        <Text style={{ color: order.status === "Delivered" ? colors.success : colors.accent, fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>{order.status.toUpperCase()}</Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        );
    };

    // --- RENDER: ADMIN VIEW ("Control Tower") ---
    const [showAllPending, setShowAllPending] = useState(false);
    const [showAllAssigned, setShowAllAssigned] = useState(false);
    const [showAllCompleted, setShowAllCompleted] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    const renderAdminView = () => {
        const pendingOrders = orders.filter(o => o.status === "Pending");
        const assignedOrders = orders.filter(o => o.status === "Accepted" || o.status === "OnTheWay");
        const completedOrders = orders.filter(o => o.status === "Delivered").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const displayedPending = showAllPending ? pendingOrders : pendingOrders.slice(0, 3);
        const displayedAssigned = showAllAssigned ? assignedOrders : assignedOrders.slice(0, 3);
        const displayedCompleted = showAllCompleted ? completedOrders : completedOrders.slice(0, 5);

        return (
            <ScrollView contentContainerStyle={styles.content}>
                {/* PENDING SECTION */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.accent }]}>🚨 PENDING ACTION ({pendingOrders.length})</Text>
                    {displayedPending.map(order => {
                        const isExpanded = expandedOrderId === order.id;
                        const allItemsChecked = order.items.every(item => checkedItems[`${order.id}-${item.productId}`]);

                        return (
                            <TouchableOpacity
                                key={order.id}
                                style={[styles.adminCard, {
                                    backgroundColor: colors.card, // Dynamic background
                                    borderColor: isExpanded ? colors.primary : colors.accent
                                }]}
                                onPress={() => {
                                    if (isExpanded) {
                                        setExpandedOrderId(null);
                                    } else {
                                        setExpandedOrderId(order.id);
                                        // Reset checked items for this order
                                        const newChecked: Record<string, boolean> = {};
                                        order.items.forEach(item => {
                                            newChecked[`${order.id}-${item.productId}`] = false;
                                        });
                                        setCheckedItems(prev => ({ ...prev, ...newChecked }));
                                    }
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                                activeOpacity={0.8}
                            >
                                <View style={styles.adminCardHeader}>
                                    <Text style={[styles.orderId, { color: colors.text }]}>Order #{order.id.slice(-4)}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ color: colors.textLight }}>
                                            {!isNaN(new Date(order.createdAt).getTime())
                                                ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : "Just now"}
                                        </Text>
                                        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textLight} />
                                    </View>
                                </View>

                                {/* Guest Details */}
                                {order.deliveryDetails && (
                                    <View style={styles.guestDetails}>
                                        <Text style={{ color: colors.text }}>{order.deliveryDetails.name}</Text>
                                        <Text style={{ color: colors.textLight }}>{order.deliveryDetails.phone}</Text>
                                        <Text style={{ color: colors.textLight }}>{order.deliveryDetails.location}</Text>
                                    </View>
                                )}

                                <Text style={[styles.orderTotal, { color: colors.success, textAlign: "left", marginVertical: 8 }]}>KES {order.totalAmount}</Text>

                                {/* Expanded: Show Items Checklist */}
                                {isExpanded && (
                                    <View style={styles.itemsChecklist}>
                                        <Text style={{ color: colors.accent, fontWeight: 'bold', marginBottom: 10 }}>📦 PACK LIST - Tap to confirm:</Text>
                                        {order.items.map((item, idx) => {
                                            const product = products.find(p => p.id === item.productId);
                                            const itemKey = `${order.id}-${item.productId}`;
                                            const isChecked = checkedItems[itemKey] || false;

                                            return (
                                                <TouchableOpacity
                                                    key={idx}
                                                    style={styles.checklistItem}
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        setCheckedItems(prev => ({ ...prev, [itemKey]: !isChecked }));
                                                        Haptics.selectionAsync();
                                                    }}
                                                >
                                                    <View style={[styles.itemCheckbox, { borderColor: colors.primary, backgroundColor: isChecked ? colors.success : 'transparent' }]}>
                                                        {isChecked && <Ionicons name="checkmark" size={16} color="#FFF" />}
                                                    </View>
                                                    <Text style={{ color: isChecked ? colors.success : colors.text, flex: 1, textDecorationLine: isChecked ? 'line-through' : 'none' }}>
                                                        {product?.name || 'Unknown'} x{item.quantity}
                                                    </Text>
                                                    <Text style={{ color: colors.textLight }}>KES {item.price * item.quantity}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}

                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: allItemsChecked ? colors.primary : colors.border, marginTop: 16 }]}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                if (!allItemsChecked) {
                                                    Alert.alert("Pack First!", "Confirm all items are packed before assigning rider.");
                                                    return;
                                                }
                                                setSelectedOrder(order.id);
                                                setModalVisible(true);
                                            }}
                                        >
                                            <Text style={styles.actionButtonText}>{allItemsChecked ? 'ASSIGN RIDER 🛵' : 'PACK ALL ITEMS FIRST'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Collapsed: Quick Assign */}
                                {!isExpanded && (
                                    <Text style={{ color: colors.textLight, fontSize: 12, textAlign: 'center', marginTop: 4 }}>Tap to view & pack items</Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                    {pendingOrders.length === 0 && <Text style={{ color: colors.textLight }}>No pending orders. Chill out man.</Text>}
                    {pendingOrders.length > 3 && (
                        <TouchableOpacity onPress={() => setShowAllPending(!showAllPending)} style={styles.viewMoreButton}>
                            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{showAllPending ? 'Show Less ▲' : `View All (${pendingOrders.length}) ▼`}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ON THE MOVE SECTION */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.secondary }]}>ON THE MOVE 🚚 ({assignedOrders.length})</Text>
                    {displayedAssigned.map(order => {
                        const assignedRider = riders.find(r => r.id === order.riderId);
                        return (
                            <View key={order.id} style={[styles.adminCard, { borderColor: colors.secondary, backgroundColor: colors.card }]}>
                                <Text style={[styles.orderId, { color: colors.text }]}>Order #{order.id.slice(-4)}</Text>
                                <Text style={{ color: colors.textLight, marginTop: 4 }}>Rider: {assignedRider?.name || "Unknown"}</Text>
                                <Text style={{ color: order.status === "OnTheWay" ? colors.secondary : colors.textLight }}>Status: {order.status === "OnTheWay" ? "En Route 🏍️" : "Picked Up"}</Text>
                            </View>
                        );
                    })}
                    {assignedOrders.length === 0 && <Text style={{ color: colors.textLight }}>No active deliveries.</Text>}
                    {assignedOrders.length > 3 && (
                        <TouchableOpacity onPress={() => setShowAllAssigned(!showAllAssigned)} style={styles.viewMoreButton}>
                            <Text style={{ color: colors.secondary, fontWeight: 'bold' }}>{showAllAssigned ? 'Show Less ▲' : `View All (${assignedOrders.length}) ▼`}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* COMPLETED SECTION */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.success }]}>✅ COMPLETED ({completedOrders.length})</Text>
                    {displayedCompleted.map(order => {
                        const assignedRider = riders.find(r => r.id === order.riderId);
                        return (
                            <View key={order.id} style={[styles.adminCard, { borderColor: colors.success, opacity: 0.8, backgroundColor: colors.card }]}>
                                <View style={styles.adminCardHeader}>
                                    <Text style={[styles.orderId, { color: colors.text }]}>Order #{order.id.slice(-4)}</Text>
                                    <Text style={{ color: colors.success, fontWeight: 'bold' }}>{order.paymentMethod || 'N/A'}</Text>
                                </View>
                                <Text style={{ color: colors.textLight }}>Rider: {assignedRider?.name || "Unknown"}</Text>
                                <Text style={{ color: colors.textLight, fontSize: 12 }}>
                                    {!isNaN(new Date(order.createdAt).getTime())
                                        ? new Date(order.createdAt).toLocaleDateString()
                                        : "Recent"} • KES {order.totalAmount}
                                </Text>
                            </View>
                        );
                    })}
                    {completedOrders.length === 0 && <Text style={{ color: colors.textLight }}>No completed orders yet.</Text>}
                    {completedOrders.length > 5 && (
                        <TouchableOpacity onPress={() => setShowAllCompleted(!showAllCompleted)} style={styles.viewMoreButton}>
                            <Text style={{ color: colors.success, fontWeight: 'bold' }}>{showAllCompleted ? 'Show Less ▲' : `View All (${completedOrders.length}) ▼`}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        );
    };


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                    {activeRole === "USER" ? (currentUser?.isGuest ? "Guest Stash 🎭" : "My Stash 📦") : activeRole === "ADMIN" ? "Control Tower 🗼" : "Duty Calls 🏍️"}
                </Text>
            </View>

            {activeRole === "USER" && renderUserView()}
            {activeRole === "ADMIN" && renderAdminView()}

            {/* ASSIGN RIDER MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Select Rider</Text>
                        <FlatList
                            data={riders.filter(r => r.status === "Available")}
                            keyExtractor={(item, index) => `${item.id}-${index}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.riderOption, { borderBottomColor: colors.border }]}
                                    onPress={() => handleAssignRider(item.id)}
                                >
                                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>{item.name}</Text>
                                    <Text style={{ color: colors.textLight }}>{item.status} • {item.ordersCompleted} runs</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.border }]} onPress={() => setModalVisible(false)}>
                            <Text style={{ color: colors.text }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20 },
    title: { fontSize: 28, fontWeight: "bold" },
    content: { padding: 20, paddingBottom: 100 },
    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
    activeCard: { borderWidth: 1.5, borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
    statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center', marginBottom: 16 },
    statusText: { fontWeight: "800", fontSize: 12, letterSpacing: 1 },
    riderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: 12, borderRadius: 12 },
    pendingDispatchRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, padding: 12, borderRadius: 12 },
    riderInfo: { flex: 1 },
    riderName: { fontWeight: "bold", fontSize: 17 },
    riderStatus: { fontWeight: "600", fontSize: 13, marginTop: 2 },
    divider: { height: 1.5, marginVertical: 14 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderTotal: { fontWeight: "900", fontSize: 20 },
    feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    pastCard: { padding: 16, borderRadius: 16, marginBottom: 12, elevation: 2 },
    pastHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center' },
    pastDate: { fontWeight: "700", fontSize: 15 },
    pastAmount: { fontWeight: "bold", fontSize: 15 },
    pastItems: { fontSize: 12 },

    // Admin Styles
    // Admin Styles
    adminCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
    adminCardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    orderId: { fontWeight: "bold", fontSize: 16 },
    guestDetails: { marginBottom: 8, padding: 8, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 8 },
    actionButton: { padding: 12, borderRadius: 8, alignItems: "center", marginTop: 8 },
    actionButtonText: { color: "#FFF", fontWeight: "bold" },

    // Ordered Items Container
    orderedItemsContainer: { padding: 12, borderRadius: 12, marginBottom: 12 },
    itemDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },

    // Rider Styles
    riderHeader: { padding: 16, borderRadius: 12, marginBottom: 10, alignItems: "center" },

    // Modal
    modalContainer: { flex: 1, justifyContent: "flex-end" },
    modalContent: { height: "50%", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
    riderOption: { paddingVertical: 16, borderBottomWidth: 1 },
    closeButton: { marginTop: 20, padding: 16, borderRadius: 12, alignItems: "center" },

    // Chip Styles
    modalSubtitle: { fontSize: 14, marginBottom: 12, fontWeight: "600" },
    chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
    chipLarge: { flex: 1, alignItems: "center", paddingVertical: 20 },

    // View More
    viewMoreButton: { paddingVertical: 12, alignItems: "center" },

    // Rider Completed Section
    riderStatsRow: { flexDirection: 'row', gap: 12 },
    riderStatBox: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    completedOrderCard: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
    paymentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },

    // Admin Checklist
    itemsChecklist: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    checklistItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    itemCheckbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
