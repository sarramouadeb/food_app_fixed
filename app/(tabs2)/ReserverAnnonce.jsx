import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  ImageBackground,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useUserContext } from "../../context/UserContext";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db } from "../../config/FirebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import SlideMenuA from "./SlideMenuA";

const { width, height } = Dimensions.get("window");

export default function ReserverAnnonce() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userDetail } = useUserContext();
  const { annonce, isModification } = route.params;

  // Parse et valide les données de l'annonce
  const parsedAnnonce = React.useMemo(() => {
    try {
      const data = typeof annonce === 'string' ? JSON.parse(annonce) : annonce;
      return {
        ...data,
        userId: data.userId || data.restaurantId || '',
        restaurantName: data.restaurantName || '',
        restaurantPhone: data.restaurantPhone || '',
        restaurantVille: data.restaurantVille || '',
        offre: data.offre || '',
        type: data.type || '',
        quantite: data.quantite || '',
        id: data.id || '',
        createdAt: data.createdAt || serverTimestamp(),
        expirationDate: data.expirationDate || new Date()
      };
    } catch (error) {
      console.error("Erreur de parsing de l'annonce:", error);
      return {
        userId: '',
        restaurantName: '',
        restaurantPhone: '',
        restaurantVille: '',
        offre: '',
        type: '',
        quantite: '',
        id: '',
        createdAt: serverTimestamp(),
        expirationDate: new Date()
      };
    }
  }, [annonce]);

  // États pour la gestion des dates et du chargement
  const [date, setDate] = useState(() => {
    if (isModification && parsedAnnonce.dateRecuperation) {
      return parsedAnnonce.dateRecuperation.seconds 
        ? new Date(parsedAnnonce.dateRecuperation.seconds * 1000)
        : new Date(parsedAnnonce.dateRecuperation);
    }
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const formattedDate = date.toLocaleDateString("fr-FR");
  const formattedTime = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleConfirmReservation = async () => {
    if (!parsedAnnonce.userId) {
      alert("Erreur: Identifiant du restaurant manquant");
      return;
    }

    if (!userDetail?.uid) {
      alert("Erreur: Identifiant de l'association manquant");
      return;
    }

    try {
      setIsConfirmLoading(true);
      
      const reservationData = {
        offre: parsedAnnonce.offre,
        type: parsedAnnonce.type,
        quantite: parsedAnnonce.quantite,
        restaurantId: parsedAnnonce.userId,
        restaurantName: parsedAnnonce.restaurantName,
        restaurantPhone: parsedAnnonce.restaurantPhone,
        restaurantVille: parsedAnnonce.restaurantVille,
        associationId: userDetail.uid,
        associationName: userDetail.name || '',
        dateRecuperation: date,
        createdAt: serverTimestamp(),
        status: "en attente",
        annonceCreationTimestamp: parsedAnnonce.createdAt,
        expirationDate: parsedAnnonce.expirationDate,
        originalAnnonceId: parsedAnnonce.id 
      };

      const reservationId = isModification 
        ? parsedAnnonce.id 
        : `${parsedAnnonce.id}_${userDetail.uid}`;
      
      await setDoc(doc(db, "reservations", reservationId), reservationData);
      
      // Redirection vers EchangesA avec mise en évidence
      navigation.navigate("EchangesA", { 
        highlightReservation: reservationId,
        tab: "reservations",
        refresh: Date.now() // Force le rafraîchissement
      });
    } catch (error) {
      console.error("Erreur lors de la réservation:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsConfirmLoading(false);
    }
  };

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

  return (
    <ImageBackground 
      source={require('../../assets/images/cover.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {isMenuOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}
      
      <Animated.View style={[styles.mainContent]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleMenu}>
            <MaterialIcons name="menu" size={30} color="black" style={styles.menuIcon} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>{isModification ? "Modifier" : "Réservation"}</Text>
          </View>

          <View style={[styles.avatar, { backgroundColor: colors[colorIndex] }]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.text}>
              {isModification ? "Modifier réservation" : "Réservation d'annonce"}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.besoin}>
              <Text style={styles.label}>Offre:</Text>
              <View style={styles.inputContainerBesoin}>
                <Text style={styles.input}>
                  {parsedAnnonce.offre || "Non spécifié"}
                </Text>
              </View>
            </View>

            <View style={styles.besoin}>
              <Text style={styles.label}>Type:</Text>
              <View style={styles.inputContainerBesoin}>
                <Text style={styles.input}>
                  {parsedAnnonce.type || "Non spécifié"}
                </Text>
              </View>
            </View>

            <View style={styles.besoin}>
              <Text style={styles.label}>Quantité:</Text>
              <View style={styles.inputContainerBesoin}>
                <Text style={styles.input}>
                  {parsedAnnonce.quantite || "Non spécifié"}
                </Text>
              </View>
            </View>

            <View style={styles.besoin}>
              <Text style={styles.label}>Date de récupération *:</Text>
              <TouchableOpacity 
                style={styles.inputContainerBesoin}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.input}>{formattedDate}</Text>
                <Icon name="calendar-number-outline" size={25} color="gray" style={styles.dropdownIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.besoin}>
              <Text style={styles.label}>Heure de récupération *:</Text>
              <TouchableOpacity 
                style={styles.inputContainerBesoin}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.input}>{formattedTime}</Text>
                <Icon name="time-outline" size={25} color="gray" style={styles.dropdownIcon} />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}
            
            {showTimePicker && (
              <DateTimePicker
                value={date}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) setDate(selectedTime);
                }}
              />
            )}

            <View style={styles.btnContainer}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmReservation}
                disabled={isConfirmLoading}
              >
                {isConfirmLoading ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {isModification ? "Mettre à jour" : "Confirmer"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.annulerButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.annulerButtonText}>Annuler</Text>
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
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 99,
  },
  mainContent: {
    flex: 1,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 10,
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 30,
    borderColor: "#FFFFFF",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "black",
  },
  titleContainer: {
    backgroundColor: "#F4E6FD",
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  menuIcon: {
    marginRight: 10,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  textContainer: {
    backgroundColor: "#EAE5E5",
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: "center",
    borderRadius: 20,
    marginVertical: 20,
    borderWidth: 1,
  },
  text: {
    fontSize: 22,
    fontWeight: "bold",
    color: 'black',
  },
  form: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "90%",
    alignSelf: "center",
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'black',
  },
  besoin: {
    marginBottom: 15,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: 'black',
  },
  inputContainerBesoin: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAE5E5",
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
  dropdownIcon: {
    marginLeft: 10,
  },
  btnContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  confirmButton: {
    backgroundColor: "#CBEFB6",
    padding: 15,
    borderRadius: 30,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'black',
  },
  annulerButton: {
    backgroundColor: "#FF7373",
    padding: 15,
    borderRadius: 30,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'black',
  },
  confirmButtonText: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
  },
  annulerButtonText: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
  },
});