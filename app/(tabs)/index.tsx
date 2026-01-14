import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Pressable, Animated, PanResponder, Dimensions, Platform, Alert, TextInput, Modal, Linking, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useApp } from "@/contexts/AppContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

export default function HomeScreen() {
    const { colors, settings, products, addToCart, removeFromCart, cart, orders, reOrder, activeRole, currentRider, riders, currentUser, updateOrderStatus, updateRider, isLoaded, refreshData } = useApp();
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState<"All" | "Miraa" | "Smoke" | "Munchies">("All");
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (refreshData) {
            await refreshData();
        }
        setRefreshing(false);
    }, [refreshData]);
    const [showReorderBanner, setShowReorderBanner] = useState(true);
    const [lastAddedItem, setLastAddedItem] = useState<any>(null);

    // --- Rider Task State ---
    const [pickupModalVisible, setPickupModalVisible] = useState(false);
    const [pickupOrderId, setPickupOrderId] = useState<string | null>(null);
    const [selectedEta, setSelectedEta] = useState<string | null>(null);
    const [selectedFee, setSelectedFee] = useState<number | null>(null);
    const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);
    const [deliveryOrderId, setDeliveryOrderId] = useState<string | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<"Cash" | "Mpesa" | null>(null);
    const etaOptions = ["1-5 mins", "10-20 mins", "30 mins - 1 hr"];
    const feeOptions = [50, 100, 150, 200];
    const [customFee, setCustomFee] = useState<string>("");
    const [showRiderCompleted, setShowRiderCompleted] = useState(false);

    // Slide to Checkout animation
    const slideAnim = useRef(new Animated.Value(0)).current;
    const { width: SCREEN_WIDTH } = Dimensions.get('window');
    const SLIDE_MAX = 130; // track width (180) - handle (42) - padding/margin

    // --- Admin Stats Calculation ---
    const totalSales = orders.reduce((sum, o) => {
        const val = Number(o.totalAmount);
        return sum + (isNaN(val) ? 0 : val);
    }, 0);
    const activeOrdersCount = orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length;
    const onlineRidersCount = riders.filter(r => r.status === "Available" || r.status === "Busy").length;

    // --- Rider Stats Calculation ---
    const riderEarnings = currentRider ? orders.filter(o => o.riderId === currentRider.id && o.status === "Delivered").reduce((sum, o) => sum + (o.deliveryFee || 100), 0) : 0;

    const filteredProducts = selectedCategory === "All"
        ? products
        : products.filter(p => p.category === selectedCategory);

    const lastOrder = orders.length > 0 ? orders[0] : null;

    const handleAddToCart = (product: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // "Successful pop"
        addToCart(product);
        setLastAddedItem(product);
    };

    const handleRemoveFromCart = (productId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        removeFromCart(productId);
    };

    const handleCategorySelect = (cat: any) => {
        Haptics.selectionAsync();
        setSelectedCategory(cat);
    };

    // --- Rider Helpers ---
    const openPickupModal = (orderId: string) => {
        setPickupOrderId(orderId);
        setSelectedEta(null);
        setSelectedFee(null);
        setCustomFee("");
        setPickupModalVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const confirmPickup = () => {
        const finalFee = selectedFee === -1 ? Number(customFee) : selectedFee;

        if (!pickupOrderId || !selectedEta || (selectedFee === null && !customFee)) {
            Alert.alert("Hold Up", "Select ETA and your delivery fee first!");
            return;
        }

        if (selectedFee === -1 && (isNaN(Number(customFee)) || Number(customFee) <= 0)) {
            Alert.alert("Hold Up", "Enter a valid delivery fee!");
            return;
        }

        updateOrderStatus(pickupOrderId, "OnTheWay", {
            deliveryEstimate: selectedEta,
            deliveryFee: finalFee || 100,
            feeSuggested: selectedFee === -1
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPickupModalVisible(false);
        setPickupOrderId(null);
    };

    const openDeliveryModal = (orderId: string) => {
        setDeliveryOrderId(orderId);
        setSelectedPayment(null);
        setDeliveryModalVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const confirmDelivery = () => {
        if (!deliveryOrderId || !selectedPayment) {
            Alert.alert("Hold Up", "Select how customer paid first!");
            return;
        }
        updateOrderStatus(deliveryOrderId, "Delivered", { paymentMethod: selectedPayment });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDeliveryModalVisible(false);
        setDeliveryOrderId(null);
    };

    const toggleRiderStatus = () => {
        if (!currentRider) return;
        const newStatus = currentRider.status === "Offline" ? "Available" : "Offline";
        updateRider(currentRider.id, { status: newStatus });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    // --- VIEWS ---

    const RenderRiderDashboard = () => {
        const myOrders = orders.filter(o => o.riderId === currentRider?.id && o.status !== "Delivered" && o.status !== "Pending" && o.status !== "Cancelled");
        const myCompletedOrders = orders.filter(o => o.riderId === currentRider?.id && o.status === "Delivered")
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const today = new Date().toDateString();
        const todayCompleted = myCompletedOrders.filter(o => new Date(o.createdAt).toDateString() === today);
        const todayEarnings = todayCompleted.reduce((sum, o) => sum + (o.deliveryFee || 100), 0);

        const displayedCompleted = showRiderCompleted ? myCompletedOrders : myCompletedOrders.slice(0, 3);
        const isOnline = currentRider?.status !== "Offline";

        return (
            <View style={{ flex: 1 }}>
                {/* Sticky Header */}
                <View style={[styles.header, { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background, zIndex: 100, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                    <View>
                        <Text style={[styles.greeting, { color: isOnline ? colors.primary : colors.textLight, fontWeight: '900' }]}>
                            {isOnline ? "ON DUTY 🏍️" : "OFF DUTY 😴"}
                        </Text>
                        <Text style={[styles.subGreeting, { color: colors.textLight }]}>
                            {currentRider?.name} • {isOnline ? "Ready for Mayhem" : "Resting up"}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
                        <Image
                            source={currentRider?.avatar ? { uri: currentRider.avatar } : require("@/assets/images/icon.png")}
                            style={[styles.avatar, { borderColor: isOnline ? colors.primary : colors.border, borderWidth: 2 }]}
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Active Shift Toggle Section */}
                    <View style={[styles.infoCard, {
                        backgroundColor: isOnline ? (colors.primary + '15') : (colors.border + '30'),
                        marginTop: 10,
                        borderColor: isOnline ? colors.primary : colors.border,
                        borderWidth: 1,
                        paddingVertical: 20
                    }]}>
                        <Ionicons name={isOnline ? "flash" : "moon"} size={32} color={isOnline ? colors.primary : colors.textLight} />
                        <View style={{ marginLeft: 15, flex: 1 }}>
                            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>
                                {isOnline ? "Shift Active" : "Shift Inactive"}
                            </Text>
                            <Text style={{ color: colors.textLight, fontSize: 13 }}>
                                {isOnline ? "You are receiving live delivery requests." : "Orders won't show until you go online."}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={toggleRiderStatus}
                            style={{
                                backgroundColor: isOnline ? colors.accent : colors.primary,
                                paddingHorizontal: 20,
                                paddingVertical: 10,
                                borderRadius: 25
                            }}
                        >
                            <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>
                                {isOnline ? "GO OFFLINE" : "GO ONLINE"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Active Duties */}
                    <Text style={[styles.sectionLabel, { color: colors.text, marginTop: 24, marginBottom: 12 }]}>YOUR DUTIES 🏍️ ({myOrders.length})</Text>
                    {myOrders.map((order, i) => (
                        <View key={order.id} style={[styles.activeCard, {
                            backgroundColor: colors.card,
                            borderColor: colors.primary,
                            marginBottom: 15,
                            padding: 16,
                            borderRadius: 16,
                            borderWidth: 1.5,
                            shadowColor: colors.primary,
                            shadowOpacity: 0.1,
                            shadowRadius: 10,
                            elevation: 5
                        }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={{ backgroundColor: colors.accent, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ fontWeight: 'bold', color: '#000', fontSize: 12 }}>{i + 1}</Text>
                                    </View>
                                    <Text style={[styles.orderId, { color: colors.text, fontSize: 20, fontWeight: '900' }]}>#{order.id.slice(-4)}</Text>
                                </View>
                                <View style={{ backgroundColor: colors.primary + '25', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '900' }}>{order.status.toUpperCase()}</Text>
                                </View>
                            </View>

                            {order.deliveryDetails && (
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                                        <Ionicons name="location" size={18} color={colors.primary} />
                                        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900", marginLeft: 8 }}>{order.deliveryDetails.location}</Text>
                                    </View>
                                    <Text style={{ color: colors.textLight, fontSize: 14, marginLeft: 26 }}>{order.deliveryDetails.name}</Text>
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginLeft: 26 }}
                                        onPress={() => Linking.openURL(`tel:${order.deliveryDetails?.phone}`)}
                                    >
                                        <Ionicons name="call" size={14} color={colors.primary} />
                                        <Text style={{ color: colors.primary, fontSize: 14, fontWeight: 'bold', marginLeft: 8 }}>{order.deliveryDetails.phone}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                <Text style={{ color: colors.textLight }}>Collection Amount:</Text>
                                <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900' }}>KES {order.totalAmount}</Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.primaryButton, {
                                    backgroundColor: order.status === "Accepted" ? colors.secondary : colors.success,
                                    height: 50,
                                    borderRadius: 15,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }]}
                                onPress={() => {
                                    if (order.status === "Accepted") {
                                        openPickupModal(order.id);
                                    } else {
                                        openDeliveryModal(order.id);
                                    }
                                }}
                            >
                                <Text style={{ color: '#000', fontWeight: '900', fontSize: 16 }}>
                                    {order.status === "Accepted" ? "PICK UP STASH 🚀" : "MARK DELIVERED ✅"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}

                    {myOrders.length === 0 && (
                        <View style={{ alignItems: "center", padding: 40, backgroundColor: colors.card, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
                            <Ionicons name="cafe-outline" size={48} color={colors.textLight} />
                            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 15 }}>No Active Stashes</Text>
                            <Text style={{ color: colors.textLight, fontSize: 13, marginTop: 5 }}>{isOnline ? "Waiting for new orders... 🔌" : "Go online to start receiving work."}</Text>
                        </View>
                    )}

                    <View style={styles.statsGrid}>
                        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.secondary, borderWidth: 1 }]}>
                            <Text style={[styles.statLabel, { color: colors.textLight }]}>Trips Done</Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>{currentRider?.ordersCompleted || 0}</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.success, borderWidth: 1 }]}>
                            <Text style={[styles.statLabel, { color: colors.textLight }]}>Today's Pay</Text>
                            <Text style={[styles.statValue, { color: colors.success }]}>KES {todayEarnings}</Text>
                        </View>
                    </View>

                    {/* Recent Runs */}
                    <Text style={[styles.sectionLabel, { color: colors.success, marginTop: 10, marginBottom: 12 }]}>✅ RECENT RUNS</Text>
                    {displayedCompleted.map(order => (
                        <View key={order.id} style={{ backgroundColor: colors.card, padding: 15, borderRadius: 15, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: colors.success, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                            <View>
                                <Text style={{ color: colors.text, fontWeight: '900' }}>#{order.id.slice(-4)}</Text>
                                <Text style={{ color: colors.textLight, fontSize: 12 }}>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ color: colors.success, fontWeight: '900', fontSize: 16 }}>KES {order.deliveryFee || 100}</Text>
                                <Text style={{ color: colors.textLight, fontSize: 10 }}>Delivery Fee</Text>
                            </View>
                        </View>
                    ))}

                    {myCompletedOrders.length === 0 && (
                        <View style={{ alignItems: "center", padding: 20, marginTop: 10 }}>
                            <Text style={{ color: colors.textLight, fontStyle: 'italic' }}>No runs completed yet.</Text>
                            <Text style={{ color: colors.secondary, fontSize: 12, marginTop: 5, fontWeight: 'bold' }}>⭐ RATING SYSTEM COMING SOON ⭐</Text>
                        </View>
                    )}

                    {myCompletedOrders.length > 3 && (
                        <TouchableOpacity onPress={() => setShowRiderCompleted(!showRiderCompleted)} style={{ padding: 15, alignItems: 'center' }}>
                            <Text style={{ color: colors.primary, fontWeight: '900' }}>{showRiderCompleted ? 'REDUCE VIEW' : 'VIEW FULL HISTORY'}</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
        );
    };

    const RenderAdminDashboard = () => (
        <View style={{ flex: 1 }}>
            {/* Sticky Header */}
            <View style={[styles.header, { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background, zIndex: 100 }]}>
                <View>
                    <Text style={[styles.greeting, { color: colors.accent, fontWeight: '900' }]}>GOD MODE ⚡</Text>
                    <Text style={[styles.subGreeting, { color: colors.textLight }]}>System Overview</Text>
                </View>
                <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
                    <Image
                        source={currentUser?.avatar ? { uri: currentUser.avatar } : require("@/assets/images/icon.png")}
                        style={[styles.avatar, { borderColor: colors.accent, borderWidth: 2 }]}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
            >
                {/* Stats Row 1 */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statBoxPremium, { backgroundColor: colors.card, borderColor: colors.success, borderWidth: 1.5 }]}>
                        <View style={[styles.statIconContainer, { backgroundColor: colors.success + '20' }]}>
                            <Ionicons name="cash-outline" size={28} color={colors.success} />
                        </View>
                        <Text style={[styles.statLabel, { color: colors.textLight }]}>Total Revenue</Text>
                        <Text style={[styles.statValue, { color: colors.success }]}>KES {totalSales.toLocaleString()}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.statBoxPremium, { backgroundColor: colors.card, borderColor: colors.accent, borderWidth: 1.5 }]}
                        onPress={() => router.push('/(tabs)/orders')}
                    >
                        <View style={[styles.statIconContainer, { backgroundColor: colors.accent + '20' }]}>
                            <Ionicons name="cube-outline" size={28} color={colors.accent} />
                        </View>
                        <Text style={[styles.statLabel, { color: colors.textLight }]}>Pending Stashes</Text>
                        <Text style={[styles.statValue, { color: colors.accent }]}>{activeOrdersCount}</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Row 2 */}
                <View style={styles.statsGrid}>
                    <TouchableOpacity
                        style={[styles.statBoxPremium, { backgroundColor: colors.card, borderColor: colors.secondary, borderWidth: 1.5 }]}
                        onPress={() => router.push('/riders')}
                    >
                        <View style={[styles.statIconContainer, { backgroundColor: colors.secondary + '20' }]}>
                            <Ionicons name="bicycle-outline" size={28} color={colors.secondary} />
                        </View>
                        <Text style={[styles.statLabel, { color: colors.textLight }]}>Riders Active</Text>
                        <Text style={[styles.statValue, { color: colors.secondary }]}>{onlineRidersCount}/{riders.length}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.statBoxPremium, { backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 1.5 }]}
                        onPress={() => router.push('/(tabs)/orders')}
                    >
                        <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="checkmark-done-circle-outline" size={28} color={colors.primary} />
                        </View>
                        <Text style={[styles.statLabel, { color: colors.textLight }]}>Successful Drops</Text>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{orders.filter(o => o.status === 'Delivered').length}</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Actions */}
                <Text style={[styles.sectionLabel, { color: colors.text, marginTop: 20 }]}>Quick Actions</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => router.push('/riders')}
                    >
                        <Ionicons name="people-outline" size={24} color={colors.secondary} />
                        <Text style={{ color: colors.text, marginTop: 8, fontWeight: '600' }}>Riders</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => router.push('/inventory')}
                    >
                        <Ionicons name="pricetag-outline" size={24} color={colors.primary} />
                        <Text style={{ color: colors.text, marginTop: 8, fontWeight: '600' }}>My Stock</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => router.push('/(tabs)/orders')}
                    >
                        <Ionicons name="cube-outline" size={24} color={colors.accent} />
                        <Text style={{ color: colors.text, marginTop: 8, fontWeight: '600' }}>Orders</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );

    const RenderUserShop = () => {
        const pastOrders = orders.filter(o => o.status === "Delivered" || o.status === "Cancelled").slice(0, 3); // Just show recent 3 on home

        return (
            <View style={{ flex: 1 }}>
                {/* Sticky Header */}
                <View style={[styles.header, { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background, zIndex: 100 }]}>
                    <View>
                        <Text style={[styles.greeting, { color: colors.text }]}>
                            Yo {currentUser?.isGuest ? "Guest" : (currentUser?.name || settings.userName)} ✌️
                        </Text>
                        <Text style={[styles.subGreeting, { color: colors.textLight }]}>
                            {currentUser?.isGuest ? "Stay Low-key 🎭" : "Ready for Mayhem?"}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
                        <View>
                            <Image
                                source={currentUser?.avatar ? { uri: currentUser.avatar } : require("@/assets/images/icon.png")}
                                style={[styles.avatar, { borderColor: colors.primary }]}
                            />
                            {orders.some(o => o.status !== "Delivered" && o.status !== "Cancelled") && (
                                <View style={[styles.activeOrderPulse, { backgroundColor: colors.success }]} />
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                >
                    {/* SKELETON LOADER */}
                    {(!isLoaded || products.length === 0) && (
                        <View style={{ marginBottom: 20 }}>
                            <Text style={[styles.sectionLabel, { color: colors.secondary, marginBottom: 12 }]}>LOADING STASH... 🔌</Text>
                            {[1, 2, 3, 4].map(k => (
                                <View key={k} style={[styles.card, { backgroundColor: colors.card, opacity: 0.5, marginBottom: 12 }]}>
                                    <View style={[styles.productImagePlaceholder, { backgroundColor: "#333" }]} />
                                    <View style={styles.productInfo}>
                                        <View style={{ height: 20, width: '60%', backgroundColor: colors.border, borderRadius: 4, marginBottom: 8 }} />
                                        <View style={{ height: 16, width: '40%', backgroundColor: colors.border, borderRadius: 4 }} />
                                    </View>
                                </View>
                            ))}
                            <Text style={{ textAlign: "center", color: colors.textLight, marginTop: 10, fontSize: 12 }}>
                                (Empty? Admin needs to re-stock via Dashboard)
                            </Text>
                        </View>
                    )}

                    {/* RUN IT BACK (History) Section */}
                    {pastOrders.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionLabel, { color: colors.secondary, marginBottom: 12 }]}>RUN IT BACK 🔄</Text>
                            {pastOrders.map((order) => (
                                <TouchableOpacity
                                    key={order.id}
                                    style={[styles.reorderCard, { backgroundColor: colors.card, borderLeftWidth: 4, borderLeftColor: order.status === "Delivered" ? colors.success : colors.accent, marginBottom: 12 }]}
                                    onPress={() => {
                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        reOrder(order.id);
                                    }}
                                >
                                    <View style={styles.reorderHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.reorderTitle, { color: colors.text, fontSize: 15 }]}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                                            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '500' }}>{order.items.length} items • Reorder</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[styles.reorderButtonText, { color: colors.secondary, fontWeight: '900' }]}>KES {order.totalAmount}</Text>
                                            <Ionicons name="repeat" size={16} color={colors.secondary} style={{ marginTop: 2 }} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Categories */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
                        {["All", "Miraa", "Smoke", "Munchies"].map((cat) => {
                            const isSelected = selectedCategory === cat;
                            let catColor = colors.secondary;

                            if (cat === "Miraa") catColor = "#4CAF50";
                            if (cat === "Smoke") catColor = "#9E9E9E";
                            if (cat === "Munchies") catColor = "#FFC107";
                            if (cat === "All") catColor = "#FFC107";

                            return (
                                <Pressable
                                    key={cat}
                                    onPress={() => handleCategorySelect(cat)}
                                    style={[
                                        styles.categoryChip,
                                        {
                                            backgroundColor: isSelected ? catColor : colors.card,
                                            borderColor: isSelected ? catColor : colors.border
                                        }
                                    ]}
                                >
                                    <Text style={[
                                        styles.categoryText,
                                        { color: isSelected ? "#000" : colors.text }
                                    ]}>
                                        {cat}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    {/* Products Grid */}
                    <View style={styles.productsGrid}>
                        {filteredProducts.map((product) => (
                            <View key={product.id} style={[styles.productCard, { backgroundColor: colors.card }]}>
                                <View style={[styles.productImagePlaceholder, { backgroundColor: "#333" }]}>
                                    <Text style={{ fontSize: 30 }}>
                                        {product.category === "Miraa" ? "🌿" : product.category === "Smoke" ? "🚬" : "🍬"}
                                    </Text>
                                </View>
                                <View style={styles.productInfo}>
                                    <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
                                    <Text style={[styles.productPrice, { color: colors.success }]}>KES {product.price}</Text>

                                    {cart.find(c => c.productId === product.id) ? (
                                        <View style={styles.qtyContainer}>
                                            <TouchableOpacity
                                                style={[styles.qtyButton, { backgroundColor: colors.border }]}
                                                onPress={() => handleRemoveFromCart(product.id)}
                                            >
                                                <Ionicons name="remove" size={20} color={colors.text} />
                                            </TouchableOpacity>
                                            <Text style={[styles.qtyText, { color: colors.text }]}>
                                                {cart.find(c => c.productId === product.id)?.quantity || 0}
                                            </Text>
                                            <TouchableOpacity
                                                style={[styles.qtyButton, { backgroundColor: colors.primary }]}
                                                onPress={() => handleAddToCart(product)}
                                            >
                                                <Ionicons name="add" size={20} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                                            onPress={() => handleAddToCart(product)}
                                        >
                                            <Ionicons name="add" size={24} color="#FFF" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={settings.darkMode ? "light" : "dark"} />

            {activeRole === "USER" && <RenderUserShop />}
            {activeRole === "RIDER" && <RenderRiderDashboard />}
            {activeRole === "ADMIN" && <RenderAdminDashboard />}

            {/* Premium Mini-Cart Overlay - ONLY FOR USER */}
            {activeRole === "USER" && cart.length > 0 && (
                <View style={[styles.miniCartOverlay, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <View style={styles.miniCartContent}>
                        <View style={styles.lastAddedInfo}>
                            <Text style={[styles.miniCartLabel, { color: colors.textLight }]}>
                                {lastAddedItem ? `Last: ${lastAddedItem.name}` : `${cart.length} items in stash`}
                            </Text>
                            <Text style={[styles.miniCartTotal, { color: colors.text }]}>
                                KES {cart.reduce((a, b) => a + (b.price * b.quantity), 0)}
                            </Text>
                        </View>

                        <View style={[styles.slideTrack, { backgroundColor: colors.border }]}>
                            <Animated.View
                                style={[
                                    styles.slideHandle,
                                    {
                                        backgroundColor: colors.primary,
                                        transform: [{ translateX: slideAnim }]
                                    }
                                ]}
                                {...PanResponder.create({
                                    onStartShouldSetPanResponder: () => true,
                                    onPanResponderMove: (_, gestureState) => {
                                        if (gestureState.dx >= 0 && gestureState.dx <= SLIDE_MAX) {
                                            slideAnim.setValue(gestureState.dx);
                                        }
                                    },
                                    onPanResponderRelease: (_, gestureState) => {
                                        if (gestureState.dx > SLIDE_MAX - 30) {
                                            Animated.spring(slideAnim, {
                                                toValue: SLIDE_MAX,
                                                useNativeDriver: true,
                                                tension: 60,
                                            }).start(() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                                router.push("/modal");
                                                setTimeout(() => slideAnim.setValue(0), 500);
                                            });
                                        } else {
                                            Animated.spring(slideAnim, {
                                                toValue: 0,
                                                useNativeDriver: true,
                                                friction: 5,
                                            }).start();
                                        }
                                    },
                                }).panHandlers}
                            >
                                <Ionicons name="chevron-forward" size={24} color="#000" />
                            </Animated.View>
                            <Text style={[styles.slideText, { color: colors.textLight }]} pointerEvents="none">
                                SLIDE TO CHECKOUT
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* --- RIDER MODALS --- */}
            <Modal visible={pickupModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Stash Picked Up? 📦</Text>
                        <Text style={{ color: colors.textLight, marginBottom: 20 }}>Set delivery details to notify customer.</Text>

                        <Text style={{ color: colors.text, fontWeight: 'bold', marginBottom: 10 }}>Select ETA:</Text>
                        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                            {etaOptions.map(eta => (
                                <TouchableOpacity
                                    key={eta}
                                    onPress={() => setSelectedEta(eta)}
                                    style={[styles.chip, { backgroundColor: selectedEta === eta ? colors.primary : colors.border }]}
                                >
                                    <Text style={{ color: selectedEta === eta ? "#000" : colors.text }}>{eta}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={{ color: colors.text, fontWeight: 'bold', marginBottom: 10 }}>Delivery Fee (KES):</Text>
                        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 15 }}>
                            {feeOptions.map(fee => (
                                <TouchableOpacity
                                    key={fee}
                                    onPress={() => { setSelectedFee(fee); setCustomFee(""); }}
                                    style={[styles.chip, { backgroundColor: selectedFee === fee ? colors.primary : colors.border }]}
                                >
                                    <Text style={{ color: selectedFee === fee ? "#000" : colors.text }}>{fee}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                onPress={() => setSelectedFee(-1)}
                                style={[styles.chip, { backgroundColor: selectedFee === -1 ? colors.primary : colors.border }]}
                            >
                                <Text style={{ color: selectedFee === -1 ? "#000" : colors.text }}>Custom</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedFee === -1 && (
                            <View style={{ marginBottom: 20 }}>
                                <TextInput
                                    style={{ backgroundColor: colors.border + '30', color: colors.text, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: colors.primary }}
                                    placeholder="Enter suggested fee..."
                                    placeholderTextColor={colors.textLight}
                                    keyboardType="numeric"
                                    value={customFee}
                                    onChangeText={setCustomFee}
                                    autoFocus
                                />
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                style={[styles.modalButton, { flex: 1, backgroundColor: colors.border }]}
                                onPress={() => setPickupModalVisible(false)}
                            >
                                <Text style={{ color: colors.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { flex: 2, backgroundColor: colors.primary }]}
                                onPress={confirmPickup}
                            >
                                <Text style={{ color: '#000', fontWeight: 'bold' }}>CONFIRM PICKUP 🚀</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={deliveryModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Job Finished? ✅</Text>
                        <Text style={{ color: colors.textLight, marginBottom: 20 }}>How did the customer pay?</Text>

                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 30 }}>
                            <TouchableOpacity
                                style={[styles.paymentOption, { flex: 1, backgroundColor: selectedPayment === 'Cash' ? colors.success : colors.border, borderColor: colors.success }]}
                                onPress={() => setSelectedPayment('Cash')}
                            >
                                <Ionicons name="cash-outline" size={32} color={selectedPayment === 'Cash' ? '#000' : colors.success} />
                                <Text style={{ color: selectedPayment === 'Cash' ? '#000' : colors.text, fontWeight: 'bold', marginTop: 8 }}>CASH</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.paymentOption, { flex: 1, backgroundColor: selectedPayment === 'Mpesa' ? colors.secondary : colors.border, borderColor: colors.secondary }]}
                                onPress={() => setSelectedPayment('Mpesa')}
                            >
                                <Ionicons name="phone-portrait-outline" size={32} color={selectedPayment === 'Mpesa' ? '#000' : colors.secondary} />
                                <Text style={{ color: selectedPayment === 'Mpesa' ? '#000' : colors.text, fontWeight: 'bold', marginTop: 8 }}>MPESA</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                style={[styles.modalButton, { flex: 1, backgroundColor: colors.border }]}
                                onPress={() => setDeliveryModalVisible(false)}
                            >
                                <Text style={{ color: colors.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { flex: 2, backgroundColor: colors.success }]}
                                onPress={confirmDelivery}
                            >
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>COMPLETE ORDER ✅</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    greeting: {
        fontSize: 28,
        fontWeight: "bold",
        fontFamily: "System",
    },
    subGreeting: {
        fontSize: 16,
        marginTop: 4,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: "#FED100",
    },
    activeOrderPulse: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: "#000",
    },
    reorderCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    reorderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    reorderTitle: {
        fontWeight: "bold",
        fontSize: 14,
    },
    reorderTime: {
        fontSize: 12,
    },
    reorderItems: {
        fontSize: 16,
        marginBottom: 12,
        fontWeight: "500",
    },
    reorderButton: {
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    reorderButtonText: {
        color: "#FFF",
        fontWeight: "bold",
    },
    categoriesContainer: {
        marginBottom: 24,
    },
    categoryChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
    },
    categoryText: {
        fontWeight: "600",
    },
    productsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    productCard: {
        width: "48%",
        borderRadius: 16,
        marginBottom: 16,
        overflow: "hidden",
        padding: 12,
    },
    productImagePlaceholder: {
        height: 100,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    productInfo: {
        gap: 4,
    },
    productName: {
        fontWeight: "bold",
        fontSize: 16,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: "600",
    },
    addButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    qtyContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: 8,
        gap: 8,
    },
    qtyButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    qtyText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    miniCartOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12, // Adjusted to prevent nav overlap
        paddingHorizontal: 20,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    miniCartContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 15,
    },
    lastAddedInfo: {
        flex: 1,
    },
    miniCartLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    miniCartTotal: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    slideTrack: {
        width: 180,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        padding: 4,
        position: 'relative',
    },
    slideHandle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    slideText: {
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        fontSize: 10,
        fontWeight: 'bold',
        left: 20,
    },
    // Missing styles restored
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    statBox: {
        width: '48%',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10
    },
    statLabel: {
        fontSize: 14,
        marginBottom: 5,
        fontWeight: '600'
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold'
    },
    infoCard: {
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    adminBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statBoxPremium: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 12,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    quickAction: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 4,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    modalButton: {
        height: 55,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    paymentOption: {
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
    }
});
