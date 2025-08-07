import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
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

  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);

  const isFormValid = name.trim() &&  selectedExercises.length > 0;

  // 🔹 Trainingspläne und Übungen aus AsyncStorage laden
  useFocusEffect(
    useCallback(() => {
      const loadExercises = async () => {
        try {
          const storedExercises = await AsyncStorage.getItem("exercises");
          if (storedExercises) setAllExercises(JSON.parse(storedExercises));
        } catch (error) {
          console.error("Fehler beim Laden der Übungen:", error);
        }
      };
      loadExercises();
    }, [])
  );


  // Laden beim Start
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const storedPlans = await AsyncStorage.getItem("trainingPlans");
        if (storedPlans) {
          setPlans(JSON.parse(storedPlans));
        }
      } catch (error) {
        console.error("Fehler beim Laden der Pläne:", error);
      }
    };
    loadPlans();
  }, []);

  // Speichern bei jeder Änderung
  useEffect(() => {
    const savePlans = async () => {
      try {
        await AsyncStorage.setItem("trainingPlans", JSON.stringify(plans));
      } catch (error) {
        console.error("Fehler beim Speichern der Pläne:", error);
      }
    };
    savePlans();
  }, [plans]);


  const openViewPlan = (plan: TrainingPlan) => {
    setSelectedPlan(plan);
    setViewModalVisible(true);
  };

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
    setPlans(prev =>
      prev.map(p =>
        p.id === editingPlan.id
          ? { ...p, name, day, exercises: selectedExercises }
          : p
      )
    );
  } else {
    setPlans(prev => [
      ...prev,
      { id: Date.now().toString(), name, day, exercises: selectedExercises },
    ]);
  }

  setModalVisible(false);
  setEditingPlan(null);
  setName("");
  setDay("");
  setSelectedExercises([]);
};




  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.header}>Trainingspläne</Text>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ alignItems: "stretch", paddingVertical: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.planCard} 
            activeOpacity={0.9}
            onPress={() => openViewPlan(item)}
          >
            {/* Erste Zeile: Stift - Titel - Mülleimer */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* Stift */}
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); startEditPlan(item); }}
                style={{ padding: 8 }}
              >
                <MaterialCommunityIcons name="pencil" size={24} color="#4CAF50" />
              </TouchableOpacity>

              {/* Titel */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={styles.planTitle}>
                  {item.name}{item.day ? ` – ${item.day}` : ""}
                </Text>
              </View>

              {/* Mülleimer */}
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); confirmDelete(item); }}
                style={{ padding: 8 }}
              >
                <MaterialIcons name="delete" size={24} color="#E53935" />
              </TouchableOpacity>
            </View>

            {/* Übungen – jede mit eigener Mini-Karte */}
            <View style={styles.exerciseListWrapper}>
              {item.exercises.slice(0, 3).map((ex, idx) => (
                <View key={idx} style={styles.exerciseCardPlan}>
                  <Text style={[styles.exerciseText, { flex: 1, textAlign: "left" }]}>
                    {ex.name}
                  </Text>
                  <Text style={[styles.exerciseText, { flex: 1, textAlign: "center" }]}>
                    {ex.sets} x {ex.reps}
                  </Text>
                  <Text style={[styles.exerciseText, { flex: 1, textAlign: "right" }]}>
                    {ex.weight} kg
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
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
      <Modal visible={modalVisible} transparent animationType="fade" statusBarTranslucent={true}  onRequestClose={() => setModalVisible(false)}>
        
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
              autoFocus={true} // ⬅ Fokus beim Öffnen
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
            <ScrollView style={{ maxHeight: 350 }}>
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
      <Modal visible={deleteModalVisible} transparent animationType="fade"  onRequestClose={() => setModalVisible(false)}>
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

      {/* Popup zum Anzeigen eines Plans */}
      <Modal visible={viewModalVisible} transparent animationType="fade"  onRequestClose={() => setViewModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: "85%" }]}>
            {selectedPlan && (
              <>
                <Text style={styles.viewModalTitle}>
                  {selectedPlan.name}{selectedPlan.day ? ` – ${selectedPlan.day}` : ""}
                </Text>

                <FlatList
                  data={selectedPlan.exercises}
                  keyExtractor={(ex) => ex.id}
                  contentContainerStyle={{ alignItems: "center", paddingVertical: 5 }}
                  renderItem={({ item }) => (
                    <View style={styles.exerciseCard}>
                      <Text style={styles.exerciseName}>{item.name}</Text>
                      <Text style={styles.exerciseMiddle}>
                        {item.sets} x {item.reps}
                      </Text>
                      <Text style={styles.exerciseWeight}>
                        {item.weight} kg
                      </Text>
                    </View>
                  )}
                />

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#E53935", marginTop: 10, alignSelf: "flex-end" }]}
                  onPress={() => setViewModalVisible(false)}
                >
                  <Text style={styles.buttonText }>Schließen</Text>
                </TouchableOpacity>
              </>
            )}
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
    marginTop: 65,
    marginBottom: 25,
  },

  planCard: {
  width: "90%",
  alignSelf: "center",           
  backgroundColor: "#2E2E2E",
  borderRadius: 15,
  paddingVertical: 15,
  paddingHorizontal: 20,
  marginVertical: 8,
  elevation: 3,
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 5,
},

exerciseListContainer: {
  borderWidth: 1,
  borderColor: "#555",
  borderRadius: 8,
  padding: 5,
  marginVertical: 8,
  maxHeight: 240, // Höhe für ca. 6 Übungen
  },
planExercise: {
  color: "#ccc",
  textAlign: "left",
  marginVertical: 2,
},


  planTitle: { fontWeight: "bold", color: "#fff", marginBottom: 5 },
  

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
    maxHeight: "80%", 
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
    alignItems: "center",
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


  exerciseListWrapper: {
  marginTop: 8,
  width: "100%",
  alignItems: "center", // Übungen mittig innerhalb der Plan-Karte
},
exerciseCardPlan: {
   flexDirection: "row",
  borderWidth: 1,
  borderColor: "#555",
  borderRadius: 8,
  paddingVertical: 6,
  paddingHorizontal: 10,
  marginVertical: 4,
  width: "85%",           // Jede Karte etwas schmaler, damit es mittig wirkt
  backgroundColor: "#3A3A3A",
},
exerciseText: {
  color: "#ccc",
  textAlign: "left",
},

  viewModalContent: {
  width: "90%",
  maxHeight: "80%",
  backgroundColor: "#212124",
  borderRadius: 10,
  padding: 20,
},
viewModalTitle: {
  fontSize: 18,
  fontWeight: "bold",
  color: "#fff",
  marginBottom: 10,
  textAlign: "center",
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
exerciseWeight: { flex: 1, textAlign: "right", color: "#fff" },



});
