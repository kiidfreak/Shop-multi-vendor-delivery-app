import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { Rider } from "@/types";

export default function RidersScreen() {
    const { colors, riders, addRider, updateRider } = useApp();
    const router = useRouter();

    const [modalVisible, setModalVisible] = useState(false);
    const [editingRider, setEditingRider] = useState<Rider | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [pin, setPin] = useState("");

    const handleOpenModal = (rider?: Rider) => {
        if (rider) {
            setEditingRider(rider);
            setName(rider.name);
            setPhone(rider.phone);
            setPin(rider.pin || "");
        } else {
            setEditingRider(null);
            setName("");
            setPhone("");
            setPin("");
        }
        setModalVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleSave = () => {
        if (!name || !phone || !pin) {
            Alert.alert("Missing Info", "Fill in all fields, fam.");
            return;
        }

        if (editingRider) {
            updateRider(editingRider.id, { name, phone, pin });
        } else {
            const newRider: Rider = {
                id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                name,
                phone,
                pin,
                rating: 0.0,
                status: "Available",
                statusSummary: "Fresh on the road 🆕",
                ordersCompleted: 0,
                avatar: "" // Empty string will trigger fallback icon in UI
            };
            addRider(newRider);
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
                <Text style={[styles.title, { color: colors.text }]}>Manage Riders 🏍️</Text>
            </View>

            <FlatList
                data={riders}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => handleOpenModal(item)}
                    >
                        <Image source={{ uri: item.avatar || "https://i.pravatar.cc/150" }} style={styles.avatar} />
                        <View style={styles.cardInfo}>
                            <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                            <Text style={{ color: colors.textLight }}>{item.phone}</Text>
                            <Text style={{ color: colors.success }}>PIN: ****</Text>
                        </View>
                        <View style={styles.stats}>
                            <Text style={{ color: colors.secondary, fontWeight: "bold" }}>{item.rating} ★</Text>
                            <Text style={{ color: colors.textLight, fontSize: 12 }}>{item.ordersCompleted} runs</Text>
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

            {/* Edit/Add Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {editingRider ? "Edit Rider" : "New Recruit"}
                        </Text>

                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Name (e.g. Speedy Joe)"
                            placeholderTextColor={colors.textLight}
                            value={name}
                            onChangeText={setName}
                        />
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Phone (07... 10 digits max)"
                            placeholderTextColor={colors.textLight}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Security PIN (4 digits)"
                            placeholderTextColor={colors.textLight}
                            value={pin}
                            onChangeText={setPin}
                            keyboardType="number-pad"
                            maxLength={8}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.border }]} onPress={() => setModalVisible(false)}>
                                <Text style={{ color: colors.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
                                <Text style={{ color: "#FFF", fontWeight: "bold" }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
    cardInfo: { flex: 1 },
    name: { fontSize: 18, fontWeight: "bold", marginBottom: 2 },
    stats: { alignItems: "flex-end" },
    fab: { position: "absolute", bottom: 40, right: 30, width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", elevation: 5 },

    // Modal
    modalContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    modalContent: { width: "85%", padding: 24, borderRadius: 24, elevation: 10 },
    modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
    input: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16 },
    modalButtons: { flexDirection: "row", gap: 12, marginTop: 10 },
    modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: "center" }
});
