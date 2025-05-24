import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Dimensions,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useUserContext } from "../../context/UserContext";

import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import {
  collection,
  setDoc,
  addDoc,
  getDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import SlideMenu from "./SlideMenu";

const { width, height } = Dimensions.get("window");

export default function NewAnnonce() {
  const route = useRoute();
  const { annonceToEdit } = route.params || {};
  const { userDetail } = useUserContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  // Initiales et couleurs
  const initials = userDetail?.name
    ? userDetail.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "NA";

  const colors = ["#7B9DD2", "#DAD4DE", "#BBB4DA", "#7B9DD2", "#70C7C6"];
  const colorIndex = userDetail?.id ? userDetail.id.length % colors.length : 0;
  const handleProfilePress = () => {
    router.push("ProfileResto");
  };

  // Données du formulaire
  const types = ["Argent", "Aliments frais", "Plats", "Snacks", "Boissons"];
  const [offre, setOffre] = useState(annonceToEdit?.offre || "");
  const [quantite, setQuantite] = useState(annonceToEdit?.quantite || "");
  const [selectedType, setSelectedType] = useState(annonceToEdit?.type || "");
  const [expirationDate, setExpirationDate] = useState(
    annonceToEdit?.expirationDate ? new Date(annonceToEdit.expirationDate) : null
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [errors, setErrors] = useState({
    offre: "",
    quantite: "",
    type: "",
    expirationDate: "",
  });

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleSelectType = (type) => {
    setSelectedType(type);
    setIsModalVisible(false);
    setErrors({ ...errors, type: "" });
  };

  const handleDateSelection = () => setDatePickerVisible(true);

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!offre.trim()) {
      newErrors.offre = "Veuillez entrer le nom du don.";
      isValid = false;
    }
    if (!quantite.trim()) {
      newErrors.quantite = "Veuillez entrer la quantité du don.";
      isValid = false;
    }
    if (!selectedType) {
      newErrors.type = "Veuillez sélectionner le type du don.";
      isValid = false;
    }
    if (!expirationDate) {
      newErrors.expirationDate = "Veuillez sélectionner une date d'expiration.";
      isValid = false;
    } else if (new Date(expirationDate) <= new Date().setHours(0, 0, 0, 0)) {
      newErrors.expirationDate = "La date doit être dans le futur.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const saveOrUpdateAnnonce = async () => {
    if (!validateForm()) return;

    try {
      setIsConfirmLoading(true);

      const userRef = doc(db, "restaurants", userDetail.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        alert("User profile not found. Please log in again.");
        setIsConfirmLoading(false);
        return;
      }

      const userData = userDoc.data();
      
      const annonceData = {
        offre: offre.trim(),
        quantite: quantite.trim(),
        type: selectedType,
        expirationDate: expirationDate.toISOString(),
        userId: userDetail.uid,
        name: userDetail.name || "",
        phone: userDetail.phone || "",
        adresse: userDetail.ville || "",
        createdAt: serverTimestamp(),
        state: "Available",
        image: userData.image || null,
      };

      if (annonceToEdit) {
        await setDoc(doc(db, "annonces", annonceToEdit.id), annonceData);
      } else {
        await addDoc(collection(db, "annonces"), annonceData);
        await setDoc(
          userRef,
          { nbAnnonces: (userData.nbAnnonces || 0) + 1 },
          { merge: true }
        );
      }

      setOffre("");
      setQuantite("");
      setSelectedType("");
      setExpirationDate(null);
      
      router.replace("/(tabs)/Annonces");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsConfirmLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/cover.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {isMenuOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      <Animated.View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleMenu}>
            <MaterialIcons name="menu" size={30} color="black" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Nouvelle Annonce</Text>
          </View>

          <TouchableOpacity onPress={handleProfilePress}>
            <View
              style={[styles.avatar, { backgroundColor: colors[colorIndex] }]}
            >
              <Text style={styles.initials}>{initials}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.textContainer}>
            <Text style={styles.text}>
              {annonceToEdit ? "Modifier l'annonce" : "Créer une nouvelle annonce"}
            </Text>
          </View>

          <View style={styles.form}>
            {/* Offre */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Offre *:</Text>
              <View
                style={[styles.inputContainer, errors.offre && styles.inputError]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Entrer nom du don*"
                  value={offre}
                  onChangeText={(value) => {
                    setOffre(value);
                    setErrors({ ...errors, offre: "" });
                  }}
                />
              </View>
              {errors.offre && (
                <Text style={styles.errorText}>{errors.offre}</Text>
              )}
            </View>

            {/* Quantité */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantité *:</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.quantite && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Entrer la quantité*"
                  keyboardType="numeric"
                  value={quantite}
                  onChangeText={(value) => {
                    setQuantite(value);
                    setErrors({ ...errors, quantite: "" });
                  }}
                />
              </View>
              {errors.quantite && (
                <Text style={styles.errorText}>{errors.quantite}</Text>
              )}
            </View>

            {/* Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type *:</Text>
              <View
                style={[styles.inputContainer, errors.type && styles.inputError]}
              >
                <TouchableOpacity
                  onPress={() => setIsModalVisible(true)}
                  style={styles.typeSelector}
                >
                  <Text style={styles.typeText}>
                    {selectedType || "Sélectionnez le type"}
                  </Text>
                  <Icon name="chevron-down" size={20} color="gray" />
                </TouchableOpacity>
              </View>
              {errors.type && (
                <Text style={styles.errorText}>{errors.type}</Text>
              )}
            </View>

            {/* Date d'expiration */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date d'expiration *:</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.expirationDate && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Sélectionner la date"
                  value={expirationDate?.toLocaleDateString("fr-FR") || ""}
                  editable={false}
                  onTouchStart={handleDateSelection}
                />
                <TouchableOpacity
                  onPress={handleDateSelection}
                  style={styles.calendarIcon}
                >
                  <Icon name="calendar" size={20} color="gray" />
                </TouchableOpacity>
              </View>
              {errors.expirationDate && (
                <Text style={styles.errorText}>{errors.expirationDate}</Text>
              )}
            </View>

            {/* DatePicker */}
            {isDatePickerVisible && (
              <DateTimePicker
                value={expirationDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setDatePickerVisible(false);
                  if (date) {
                    setExpirationDate(date);
                    setErrors({ ...errors, expirationDate: "" });
                  }
                }}
              />
            )}

            {/* Modal Type */}
            <Modal
              transparent={true}
              visible={isModalVisible}
              animationType="fade"
              onRequestClose={() => setIsModalVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalBackground}
                activeOpacity={1}
                onPress={() => setIsModalVisible(false)}
              >
                <View style={styles.modalContainer}>
                  <FlatList
                    data={types}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => handleSelectType(item)}
                      >
                        <Text style={styles.modalText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableOpacity>
            </Modal>

            {/* Boutons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={saveOrUpdateAnnonce}
                disabled={isConfirmLoading}
              >
                {isConfirmLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>
                    {annonceToEdit ? "Mettre à jour" : "Confirmer"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsCancelLoading(true);
                  router.replace("/(tabs)/Annonces");
                }}
                disabled={isCancelLoading}
              >
                {isCancelLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Annuler</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      <SlideMenu
        isOpen={isMenuOpen}
        toggleMenu={toggleMenu}
        userDetail={userDetail}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 99,
  },
  mainContent: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 20, // Augmenté pour descendre le header
    width: "100%",
    marginBottom: height * 0.02,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    textShadowRadius: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  textContainer: {
    backgroundColor: "#DED8E1",
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: "center",
    borderRadius: 20,
    marginVertical: 20,
    borderWidth: 1,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "black",
  },
  form: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "90%",
    alignSelf: "center",
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "bold",
    color: "black",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DED8E1",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "black",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "black",
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
  },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  typeText: {
    fontSize: 16,
    color: "black",
  },
  calendarIcon: {
    padding: 5,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    maxHeight: "60%",
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalText: {
    fontSize: 16,
    color: "black",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 10,
  },
  cancelButton: {
    backgroundColor: "#EAE5E5",
  },
  confirmButton: {
    backgroundColor: "#70C7C6",
  },
  buttonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
});