import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Exercise = {
  id: string;
  name: string;
  sets: string;
  reps: string;
  weight: string;
};

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  const [name, setName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const isFormValid = name.trim() && sets.trim() && reps.trim() && weight.trim();


   // Laden der gespeicherten Übungen beim Start
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const storedExercises = await AsyncStorage.getItem("exercises");
        if (storedExercises) {
          setExercises(JSON.parse(storedExercises));
        }
      } catch (error) {
        console.error("Fehler beim Laden der Übungen:", error);
      }
    };
    loadExercises();
  }, []);

  // Speichern bei jeder Änderung
  useEffect(() => {
    const saveExercises = async () => {
      try {
        await AsyncStorage.setItem("exercises", JSON.stringify(exercises));
      } catch (error) {
        console.error("Fehler beim Speichern der Übungen:", error);
      }
    };
    saveExercises();
  }, [exercises]);


  const openAddModal = () => {
    setEditingExercise(null);
    setName("");
    setSets("");
    setReps("");
    setWeight("");
    setModalVisible(true);
  };

  const saveExercise = () => {
    if (!isFormValid) return;

    if (editingExercise) {
      // Bearbeiten
      setExercises(prev =>
        prev.map(e =>
          e.id === editingExercise.id
            ? { ...e, name, sets, reps, weight }
            : e
        )
      );
    } else {
      // Neu hinzufügen
      setExercises([
        ...exercises,
        { id: Date.now().toString(), name, sets, reps, weight },
      ]);
    }

    setModalVisible(false);
    setEditingExercise(null);
    setName("");
    setSets("");
    setReps("");
    setWeight("");
  };

  const confirmDelete = (exercise: Exercise) => {
    setExerciseToDelete(exercise);
    setDeleteModalVisible(true);
  };

  const deleteExercise = () => {
    if (!exerciseToDelete) return;
    setExercises(prev => prev.filter(e => e.id !== exerciseToDelete.id));
    setDeleteModalVisible(false);
    setExerciseToDelete(null);
  };

  const openEditModal = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setName(exercise.name);
    setSets(exercise.sets);
    setReps(exercise.reps);
    setWeight(exercise.weight);
    setModalVisible(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.header}>Übungen</Text>
      {/* Übungsliste */}
      <FlatList
        data={[...exercises].sort((a, b) => a.name.localeCompare(b.name))}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ alignItems: "center", paddingVertical: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.exerciseCard}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.exerciseName}>{item.name}</Text>
            <Text style={styles.exerciseMiddle}>
              {item.sets} x {item.reps}
            </Text>
            <Text style={styles.exerciseWeight}>{item.weight} kg</Text>
            <TouchableOpacity onPress={() => confirmDelete(item)} style={{ padding: 8 }}>
              <MaterialIcons name="delete" size={24} color="#E53935" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: "#aaa" }}>
            Noch keine Übungen
          </Text>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openAddModal}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Popup Add/Edit */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingExercise ? "Übung bearbeiten" : "Übung hinzufügen"}
            </Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              placeholder="Name der Übung"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <Text style={styles.inputLabel}>Sätze</Text>
            <TextInput
              placeholder="Anzahl Sätze"
              placeholderTextColor="#aaa"
              value={sets}
              onChangeText={setSets}
              keyboardType="numeric"
              style={styles.input}
            />
            <Text style={styles.inputLabel}>Wiederholungen</Text>
            <TextInput
              placeholder="Anzahl Wiederholungen"
              placeholderTextColor="#aaa"
              value={reps}
              onChangeText={setReps}
              keyboardType="numeric"
              style={styles.input}
            />
            <Text style={styles.inputLabel}>Gewicht</Text>
            <TextInput
              placeholder="Gewicht (kg)"
              placeholderTextColor="#aaa"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              style={styles.input}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingExercise(null);
                }}
              >
                <Text style={styles.buttonText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  isFormValid ? styles.saveButton : styles.saveButtonDisabled
                ]}
                onPress={saveExercise}
                disabled={!isFormValid}
              >
                <Text style={styles.buttonText}>
                  {editingExercise ? "Speichern" : "Hinzufügen"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Popup */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: '80%' }]}>
            <Text style={[styles.modalTitle, { color: '#fff' }]}>
              Willst du die Übung wirklich löschen?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 }}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.buttonText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={deleteExercise}
              >
                <Text style={styles.buttonText}>Löschen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginTop: 45,
    marginBottom: 5,
  },

  exerciseCard: {
    width: "90%",
    backgroundColor: "#2E2E2E",
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  exerciseName: { flex: 1, fontWeight: "bold", color: "#fff" },
  exerciseMiddle: { flex: 1, textAlign: "center", color: "#fff" },
  exerciseWeight: { flex: 1, textAlign: "right", color: "#fff", marginRight: 15 },

  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007AFF",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(33,33,36,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#212124",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    color: "#fff",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 10,
  },
  cancelButton: { backgroundColor: "#E53935" },
  saveButton: { backgroundColor: "#007AFF" },
  saveButtonDisabled: { backgroundColor: "#555" },
  buttonText: { color: "#fff" },

  inputLabel: {
  color: "#fff",
  fontSize: 14,
  marginTop: 8,
  marginBottom: 2,
},
});
