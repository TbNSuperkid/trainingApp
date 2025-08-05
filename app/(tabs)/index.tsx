import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
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

type TrainingPlan = {
  id: string;
  name: string;
  day: string;
  exercises: Exercise[];
};

export default function PlansScreen() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<TrainingPlan | null>(null);
  const [editingPlan, setEditingPlan] = useState<TrainingPlan | null>(null);

  const [name, setName] = useState("");
  const [day, setDay] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

  const isFormValid = name.trim() &&  selectedExercises.length > 0;

  // 🔹 Trainingspläne und Übungen aus AsyncStorage laden
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedPlans = await AsyncStorage.getItem("trainingPlans");
        if (storedPlans) setPlans(JSON.parse(storedPlans));

        const storedExercises = await AsyncStorage.getItem("exercises");
        if (storedExercises) setAllExercises(JSON.parse(storedExercises));
      } catch (error) {
        console.error("Fehler beim Laden:", error);
      }
    };
    loadData();
  }, []);


  const startEditPlan = (plan: TrainingPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setDay(plan.day);
    setSelectedExercises(plan.exercises);
    setModalVisible(true);
  };


  const confirmDelete = (plan: TrainingPlan) => {
    setPlanToDelete(plan);
    setDeleteModalVisible(true);
  };

  const deletePlan = () => {
    if (!planToDelete) return;
    setPlans(prev => prev.filter(p => p.id !== planToDelete.id));
    setDeleteModalVisible(false);
    setPlanToDelete(null);
  };

  // 🔹 Trainingspläne in AsyncStorage speichern
  useEffect(() => {
    const savePlans = async () => {
      try {
        await AsyncStorage.setItem("trainingPlans", JSON.stringify(plans));
      } catch (error) {
        console.error("Fehler beim Speichern:", error);
      }
    };
    savePlans();
  }, [plans]);

  const toggleExerciseSelection = (exercise: Exercise) => {
    if (selectedExercises.find(e => e.id === exercise.id)) {
      setSelectedExercises(prev => prev.filter(e => e.id !== exercise.id));
    } else {
      setSelectedExercises(prev => [...prev, exercise]);
    }
  };

  const addPlan = () => {
  if (!isFormValid) return;

  if (editingPlan) {
    // Bearbeiten
    const updatedPlans = plans.map(p =>
      p.id === editingPlan.id ? { ...p, name, day, exercises: selectedExercises } : p
    );
    setPlans(updatedPlans);
  } else {
    // Neu erstellen
    setPlans(prev => [
      ...prev,
      { id: Date.now().toString(), name, day, exercises: selectedExercises },
    ]);
  }

  setModalVisible(false);
  setName("");
  setDay("");
  setSelectedExercises([]);
  setEditingPlan(null);
};


  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.header}>Trainingspläne</Text>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ alignItems: "stretch", paddingVertical: 10 }}
        renderItem={({ item }) => (
          <View style={styles.planCard}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* Stift-Button */}
              <TouchableOpacity
                onPress={() => startEditPlan(item)}
                style={{ padding: 8 }}
              >
                <MaterialCommunityIcons name="pencil" size={24} color="#4CAF50" />
              </TouchableOpacity>

              {/* Textbereich */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={styles.planTitle}>
                  {item.name}{item.day ? ` – ${item.day}` : ""}
                </Text>
                {item.exercises.slice(0, 3).map((ex, idx) => (
                  <Text key={idx} style={styles.planExercise}>
                    • {ex.name} ({ex.sets} x {ex.reps})
                  </Text>
                ))}
              </View>

              {/* Mülleimer */}
              <TouchableOpacity
                onPress={() => confirmDelete(item)}
                style={{ padding: 8 }}
              >
                <MaterialIcons name="delete" size={24} color="#E53935" />
              </TouchableOpacity>
            </View>
          </View>
        )}


        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: "#aaa" }}>
            Noch keine Trainingspläne
          </Text>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
         onPress={() => {
          setEditingPlan(null);     // Bearbeitungsmodus verlassen
          setName("");              // Name leeren
          setDay("");               // Tag leeren
          setSelectedExercises([]); // Keine Übungen ausgewählt
          setModalVisible(true);    // Popup öffnen
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Popup */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Trainingsplan erstellen</Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              placeholder="Name des Plans"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Wochentag</Text>
            <TextInput
              placeholder="z. B. Montag"
              placeholderTextColor="#aaa"
              value={day}
              onChangeText={setDay}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Übungen auswählen</Text>
            <View style={styles.exerciseListContainer}>
            <ScrollView style={{ maxHeight: 240 }}>
              {allExercises.length === 0 ? (
                <Text style={{ color: "#aaa", marginVertical: 5 }}>Keine Übungen vorhanden</Text>
              ) : (
                allExercises.map((exercise) => (
                  <TouchableOpacity
                    key={exercise.id}
                    onPress={() => toggleExerciseSelection(exercise)}
                    style={[
                      styles.exerciseSelect,
                      selectedExercises.find(e => e.id === exercise.id) && styles.exerciseSelected
                    ]}
                  >
                    <Text style={{ color: "#fff" }}>{exercise.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  isFormValid ? styles.saveButton : styles.saveButtonDisabled
                ]}
                onPress={addPlan}
                disabled={!isFormValid}
              >
                <Text style={styles.buttonText}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/*Popup zum Löschen*/}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: "80%" }]}>
            <Text style={[styles.modalTitle, { color: "#fff" }]}>
              Willst du diesen Plan wirklich löschen?
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 15 }}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setEditingPlan(null); // 🔹 Bearbeitungsstatus zurücksetzen
                }}
              >
                <Text style={styles.buttonText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={deletePlan}
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

  planCard: {
    width: "90%",
    alignItems: "center",           
    backgroundColor: "#2E2E2E",
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 8,
    alignSelf: "center",     // 🔹 ganz wichtig, damit die 90% in FlatList greifen
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  planTitle: { fontWeight: "bold", color: "#fff", marginBottom: 5 },
  planExercise: { color: "#ccc", marginLeft: 5 },

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
     maxHeight: "80%", // 🔹 Popup nimmt mehr Höhe
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff",
  },
  inputLabel: {
    color: "#fff",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    color: "#fff",
  },
  exerciseSelect: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 5,
    marginVertical: 3,
  },
  exerciseSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
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


  exerciseListContainer: {
  borderWidth: 1,
  borderColor: "#555",
  borderRadius: 8,
  padding: 5,
  marginVertical: 8,
  maxHeight: 240, // Höhe für ca. 6 Übungen
},
});
