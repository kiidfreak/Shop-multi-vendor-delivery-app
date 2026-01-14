import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Switch, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { Product } from "@/types";

export default function InventoryScreen() {
    const { colors, products, addProduct, updateProduct } = useApp();
    const router = useRouter();

    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState<"Miraa" | "Smoke" | "Munchies">("Miraa");
    const [inStock, setInStock] = useState(true);

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setName(product.name);
            setPrice(product.price.toString());
            setCategory(product.category);
            setInStock(product.inStock ?? true);
        } else {
            setEditingProduct(null);
            setName("");
            setPrice("");
            setCategory("Miraa");
            setInStock(true);
        }
        setModalVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleSave = () => {
        if (!name || !price) {
            Alert.alert("Missing Info", "Product needs a name and price.");
            return;
        }

        if (editingProduct) {
            updateProduct(editingProduct.id, {
                name,
                price: Number(price),
                category,
                inStock
            });
        } else {
            const newProduct: Product = {
                id: Date.now().toString(),
                name,
                price: Number(price),
                category,
                inStock,
                isPopular: false,
                description: "Fresh stock"
            };
            addProduct(newProduct);
        }
        setModalVisible(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Stock Control 📦</Text>
            </View>

            <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: colors.card, borderColor: item.inStock === false ? colors.error : colors.border }]}
                        onPress={() => handleOpenModal(item)}
                    >
                        <View style={styles.cardInfo}>
                            <Text style={[styles.name, { color: colors.text, textDecorationLine: item.inStock === false ? 'line-through' : 'none' }]}>{item.name}</Text>
                            <Text style={{ color: colors.textLight }}>{item.category}</Text>
                        </View>
                        <View style={styles.stats}>
                            <Text style={{ color: colors.success, fontWeight: "bold", fontSize: 16 }}>KES {item.price}</Text>
                            {!item.inStock && <Text style={{ color: colors.error, fontSize: 12 }}>OUT OF STOCK</Text>}
                        </View>
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => handleOpenModal()}
            >
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            {/* Re-Stock Button */}
            <TouchableOpacity
                style={{ position: 'absolute', bottom: 120, right: 40, alignItems: 'center' }}
                onPress={() => {
                    const DEFAULT_STOCK: Product[] = [
                        { id: `def-1-${Date.now()}`, name: "Giza (Mogoka)", price: 50, category: "Miraa", description: "Fresh fast power", isPopular: true, inStock: true },
                        { id: `def-2-${Date.now()}`, name: "Alehandro", price: 100, category: "Miraa", description: "Upper class chew", inStock: true },
                        { id: `def-3-${Date.now()}`, name: "Sportsman", price: 250, category: "Smoke", description: "Original flavor", inStock: true },
                        { id: `def-4-${Date.now()}`, name: "Dunhill Switch", price: 300, category: "Smoke", description: "Mint click", isPopular: true, inStock: true },
                        { id: `def-5-${Date.now()}`, name: "Big G", price: 5, category: "Munchies", description: "Chewing gum", inStock: true },
                    ];
                    Alert.alert("Re-Stock Defaults?", "This will add 5 standard items to your DB.", [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Add Stock", onPress: () => {
                                DEFAULT_STOCK.forEach(p => addProduct(p));
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            }
                        }
                    ]);
                }}
            >
                <View style={{ backgroundColor: '#222', padding: 10, borderRadius: 20 }}>
                    <Ionicons name="refresh" size={20} color={colors.textLight} />
                </View>
                <Text style={{ color: colors.textLight, fontSize: 10, marginTop: 4 }}>Defaults</Text>
            </TouchableOpacity>

            {/* Edit/Add Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark" />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ width: '100%', alignItems: 'center' }}
                    >
                        <View style={[styles.modalContent, { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {editingProduct ? "Edit Product" : "Add New Stock"}
                            </Text>

                            <Text style={{ color: colors.textLight, marginBottom: 6, fontSize: 12 }}>PRODUCT NAME</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: '#111' }]}
                                placeholder="e.g. Giza, Dunhill..."
                                placeholderTextColor={colors.textLight}
                                value={name}
                                onChangeText={setName}
                            />

                            <Text style={{ color: colors.textLight, marginBottom: 6, fontSize: 12 }}>PRICE (KES)</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: '#111' }]}
                                placeholder="e.g. 100"
                                placeholderTextColor={colors.textLight}
                                value={price}
                                onChangeText={setPrice}
                                keyboardType="numeric"
                            />

                            <Text style={{ color: colors.textLight, marginBottom: 8, fontSize: 12 }}>CATEGORY</Text>
                            <View style={styles.categoryRow}>
                                {["Miraa", "Smoke", "Munchies"].map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.catBadge, { backgroundColor: category === cat ? colors.primary : '#333' }]}
                                        onPress={() => setCategory(cat as any)}
                                    >
                                        <Text style={{ color: category === cat ? '#000' : colors.text, fontWeight: 'bold' }}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.switchRow}>
                                <Text style={{ color: colors.text, fontSize: 16 }}>In Stock?</Text>
                                <Switch value={inStock} onValueChange={setInStock} trackColor={{ true: colors.success, false: '#333' }} />
                            </View>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#333' }]} onPress={() => setModalVisible(false)}>
                                    <Text style={{ color: colors.text }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.success }]} onPress={handleSave}>
                                    <Text style={{ color: "#FFF", fontWeight: "bold" }}>✅ Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", padding: 20 },
    backButton: { marginRight: 16 },
    title: { fontSize: 24, fontWeight: "bold" },
    card: { flexDirection: "row", padding: 16, borderRadius: 16, marginBottom: 12, alignItems: "center", borderWidth: 1 },
    cardInfo: { flex: 1 },
    name: { fontSize: 18, fontWeight: "bold", marginBottom: 2 },
    stats: { alignItems: "flex-end" },
    fab: { position: "absolute", bottom: 40, right: 30, width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", elevation: 5 },
    categoryRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
    catBadge: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
    switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },

    // Modal
    modalContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    modalContent: { width: "85%", padding: 24, borderRadius: 24, elevation: 10 },
    modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
    input: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16 },
    modalButtons: { flexDirection: "row", gap: 12, marginTop: 10 },
    modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: "center" }
});
