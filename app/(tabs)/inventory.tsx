import { Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { Package, TrendingDown, Plus, Minus } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";
import type { InventoryItem } from "@/types";

export default function InventoryScreen() {
    const { inventory, saveInventory } = useApp();
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustment, setAdjustment] = useState("");

    const handleItemPress = (item: InventoryItem) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedItem(item);
        setAdjustment("");
        setShowAdjustModal(true);
    };

    const handleAdjustStock = async (type: "add" | "subtract") => {
        if (!selectedItem || !adjustment || isNaN(Number(adjustment))) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", "Please enter a valid number");
            return;
        }

        const amount = Number(adjustment);
        const newStock = type === "add"
            ? selectedItem.currentStock + amount
            : selectedItem.currentStock - amount;

        if (newStock < 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", "Stock cannot be negative");
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const updatedInventory = inventory.map((item) =>
            item.id === selectedItem.id ? { ...item, currentStock: newStock } : item
        );

        await saveInventory(updatedInventory);
        Alert.alert("Success", `Stock updated successfully!`);
        setShowAdjustModal(false);
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
            >
                <View style={styles.inventoryContainer}>
                    {inventory.map((item) => {
                        const isLowStock = item.currentStock <= item.lowStockThreshold;
                        const stockPercentage = (item.currentStock / (item.lowStockThreshold * 3)) * 100;

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
                                    <Text style={styles.thresholdText}>
                                        Alert threshold: {item.lowStockThreshold} {item.unit}
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>

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
        backgroundColor: "rgba(0, 0, 0, 0.5)",
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
});
