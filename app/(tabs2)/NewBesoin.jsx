import React, { useContext, useState, useRef, useEffect } from "react";
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
import { useRoute, useNavigation } from "@react-navigation/native";
import { useUserContext } from "../../context/UserContext";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Icon from "react-native-vector-icons/Ionicons";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  addDoc,
  getDoc,
  updateDoc, 
  doc,
  serverTimestamp,
  increment   
} from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import SlideMenuA from "./SlideMenuA";
import cover from "../../assets/images/cover.png";

const { width, height } = Dimensions.get("window");

export default function NewBesoin() {
  const route = useRoute();
  const navigation = useNavigation();
  const { besoinToEdit } = route.params || {};

  // Header
  const { userDetail, setUserDetail } = useUserContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Générer les initiales basées sur le nom
  const initials = userDetail?.name
    ? userDetail.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "NA";

  // Couleur déterministe basée sur l'ID
  const colors = ["#7B9DD2", "#DAD4DE", "#BBB4DA", "#7B9DD2", "#70C7C6"];
  const colorIndex = userDetail?.id ? userDetail.id.length % colors.length : 0;

  // body
  const types = ["Financier", "Aliments frais", "Plats", "Snacks", "Boissons"];
  const etats = ["Très urgent", "Urgent", "Non urgent"];
  const [besoin, setBesoin] = useState(besoinToEdit ? besoinToEdit.besoin : "");
  const [quantite, setQuantite] = useState(
    besoinToEdit ? besoinToEdit.quantite : ""
  );
  const [selectedType, setSelectedType] = useState(
    besoinToEdit ? besoinToEdit.type : ""
  );
  const [selectedEtat, setSelectedEtat] = useState(
    besoinToEdit ? besoinToEdit.etat : ""
  );
  const [cible, setCible] = useState(besoinToEdit ? besoinToEdit.cible : "");

  // États modals séparés
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);
  const [isEtatModalVisible, setIsEtatModalVisible] = useState(false);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);

  // Errors
  const [errors, setErrors] = useState({
    besoin: "",
    quantite: "",
    Type: "",
    cible: "",
    Etat: "",
  });

  useEffect(() => {
    if (besoinToEdit) {
      setBesoin(besoinToEdit.besoin);
      setQuantite(besoinToEdit.quantite);
      setSelectedType(besoinToEdit.type);
      setSelectedEtat(besoinToEdit.etat);
      setCible(besoinToEdit.cible);
    } else {
      setBesoin("");
      setQuantite("");
      setSelectedType("");
      setSelectedEtat("");
      setCible("");
    }
  }, [besoinToEdit]);

  // Handlers pour ouvrir les modals
  const openTypeModal = () => setIsTypeModalVisible(true);
  const openEtatModal = () => setIsEtatModalVisible(true);

  // Handlers pour sélectionner
  const handleSelectType = (type) => {
    setSelectedType(type);
    setIsTypeModalVisible(false);
    setErrors({ ...errors, Type: "" });
  };

  const handleSelectEtat = (etat) => {
    setSelectedEtat(etat);
    setIsEtatModalVisible(false);
    setErrors({ ...errors, Etat: "" });
  };

  //validateForm
  const validateForm = () => {
    const newErrors = {};

    if (!besoin) newErrors.besoin = "Veuillez entrer le nom du besoin.";
    if (!quantite) newErrors.quantite = "Veuillez entrer la quantité du besoin.";
    if (!selectedType) newErrors.Type = "Veuillez sélectionner le type du besoin.";
    if (!selectedEtat) newErrors.Etat = "Veuillez sélectionner l'état du besoin.";
    if (!cible) newErrors.cible = "Veuillez entrer le cible.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveOrUpdateBesoin = async () => {
    try {
      setIsConfirmLoading(true);
  
      if (!userDetail?.uid) {
        console.error("User ID is missing");
        alert("User ID is missing. Please log in again.");
        setIsConfirmLoading(false);
        return;
      }
  
      const userRef = doc(db, "associations", userDetail.uid);
      const userDoc = await getDoc(userRef);
  
      if (!userDoc.exists()) {
        console.error("User document not found");
        alert("User document not found. Please log in again.");
        setIsConfirmLoading(false);
        return;
      }
  
      const besoinData = {
        besoin,
        quantite,
        type: selectedType,
        etat: selectedEtat,
        cible,
        userId: userDetail.uid,
        name: userDetail.name,
        phone: userDetail.phone,
        adresse: userDetail.ville,
        createdAt: serverTimestamp(),
        state: "en attente",
      };
  
      if (besoinToEdit) {
        await setDoc(doc(db, "besoins", besoinToEdit.id), besoinData);
      } else {
        await addDoc(collection(db, "besoins"), besoinData);
        
        // Incrémentation atomique du compteur
        try {
          await updateDoc(userRef, {
            totalBesoins: increment(1)
          });
        } catch (updateError) {
          console.error("Erreur lors de la mise à jour du compteur:", updateError);
          throw updateError;
        }
      }
  
      setIsConfirmLoading(false);
      navigation.navigate("BesoinsA");
    } catch (error) {
      console.error("Error saving/updating besoin:", error);
      alert(`Erreur: ${error.message}`);
      setIsConfirmLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={cover}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {isMenuOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}
      
      <Animated.View style={[styles.mainContent, {
        transform: [{
          translateX: slideAnim.interpolate({
            inputRange: [-width, 0],
            outputRange: [0, width * 0.7],
          }),
        }],
      }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleMenu}>
            <MaterialIcons name="menu" size={30} color="black" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Nouveau Besoin</Text>
          </View>

          <View style={[styles.avatar, { backgroundColor: colors[colorIndex] }]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.textContainer}>
            <Text style={styles.text}>Créer un nouveau besoin:</Text>
          </View>

          <View style={styles.form}>
            {/* Besoin */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Besoin *:</Text>
              <View style={[styles.inputContainer, errors.besoin && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Entrer nom du besoin*"
                  value={besoin}
                  onChangeText={(value) => {
                    setBesoin(value);
                    setErrors({ ...errors, besoin: "" });
                  }}
                />
              </View>
              {errors.besoin && <Text style={styles.errorText}>{errors.besoin}</Text>}
            </View>

            {/* Quantité */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantité *:</Text>
              <View style={[styles.inputContainer, errors.quantite && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Entrer la quantité du besoin*"
                  keyboardType="numeric"
                  value={quantite}
                  onChangeText={(value) => {
                    setQuantite(value);
                    setErrors({ ...errors, quantite: "" });
                  }}
                />
              </View>
              {errors.quantite && <Text style={styles.errorText}>{errors.quantite}</Text>}
            </View>

            {/* Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type *:</Text>
              <View style={[styles.inputContainer, errors.Type && styles.inputError]}>
                <TouchableOpacity
                  onPress={openTypeModal}
                  style={styles.typeSelector}
                >
                  <Text style={styles.typeText}>
                    {selectedType || "Sélectionnez le type du besoin"}
                  </Text>
                  <Icon name="chevron-down" size={20} color="gray" />
                </TouchableOpacity>
              </View>
              {errors.Type && <Text style={styles.errorText}>{errors.Type}</Text>}
              
              {/* Modal pour les types */}
              <Modal
                transparent={true}
                visible={isTypeModalVisible}
                animationType="fade"
                onRequestClose={() => setIsTypeModalVisible(false)}
              >
                <TouchableOpacity
                  style={styles.modalBackground}
                  activeOpacity={1}
                  onPress={() => setIsTypeModalVisible(false)}
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
            </View>

            {/* Cible */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cible *:</Text>
              <View style={[styles.inputContainer, errors.cible && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Entrer nom du cible*"
                  value={cible}
                  onChangeText={(value) => {
                    setCible(value);
                    setErrors({ ...errors, cible: "" });
                  }}
                />
              </View>
              {errors.cible && <Text style={styles.errorText}>{errors.cible}</Text>}
            </View>

            {/* Etat */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Etat *:</Text>
              <View style={[styles.inputContainer, errors.Etat && styles.inputError]}>
                <TouchableOpacity
                  onPress={openEtatModal}
                  style={styles.typeSelector}
                >
                  <Text style={styles.typeText}>
                    {selectedEtat || "Sélectionnez l'état du besoin"}
                  </Text>
                  <Icon name="chevron-down" size={20} color="gray" />
                </TouchableOpacity>
              </View>
              {errors.Etat && <Text style={styles.errorText}>{errors.Etat}</Text>}
              
              {/* Modal pour les états */}
              <Modal
                transparent={true}
                visible={isEtatModalVisible}
                animationType="fade"
                onRequestClose={() => setIsEtatModalVisible(false)}
              >
                <TouchableOpacity
                  style={styles.modalBackground}
                  activeOpacity={1}
                  onPress={() => setIsEtatModalVisible(false)}
                >
                  <View style={styles.modalContainer}>
                    <FlatList
                      data={etats}
                      keyExtractor={(item, index) => index.toString()}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.modalItem}
                          onPress={() => handleSelectEtat(item)}
                        >
                          <Text style={styles.modalText}>{item}</Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>

            {/* Boutons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={() => {
                  if (validateForm()) {
                    saveOrUpdateBesoin();
                  }
                }}
                disabled={isConfirmLoading}
              >
                {isConfirmLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Confirmer</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsCancelLoading(true);
                  navigation.navigate("BesoinsA");
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
      
      <SlideMenuA
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
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 99,
  },
  mainContent: {
    flex: 1,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingTop: 40, // Augmenté pour descendre le header
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 30, // Augmenté pour descendre le header
    width: "100%",
    marginBottom: height * 0.02,
  },
  titleContainer: {
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    textShadowRadius: 10
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
    color: 'black',
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
    color: 'black',
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DED8E1",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: 'black',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: 'black',
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
    color: 'black',
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
    borderColor: 'black',
  },
  cancelButton: {
    backgroundColor: "#EAE5E5",
  },
  confirmButton: {
    backgroundColor: "#EAE5E5",
  },
  buttonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
});