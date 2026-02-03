import { Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { Package, TrendingDown, Plus, Minus, ClipboardCheck, History } from "lucide-react-native";
import React, { useState, useCallback } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Alert, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import Toast from "react-native-toast-message";

import type { InventoryItem } from "@/types";

export default function InventoryScreen() {
    const { inventory, saveInventory, colors: Colors, settings, getTodayStockRecord, saveDailyStockRecord } = useApp();
    const styles = React.useMemo(() => createStyles(Colors), [Colors]);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showOpeningStockModal, setShowOpeningStockModal] = useState(false);
    const [openingStockValues, setOpeningStockValues] = useState<Record<string, string>>({});
    const [adjustment, setAdjustment] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [newItemName, setNewItemName] = useState("");
    const [newItemPrice, setNewItemPrice] = useState("");
    const [newItemUnit, setNewItemUnit] = useState("pieces");

    const todayRecord = getTodayStockRecord();

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => setRefreshing(false), 800);
    }, []);

    const handleItemPress = (item: InventoryItem) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedItem(item);
        setAdjustment("");
        setShowAdjustModal(true);
    };

    const handleAdjustStock = async (type: "add" | "subtract") => {
        if (!selectedItem || !adjustment || isNaN(Number(adjustment))) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Toast.show({
                type: "error",
                text1: "Invalid quantity",
                text2: "Please enter a valid number",
            });
            return;
        }

        const amount = Number(adjustment);
        const newStock = type === "add"
            ? selectedItem.currentStock + amount
            : selectedItem.currentStock - amount;

        if (newStock < 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Toast.show({
                type: "error",
                text1: "Insufficient stock",
                text2: "Stock cannot be negative",
            });
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const updatedInventory = inventory.map((item) =>
            item.id === selectedItem.id ? { ...item, currentStock: newStock } : item
        );

        await saveInventory(updatedInventory);
        Toast.show({
            type: "success",
            text1: "Stock Updated! 📦",
            text2: `${selectedItem.name} stock is now ${newStock} ${selectedItem.unit}`,
        });
        setShowAdjustModal(false);
    };

    const handleAddNewItem = async () => {
        if (!newItemName || !newItemPrice) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Toast.show({
                type: "error",
                text1: "Missing Info",
                text2: "Please fill item name and price",
            });
            return;
        }

        const price = parseFloat(newItemPrice);
        if (isNaN(price)) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Toast.show({
                type: "error",
                text1: "Invalid Price",
                text2: "Please enter a valid number for price",
            });
            return;
        }

        const newItem: InventoryItem = {
            id: Date.now().toString(),
            name: newItemName,
            price: price,
            currentStock: 0, // Will be set in opening stock
            unit: newItemUnit,
            lowStockThreshold: 10,
        };

        const updatedInventory = [...inventory, newItem];
        await saveInventory(updatedInventory);

        // Update opening stock values for this new item
        setOpeningStockValues(prev => ({ ...prev, [newItem.id]: "0" }));

        const savedName = newItemName;
        setNewItemName("");
        setNewItemPrice("");
        setNewItemUnit("pieces");
        setShowAddItemModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
            type: "success",
            text1: "Item Created! ✨",
            text2: `${savedName} added to your inventory.`,
        });
    };

    const getLowStockCount = () => {
        return inventory.filter((item) => item.currentStock <= item.lowStockThreshold).length;
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <Stack.Screen
                options={{
                    headerShown: false,
                    title: "Inventory",
                    headerStyle: { backgroundColor: Colors.background },
                    headerTintColor: Colors.text,
                }}
            />

            {/* Sticky Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Stock Management</Text>
                <Text style={styles.subtitle}>Track your inventory levels</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={[styles.statCard, styles.halfCard]}>
                    <Package size={20} color={Colors.primary} />
                    <Text style={styles.statLabel}>Total Items</Text>
                    <Text style={styles.statValue}>{inventory.length}</Text>
                </View>

                <View style={[styles.statCard, styles.halfCard]}>
                    <TrendingDown size={20} color={Colors.warning} />
                    <Text style={styles.statLabel}>Low Stock</Text>
                    <Text style={styles.statValue}>{getLowStockCount()}</Text>
                </View>
            </View>

            {/* Scrollable Inventory List */}
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
                {settings.enableDailyStock && (
                    <View style={styles.dailyStockBanner}>
                        <View style={styles.bannerInfo}>
                            <ClipboardCheck size={20} color={todayRecord ? Colors.success : Colors.warning} />
                            <View>
                                <Text style={styles.bannerTitle}>
                                    {todayRecord ? "Opening Stock Set" : "Set Today's Opening Stock"}
                                </Text>
                                <Text style={styles.bannerSubtitle}>
                                    {todayRecord ? "Profit tracking active for today" : "Required for accurate profit calculation"}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.bannerButton, todayRecord && styles.bannerButtonSecondary]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                if (!todayRecord) {
                                    const initialValues: Record<string, string> = {};
                                    inventory.forEach(item => {
                                        initialValues[item.id] = item.currentStock.toString();
                                    });
                                    setOpeningStockValues(initialValues);
                                }
                                setShowOpeningStockModal(true);
                            }}
                        >
                            <Text style={[styles.bannerButtonText, todayRecord && styles.bannerButtonTextSecondary]}>
                                {todayRecord ? "View" : "Set Now"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.inventoryContainer}>
                    {inventory.map((item) => {
                        const isLowStock = item.currentStock <= item.lowStockThreshold;
                        const stockPercentage = (item.currentStock / (item.lowStockThreshold * 3)) * 100;
                        const itemOpeningRecord = todayRecord?.items.find(i => i.inventoryItemId === item.id);

                        return (
                            <Pressable
                                key={item.id}
                                style={({ pressed }) => [
                                    styles.inventoryCard,
                                    pressed && styles.inventoryCardPressed,
                                ]}
                                onPress={() => handleItemPress(item)}
                            >
                                <View style={styles.itemHeader}>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <View style={styles.stockRow}>
                                            <Text style={[styles.stockValue, isLowStock && styles.stockLow]}>
                                                {item.currentStock} {item.unit}
                                            </Text>
                                            {isLowStock && (
                                                <View style={styles.lowStockBadge}>
                                                    <Text style={styles.lowStockText}>LOW</Text>
                                                </View>
                                            )}
                                            {itemOpeningRecord && (
                                                <View style={styles.openingBadge}>
                                                    <Text style={styles.openingBadgeText}>
                                                        Start: {itemOpeningRecord.openingStock}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBar}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                {
                                                    width: `${Math.min(stockPercentage, 100)}%`,
                                                    backgroundColor: isLowStock ? Colors.error : Colors.success,
                                                },
                                            ]}
                                        />
                                    </View>
                                    <View style={styles.stockDetailsRow}>
                                        <Text style={styles.thresholdText}>
                                            Alert threshold: {item.lowStockThreshold} {item.unit}
                                        </Text>
                                        {itemOpeningRecord && (
                                            <Text style={styles.consumedText}>
                                                Used: {Math.max(0, itemOpeningRecord.openingStock - item.currentStock)} {item.unit}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Stock Adjustment Modal */}
            <Modal
                visible={showAdjustModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAdjustModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Adjust Stock</Text>
                            <Text style={styles.modalSubtitle}>{selectedItem?.name}</Text>
                            <Text style={styles.currentStock}>
                                Current: {selectedItem?.currentStock} {selectedItem?.unit}
                            </Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Enter quantity</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                keyboardType="numeric"
                                value={adjustment}
                                onChangeText={setAdjustment}
                            />
                        </View>

                        <View style={styles.buttonRow}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.adjustButton,
                                    styles.addButton,
                                    pressed && styles.adjustButtonPressed,
                                ]}
                                onPress={() => handleAdjustStock("add")}
                            >
                                <Plus size={20} color={Colors.card} />
                                <Text style={styles.adjustButtonText}>Add Stock</Text>
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.adjustButton,
                                    styles.subtractButton,
                                    pressed && styles.adjustButtonPressed,
                                ]}
                                onPress={() => handleAdjustStock("subtract")}
                            >
                                <Minus size={20} color={Colors.card} />
                                <Text style={styles.adjustButtonText}>Remove</Text>
                            </Pressable>
                        </View>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowAdjustModal(false)}
                        >
                            <Text style={styles.closeButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Daily Opening Stock Modal */}
            <Modal
                visible={showOpeningStockModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowOpeningStockModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Today&apos;s Opening Stock</Text>
                            <Text style={styles.modalSubtitle}>Set stock levels at start of work</Text>
                        </View>

                        <ScrollView style={styles.openingStockList} showsVerticalScrollIndicator={false}>
                            {inventory.map((item) => (
                                <View key={item.id} style={styles.openingStockItem}>
                                    <Text style={styles.openingItemName}>{item.name}</Text>
                                    <View style={styles.openingInputRow}>
                                        <TextInput
                                            style={styles.openingInput}
                                            value={openingStockValues[item.id]}
                                            onChangeText={(val) =>
                                                setOpeningStockValues(prev => ({ ...prev, [item.id]: val }))
                                            }
                                            keyboardType="numeric"
                                            placeholder="0"
                                            editable={!todayRecord}
                                        />
                                        <Text style={styles.openingUnit}>{item.unit}</Text>
                                    </View>
                                </View>
                            ))}

                            {!todayRecord && (
                                <TouchableOpacity
                                    style={styles.addCustomItemButton}
                                    onPress={() => setShowAddItemModal(true)}
                                >
                                    <Plus size={18} color={Colors.primary} />
                                    <Text style={styles.addCustomItemText}>Add New Custom Item</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>

                        {!todayRecord ? (
                            <TouchableOpacity
                                style={styles.saveOpeningButton}
                                onPress={async () => {
                                    // Ensure current stock matches opening stock for proper "Used" calculation
                                    const updatedInventory = inventory.map(item => ({
                                        ...item,
                                        currentStock: Number(openingStockValues[item.id] || item.currentStock)
                                    }));
                                    await saveInventory(updatedInventory);

                                    const record = {
                                        id: Date.now().toString(),
                                        date: new Date().toISOString().split("T")[0],
                                        items,
                                        createdAt: new Date().toISOString()
                                    };

                                    await saveDailyStockRecord(record);
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    setShowOpeningStockModal(false);
                                    Toast.show({
                                        type: "success",
                                        text1: "Opening Stock Set! 🏆",
                                        text2: "You can now track today's consumption and profit.",
                                    });
                                }}
                            >
                                <Text style={styles.saveOpeningButtonText}>Save Opening Stock</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.saveOpeningButton, { backgroundColor: Colors.border }]}
                                onPress={() => setShowOpeningStockModal(false)}
                            >
                                <Text style={[styles.saveOpeningButtonText, { color: Colors.text }]}>Close View</Text>
                            </TouchableOpacity>
                        )}

                        {!todayRecord && (
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setShowOpeningStockModal(false)}
                            >
                                <Text style={styles.closeButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Add Custom Item Modal (Quick add from Opening Stock) */}
            <Modal
                visible={showAddItemModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddItemModal(false)}
            >
                <View style={[styles.modalOverlay, { justifyContent: "center" }]}>
                    <View style={[styles.modalContent, { borderRadius: 24, marginHorizontal: 20 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Custom Item</Text>
                            <Text style={styles.modalSubtitle}>Add once, available everywhere</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Item Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Special Mandazi"
                                value={newItemName}
                                onChangeText={setNewItemName}
                            />
                        </View>

                        <View style={styles.buttonRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Price (KES)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="20"
                                    keyboardType="numeric"
                                    value={newItemPrice}
                                    onChangeText={setNewItemPrice}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Unit</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="pcs"
                                    value={newItemUnit}
                                    onChangeText={setNewItemUnit}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveOpeningButton, { marginTop: 20 }]}
                            onPress={handleAddNewItem}
                        >
                            <Text style={styles.saveOpeningButtonText}>Create Item</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowAddItemModal(false)}
                        >
                            <Text style={styles.closeButtonText}>Cancel</Text>
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
    scrollView: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
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
    statsRow: {
        flexDirection: "row",
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
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
    halfCard: {
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 8,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: "700" as const,
        color: Colors.text,
    },
    inventoryContainer: {
        paddingHorizontal: 20,
        gap: 12,
        paddingBottom: 20,
    },
    inventoryCard: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
    },
    inventoryCardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    itemHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 18,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 8,
    },
    stockRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    stockValue: {
        fontSize: 16,
        fontWeight: "600" as const,
        color: Colors.success,
    },
    stockLow: {
        color: Colors.error,
    },
    lowStockBadge: {
        backgroundColor: Colors.error,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    lowStockText: {
        fontSize: 10,
        fontWeight: "700" as const,
        color: Colors.card,
    },
    progressContainer: {
        gap: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: Colors.secondary,
        borderRadius: 4,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 4,
    },
    thresholdText: {
        fontSize: 12,
        color: Colors.textLight,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: Colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    modalHeader: {
        marginBottom: 24,
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
        marginBottom: 8,
    },
    currentStock: {
        fontSize: 18,
        fontWeight: "600" as const,
        color: Colors.primary,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: Colors.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.text,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    adjustButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    adjustButtonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    addButton: {
        backgroundColor: Colors.success,
    },
    subtractButton: {
        backgroundColor: Colors.error,
    },
    adjustButtonText: {
        color: Colors.card,
        fontSize: 16,
        fontWeight: "700" as const,
    },
    closeButton: {
        backgroundColor: Colors.background,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 2,
        borderColor: Colors.border,
    },
    closeButtonText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: "700" as const,
    },
    // Daily Stock Styles
    dailyStockBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Colors.secondary,
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    bannerInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    bannerTitle: {
        fontSize: 14,
        fontWeight: "700" as const,
        color: Colors.text,
    },
    bannerSubtitle: {
        fontSize: 12,
        color: Colors.textLight,
    },
    bannerButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    bannerButtonSecondary: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    bannerButtonText: {
        color: Colors.card,
        fontSize: 12,
        fontWeight: "700" as const,
    },
    bannerButtonTextSecondary: {
        color: Colors.text,
    },
    openingBadge: {
        backgroundColor: Colors.secondary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    openingBadgeText: {
        fontSize: 10,
        fontWeight: "600" as const,
        color: Colors.primary,
    },
    stockDetailsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    consumedText: {
        fontSize: 12,
        fontWeight: "600" as const,
        color: Colors.primary,
    },
    openingStockList: {
        maxHeight: 400,
        marginBottom: 20,
    },
    openingStockItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    openingItemName: {
        fontSize: 16,
        color: Colors.text,
        flex: 1,
    },
    openingInputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    openingInput: {
        backgroundColor: Colors.background,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        width: 80,
        textAlign: "right",
        fontSize: 16,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    openingUnit: {
        fontSize: 14,
        color: Colors.textLight,
        width: 50,
    },
    saveOpeningButton: {
        backgroundColor: Colors.success,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 12,
    },
    saveOpeningButtonText: {
        color: Colors.card,
        fontSize: 16,
        fontWeight: "700" as const,
    },
    addCustomItemButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 15,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: Colors.primary,
        borderRadius: 12,
        marginTop: 10,
        gap: 8,
    },
    addCustomItemText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: "700" as const,
    },
});
