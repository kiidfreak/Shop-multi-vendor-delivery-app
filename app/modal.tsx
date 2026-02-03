import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Plus, X, Minus, Check } from "lucide-react-native";
import React, { useState } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    ScrollView,
    TextInput,
    Alert,
    Pressable,
    KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";

import type { DeliveryItem, Shop, Seller } from "@/types";
import Toast from "react-native-toast-message";

export default function DeliveryFormModal() {
    const insets = useSafeAreaInsets();
    const { shops, inventory, addDelivery, sellers, saveShops, colors: Colors } = useApp();
    const styles = React.useMemo(() => createStyles(Colors), [Colors]);
    const [selectedShop, setSelectedShop] = useState("");
    const [selectedSeller, setSelectedSeller] = useState("");
    const [items, setItems] = useState<DeliveryItem[]>([]);
    const [notes, setNotes] = useState("");
    const [isPaid, setIsPaid] = useState(false);
    const [paidAmount, setPaidAmount] = useState("");

    const [searchQuery, setSearchQuery] = useState("");

    // Custom item state
    const [showCustomItem, setShowCustomItem] = useState(false);
    const [customItemName, setCustomItemName] = useState("");
    const [customItemPrice, setCustomItemPrice] = useState("");
    const [customItemQty, setCustomItemQty] = useState("1");

    const handleAddItem = (inventoryItemId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const inventoryItem = inventory.find((i) => i.id === inventoryItemId);
        if (!inventoryItem) return;

        const existingItem = items.find((i) => i.inventoryItemId === inventoryItemId);
        if (existingItem) {
            setItems(
                items.map((i) =>
                    i.inventoryItemId === inventoryItemId
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                )
            );
        } else {
            setItems([
                ...items,
                { inventoryItemId, quantity: 1, price: inventoryItem.price, name: inventoryItem.name },
            ]);
        }
    };

    const handleUpdateQuantity = (inventoryItemId: string, change: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setItems(
            items
                .map((i) =>
                    i.inventoryItemId === inventoryItemId
                        ? { ...i, quantity: Math.max(0, i.quantity + change) }
                        : i
                )
                .filter((i) => i.quantity > 0)
        );
    };

    // Add custom one-off item
    const handleAddCustomItem = () => {
        if (!customItemName.trim() || !customItemPrice.trim()) {
            Toast.show({
                type: "error",
                text1: "Missing Info",
                text2: "Enter item name and price",
            });
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const customId = `custom_${Date.now()}`;
        const price = parseFloat(customItemPrice) || 0;
        const qty = parseInt(customItemQty) || 1;

        setItems([
            ...items,
            { inventoryItemId: customId, quantity: qty, price: price, name: customItemName }
        ]);

        // Reset custom item form
        setCustomItemName("");
        setCustomItemPrice("");
        setCustomItemQty("1");
        setShowCustomItem(false);

        Toast.show({
            type: "success",
            text1: "Custom Item Added! ✨",
            text2: `${customItemName} x${qty} @ KES ${price}`,
            visibilityTime: 2000,
        });
    };

    const filteredShops = React.useMemo(() => {
        return shops.filter(
            (shop: Shop) =>
                shop.isActive &&
                (shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    shop.location.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [shops, searchQuery]);

    const activeSellers = React.useMemo(() => {
        return sellers.filter((s: Seller) => s.isActive);
    }, [sellers]);

    const handleQuickAddShop = async () => {
        if (!searchQuery.trim()) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const newShop: Shop = {
            id: Date.now().toString(),
            name: searchQuery.trim(),
            owner: "New Client",
            phone: "",
            location: "Not set",
            isActive: true,
        };

        await saveShops([...shops, newShop]);
        setSelectedShop(newShop.id);
        setSearchQuery("");

        Toast.show({
            type: "success",
            text1: "Shop Added! 🏪",
            text2: `${newShop.name} is ready for deliveries`,
            visibilityTime: 2000,
        });
    };

    const getTotalAmount = () => {
        return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    };

    const handleSubmit = async () => {
        if (!selectedShop) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", "Please select a shop");
            return;
        }

        if (!selectedSeller) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", "Please select who delivered");
            return;
        }

        if (items.length === 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", "Please add at least one item");
            return;
        }

        const totalAmount = getTotalAmount();
        const finalPaidAmount = isPaid ? totalAmount : (parseFloat(paidAmount) || 0);

        const delivery = {
            id: Date.now().toString(),
            shopId: selectedShop,
            sellerId: selectedSeller,
            items,
            totalAmount: totalAmount,
            paidAmount: finalPaidAmount,
            isPaid: finalPaidAmount >= totalAmount,
            deliveryDate: new Date().toISOString(),
            notes: notes || undefined,
        };

        await addDelivery(delivery);

        Toast.show({
            type: "success",
            text1: "Delivery Registered! 🚚",
            text2: `Total: KES ${totalAmount.toLocaleString()}`,
            visibilityTime: 2000,
        });

        // Auto-close modal immediately
        router.back();
    };

    return (
        <>
            <TouchableWithoutFeedback onPress={() => router.back()}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={[styles.modalContent, { paddingBottom: Math.max(20, insets.bottom + 10) }]}>
                    <View style={styles.dragHandleContainer}>
                        <View style={styles.dragHandle} />
                        <Text style={styles.handleText}>Record Delivery</Text>
                    </View>
                    <View style={styles.header}>
                        <View />
                        <TouchableOpacity onPress={() => router.back()} style={styles.closeIcon}>
                            <X size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        bounces={true}
                    >
                        <View style={styles.section}>
                            <Text style={styles.label}>Who Delivered?</Text>
                            <View style={styles.shopsList}>
                                {activeSellers.map((seller) => (
                                    <Pressable
                                        key={seller.id}
                                        style={({ pressed }) => [
                                            styles.shopChip,
                                            selectedSeller === seller.id && styles.shopChipSelected,
                                            pressed && styles.shopChipPressed,
                                        ]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            setSelectedSeller(seller.id);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.shopChipText,
                                                selectedSeller === seller.id && styles.shopChipTextSelected,
                                            ]}
                                        >
                                            {seller.name}
                                        </Text>
                                        {selectedSeller === seller.id && (
                                            <Check size={16} color={Colors.card} style={{ marginLeft: 4 }} />
                                        )}
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.label}>Select Shop</Text>
                                <TextInput
                                    style={styles.searchBar}
                                    placeholder="Search shop..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholderTextColor={Colors.textLight}
                                />
                            </View>
                            <View style={styles.shopsList}>
                                {filteredShops.slice(0, 5).map((shop) => (
                                    <Pressable
                                        key={shop.id}
                                        style={({ pressed }) => [
                                            styles.shopChip,
                                            selectedShop === shop.id && styles.shopChipSelected,
                                            pressed && styles.shopChipPressed,
                                        ]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            setSelectedShop(shop.id);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.shopChipText,
                                                selectedShop === shop.id && styles.shopChipTextSelected,
                                            ]}
                                        >
                                            {shop.name}
                                        </Text>
                                        {selectedShop === shop.id && (
                                            <Check size={16} color={Colors.card} style={{ marginLeft: 4 }} />
                                        )}
                                    </Pressable>
                                ))}
                                {filteredShops.length === 0 && searchQuery.trim() && (
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.addShopChip,
                                            pressed && styles.shopChipPressed,
                                        ]}
                                        onPress={handleQuickAddShop}
                                    >
                                        <Plus size={16} color={Colors.primary} />
                                        <Text style={styles.addShopText}>Add "{searchQuery.trim()}"</Text>
                                    </Pressable>
                                )}
                                {filteredShops.length === 0 && !searchQuery.trim() && (
                                    <Text style={styles.emptyText}>No shops found</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>Add Items</Text>
                            {inventory.map((item) => {
                                const deliveryItem = items.find((i) => i.inventoryItemId === item.id);
                                return (
                                    <View key={item.id} style={styles.inventoryItem}>
                                        <View style={styles.inventoryItemHeader}>
                                            <Text style={styles.inventoryItemName}>{item.name}</Text>
                                            {!deliveryItem ? (
                                                <Pressable
                                                    style={({ pressed }) => [
                                                        styles.addButton,
                                                        pressed && styles.addButtonPressed,
                                                    ]}
                                                    onPress={() => handleAddItem(item.id)}
                                                >
                                                    <Plus size={20} color={Colors.card} />
                                                </Pressable>
                                            ) : (
                                                <View style={styles.quantityControls}>
                                                    <Pressable
                                                        style={({ pressed }) => [
                                                            styles.quantityButton,
                                                            pressed && styles.quantityButtonPressed,
                                                        ]}
                                                        onPress={() => handleUpdateQuantity(item.id, -1)}
                                                    >
                                                        <Minus size={18} color={Colors.primary} />
                                                    </Pressable>
                                                    <Text style={styles.quantity}>{deliveryItem.quantity}</Text>
                                                    <Pressable
                                                        style={({ pressed }) => [
                                                            styles.quantityButton,
                                                            pressed && styles.quantityButtonPressed,
                                                        ]}
                                                        onPress={() => handleUpdateQuantity(item.id, 1)}
                                                    >
                                                        <Plus size={18} color={Colors.primary} />
                                                    </Pressable>
                                                    <Text style={styles.priceDisplay}>KES {deliveryItem.price}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}

                            {/* Custom Item Section */}
                            {!showCustomItem ? (
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.addCustomButton,
                                        pressed && styles.addCustomButtonPressed,
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setShowCustomItem(true);
                                    }}
                                >
                                    <Plus size={18} color={Colors.primary} />
                                    <Text style={styles.addCustomText}>Add Custom Item</Text>
                                </Pressable>
                            ) : (
                                <View style={styles.customItemForm}>
                                    <Text style={styles.customItemLabel}>Custom Item</Text>
                                    <TextInput
                                        style={styles.customItemInput}
                                        placeholder="Item name (e.g. Birthday Cake)"
                                        placeholderTextColor={Colors.mutedText}
                                        value={customItemName}
                                        onChangeText={setCustomItemName}
                                    />
                                    <View style={styles.customItemRow}>
                                        <TextInput
                                            style={[styles.customItemInput, { flex: 1 }]}
                                            placeholder="Price (KES)"
                                            placeholderTextColor={Colors.mutedText}
                                            keyboardType="numeric"
                                            value={customItemPrice}
                                            onChangeText={setCustomItemPrice}
                                        />
                                        <TextInput
                                            style={[styles.customItemInput, { width: 60, marginLeft: 8 }]}
                                            placeholder="Qty"
                                            placeholderTextColor={Colors.mutedText}
                                            keyboardType="numeric"
                                            value={customItemQty}
                                            onChangeText={setCustomItemQty}
                                        />
                                    </View>
                                    <View style={styles.customItemActions}>
                                        <Pressable
                                            style={styles.customItemCancel}
                                            onPress={() => {
                                                setShowCustomItem(false);
                                                setCustomItemName("");
                                                setCustomItemPrice("");
                                                setCustomItemQty("1");
                                            }}
                                        >
                                            <Text style={styles.customItemCancelText}>Cancel</Text>
                                        </Pressable>
                                        <Pressable
                                            style={styles.customItemAdd}
                                            onPress={handleAddCustomItem}
                                        >
                                            <Text style={styles.customItemAddText}>Add Item</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            )}

                            {/* Show added custom items */}
                            {items.filter(i => i.inventoryItemId.startsWith('custom_')).map((item, idx) => (
                                <View key={item.inventoryItemId} style={styles.customItemDisplay}>
                                    <View style={styles.customItemInfo}>
                                        <Text style={styles.customItemTag}>CUSTOM</Text>
                                        <Text style={styles.inventoryItemName}>
                                            {item.quantity}x @ KES {item.price}
                                        </Text>
                                    </View>
                                    <Pressable
                                        style={styles.removeCustomButton}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setItems(items.filter(i => i.inventoryItemId !== item.inventoryItemId));
                                        }}
                                    >
                                        <Minus size={16} color={Colors.danger} />
                                    </Pressable>
                                </View>
                            ))}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>Notes (Optional)</Text>
                            <TextInput
                                style={styles.notesInput}
                                placeholder="Add delivery notes..."
                                multiline
                                numberOfLines={3}
                                value={notes}
                                onChangeText={setNotes}
                            />
                        </View>

                        <View style={styles.section}>
                            <View style={styles.paidHeader}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.paidToggle,
                                        pressed && styles.paidTogglePressed,
                                        { marginBottom: 0 }
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        const newIsPaid = !isPaid;
                                        setIsPaid(newIsPaid);
                                        if (newIsPaid) setPaidAmount(getTotalAmount().toString());
                                        else setPaidAmount("");
                                    }}
                                >
                                    <View style={[styles.checkbox, isPaid && styles.checkboxChecked]}>
                                        {isPaid && <Check size={18} color={Colors.card} />}
                                    </View>
                                    <View>
                                        <Text style={styles.paidLabel}>Fully Paid</Text>
                                        <Text style={styles.paidSubtitle}>Check if payment is complete</Text>
                                    </View>
                                </Pressable>
                            </View>

                            {!isPaid && (
                                <View style={styles.partialInputContainer}>
                                    <Text style={styles.smallLabel}>Amount Paid (KES)</Text>
                                    <TextInput
                                        style={styles.paidInput}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        value={paidAmount}
                                        onChangeText={setPaidAmount}
                                    />
                                </View>
                            )}
                        </View>

                        <View style={styles.totalSection}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalAmount}>KES {getTotalAmount().toLocaleString()}</Text>
                        </View>
                    </ScrollView>

                    <Pressable
                        style={({ pressed }) => [
                            styles.submitButton,
                            pressed && styles.submitButtonPressed,
                            items.length === 0 && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={items.length === 0}
                    >
                        <Text style={styles.submitButtonText}>Record Delivery</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>

            <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
        </>
    );
}

const createStyles = (Colors: any) => StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: Colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: "75%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    dragHandleContainer: {
        alignItems: "center",
        marginBottom: 10,
    },
    dragHandle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: Colors.border,
        marginBottom: 8,
    },
    handleText: {
        fontSize: 12,
        fontWeight: "700" as const,
        color: Colors.textLight,
        textTransform: "uppercase" as const,
        letterSpacing: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: "700" as const,
        color: Colors.text,
    },
    closeIcon: {
        padding: 4,
    },
    scrollView: {
        marginBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "600" as const,
        color: Colors.text,
        marginBottom: 12,
    },
    shopsList: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    shopChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: Colors.background,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    shopChipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    shopChipPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    shopChipText: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: "600" as const,
    },
    shopChipTextSelected: {
        color: Colors.card,
    },
    inventoryItem: {
        marginBottom: 12,
    },
    inventoryItemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: Colors.background,
        padding: 12,
        borderRadius: 12,
    },
    inventoryItemName: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: Colors.text,
        flex: 1,
    },
    addButton: {
        backgroundColor: Colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    addButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.95 }],
    },
    quantityControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    quantityButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.card,
    },
    quantityButtonPressed: {
        backgroundColor: Colors.secondary,
        transform: [{ scale: 0.95 }],
    },
    quantity: {
        fontSize: 14,
        fontWeight: "700" as const,
        color: Colors.text,
        minWidth: 24,
        textAlign: "center",
    },
    priceDisplay: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: Colors.success,
        minWidth: 70,
        textAlign: "center",
        backgroundColor: Colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    notesInput: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: Colors.text,
        borderWidth: 2,
        borderColor: Colors.border,
        minHeight: 80,
        textAlignVertical: "top",
    },
    paidToggle: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        padding: 16,
        backgroundColor: Colors.background,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    paidTogglePressed: {
        backgroundColor: Colors.secondary,
        transform: [{ scale: 0.98 }],
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: Colors.success,
        borderColor: Colors.success,
    },
    paidLabel: {
        fontSize: 16,
        fontWeight: "600" as const,
        color: Colors.text,
    },
    totalSection: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    totalLabel: {
        fontSize: 14,
        color: Colors.secondary,
        marginBottom: 4,
    },
    totalAmount: {
        fontSize: 28,
        fontWeight: "700" as const,
        color: Colors.card,
    },
    submitButton: {
        backgroundColor: Colors.primary,
        padding: 18,
        borderRadius: 12,
        alignItems: "center",
        elevation: 4,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    submitButtonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    submitButtonDisabled: {
        backgroundColor: Colors.textLight,
        opacity: 0.5,
    },
    submitButtonText: {
        color: Colors.card,
        fontSize: 18,
        fontWeight: "700" as const,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    searchBar: {
        backgroundColor: Colors.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 14,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
        width: "50%",
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textLight,
        textAlign: "center",
        width: "100%",
        marginTop: 8,
    },
    paidHeader: {
        marginBottom: 10,
    },
    paidSubtitle: {
        fontSize: 12,
        color: Colors.textLight,
    },
    partialInputContainer: {
        marginTop: 12,
        padding: 16,
        backgroundColor: Colors.background,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    smallLabel: {
        fontSize: 12,
        fontWeight: "700" as const,
        color: Colors.textLight,
        marginBottom: 8,
        textTransform: "uppercase",
    },
    paidInput: {
        fontSize: 20,
        fontWeight: "700" as const,
        color: Colors.text,
        padding: 0,
    },
    addShopChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: Colors.secondary,
        borderWidth: 2,
        borderColor: Colors.primary,
        borderStyle: "dashed",
        gap: 8,
    },
    addShopText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: "700" as const,
    },
    // Custom Item Styles
    addCustomButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        marginTop: 12,
        borderRadius: 12,
        backgroundColor: Colors.secondary,
        borderWidth: 2,
        borderColor: Colors.primary,
        borderStyle: "dashed",
        gap: 8,
    },
    addCustomButtonPressed: {
        opacity: 0.7,
    },
    addCustomText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: "600" as const,
    },
    customItemForm: {
        marginTop: 16,
        padding: 16,
        backgroundColor: Colors.secondary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    customItemLabel: {
        fontSize: 14,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 12,
    },
    customItemInput: {
        backgroundColor: Colors.card,
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 10,
    },
    customItemRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    customItemActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
    },
    customItemCancel: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    customItemCancelText: {
        fontSize: 14,
        color: Colors.mutedText,
        fontWeight: "600" as const,
    },
    customItemAdd: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: Colors.primary,
        borderRadius: 8,
    },
    customItemAddText: {
        fontSize: 14,
        color: Colors.card,
        fontWeight: "700" as const,
    },
    customItemDisplay: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginTop: 10,
        backgroundColor: Colors.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    customItemInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    customItemTag: {
        fontSize: 10,
        fontWeight: "800" as const,
        color: Colors.card,
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    removeCustomButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: Colors.dangerLight || Colors.secondary,
    },
});
