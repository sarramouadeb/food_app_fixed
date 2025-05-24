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
  TouchableWithoutFeedback,
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
  const { annonce, isModification, isActeBenevole } = route.params || {};

  // Vérification initiale des paramètres
  if (!annonce) {
    return (
      <ImageBackground 
        source={require('../../assets/images/cover.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Aucune donnée à afficher</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    );
  }

  // Parse et valide les données
  const parsedData = React.useMemo(() => {
    try {
      const data = typeof annonce === 'string' ? JSON.parse(annonce) : annonce;
      
      if (isActeBenevole) {
        return {
          id: data.id || '',
          besoinContent: data.besoinContent || '',
          aidetype: data.aidetype || '',
          quantite: data.quantite || '',
          besoinEtat: data.besoinEtat || '',
          restaurantName: data.restaurantName || '',
          restaurantPhone: data.restaurantPhone || '',
          restaurantVille: data.restaurantVille || '',
          associationCible: data.associationCible || '',
          associationId: data.associationId || userDetail?.uid || '',
          dateRecuperation: data.dateRecuperation || new Date(),
          createdAt: data.createdAt || serverTimestamp(),
          status: data.status || "en attente"
        };
      } else {
        return {
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
      }
    } catch (error) {
      console.error("Erreur de parsing des données:", error);
      return isActeBenevole ? {
        id: '',
        besoinContent: '',
        aidetype: '',
        quantite: '',
        besoinEtat: '',
        restaurantName: '',
        restaurantPhone: '',
        restaurantVille: '',
        associationCible: '',
        associationId: userDetail?.uid || '',
        dateRecuperation: new Date(),
        createdAt: serverTimestamp(),
        status: "en attente"
      } : {
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
  }, [annonce, isActeBenevole, userDetail]);

  // États pour la gestion des dates
  const [date, setDate] = useState(() => {
    if (isModification && parsedData.dateRecuperation) {
      return parsedData.dateRecuperation.seconds 
        ? new Date(parsedData.dateRecuperation.seconds * 1000)
        : new Date(parsedData.dateRecuperation);
    }
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const formattedDate = date.toLocaleDateString("fr-FR");
  const formattedTime = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleConfirm = async () => {
    try {
      setIsConfirmLoading(true);
      
      if (isActeBenevole) {
        // Mise à jour de l'acte bénévole
        const acteData = {
          besoinContent: parsedData.besoinContent,
          aidetype: parsedData.aidetype,
          quantite: parsedData.quantite,
          besoinEtat: parsedData.besoinEtat,
          restaurantName: parsedData.restaurantName,
          restaurantPhone: parsedData.restaurantPhone,
          restaurantVille: parsedData.restaurantVille,
          associationCible: parsedData.associationCible,
          associationId: parsedData.associationId,
          dateRecuperation: date, // Utilise la nouvelle date
          status: parsedData.status || "en attente",
          updatedAt: serverTimestamp()
        };

        // Utilise merge: true pour ne pas écraser les autres champs
        await setDoc(doc(db, "aides", parsedData.id), acteData, { merge: true });
        
        // Redirige vers l'onglet actes avec rafraîchissement
        navigation.navigate("EchangesA", { 
          tab: "actes",
          refresh: Date.now()
        });
      } else {
        // Gestion des réservations
        const reservationData = {
          offre: parsedData.offre,
          type: parsedData.type,
          quantite: parsedData.quantite,
          restaurantId: parsedData.userId,
          restaurantName: parsedData.restaurantName,
          restaurantPhone: parsedData.restaurantPhone,
          restaurantVille: parsedData.restaurantVille,
          associationId: userDetail.uid,
          associationName: userDetail.name || '',
          dateRecuperation: date,
          createdAt: serverTimestamp(),
          status: "en attente",
          annonceCreationTimestamp: parsedData.createdAt,
          expirationDate: parsedData.expirationDate,
          originalAnnonceId: parsedData.id 
        };

        const reservationId = isModification 
          ? parsedData.id 
          : `${parsedData.id}_${userDetail.uid}`;
        
        await setDoc(doc(db, "reservations", reservationId), reservationData);
        
        navigation.navigate("EchangesA", { 
          highlightReservation: reservationId,
          tab: "reservations",
          refresh: Date.now()
        });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
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
      
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleMenu}>
            <MaterialIcons name="menu" size={30} color="black" style={styles.menuIcon} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {isActeBenevole ? "Modifier acte" : (isModification ? "Modifier" : "Réservation")}
            </Text>
          </View>

          <View style={[styles.avatar, { backgroundColor: colors[colorIndex] }]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWrapper}>
            <View style={styles.textContainer}>
              <Text style={styles.text}>
                {isActeBenevole ? "Modifier acte bénévole" : 
                 (isModification ? "Modifier réservation" : "Réservation d'annonce")}
              </Text>
            </View>

            <View style={styles.form}>
              {isActeBenevole ? (
                <>
                  <View style={styles.besoin}>
                    <Text style={styles.label}>Besoin:</Text>
                    <View style={styles.inputContainerBesoin}>
                      <Text style={styles.input}>
                        {parsedData.besoinContent || "Non spécifié"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.besoin}>
                    <Text style={styles.label}>Type d'aide:</Text>
                    <View style={styles.inputContainerBesoin}>
                      <Text style={styles.input}>
                        {parsedData.aidetype || "Non spécifié"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.besoin}>
                    <Text style={styles.label}>Quantité:</Text>
                    <View style={styles.inputContainerBesoin}>
                      <Text style={styles.input}>
                        {parsedData.quantite || "Non spécifié"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.besoin}>
                    <Text style={styles.label}>État:</Text>
                    <View style={styles.inputContainerBesoin}>
                      <Text style={styles.input}>
                        {parsedData.besoinEtat || "Non spécifié"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.besoin}>
                    <Text style={styles.label}>Restaurant:</Text>
                    <View style={styles.inputContainerBesoin}>
                      <Text style={styles.input}>
                        {parsedData.restaurantName || "Non spécifié"}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.besoin}>
                    <Text style={styles.label}>Offre:</Text>
                    <View style={styles.inputContainerBesoin}>
                      <Text style={styles.input}>
                        {parsedData.offre || "Non spécifié"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.besoin}>
                    <Text style={styles.label}>Type:</Text>
                    <View style={styles.inputContainerBesoin}>
                      <Text style={styles.input}>
                        {parsedData.type || "Non spécifié"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.besoin}>
                    <Text style={styles.label}>Quantité:</Text>
                    <View style={styles.inputContainerBesoin}>
                      <Text style={styles.input}>
                        {parsedData.quantite || "Non spécifié"}
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {/* Section modifiable pour la date et l'heure */}
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
                  style={[styles.actionButton, styles.updateButton]}
                  onPress={handleConfirm}
                  disabled={isConfirmLoading}
                >
                  {isConfirmLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.actionButtonText}>
                      {isModification || isActeBenevole ? "Mettre à jour" : "Confirmer"}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.actionButtonText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
      
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 20,
  },
  errorButton: {
    padding: 15,
    backgroundColor: '#EAE5E5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'black',
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 40,
    marginBottom: 10,
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
  titleContainer: {},
  menuIcon: {
    marginRight: 10,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 90,
  },
  contentWrapper: {
    flex: 1,
  },
  textContainer: {
    backgroundColor: "#EAE5E5",
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: "center",
    borderRadius: 20,
    marginVertical: 15,
    borderWidth: 1,
  },
  text: {
    fontSize: 22,
    fontWeight: "bold",
    color: 'black',
  },
  form: {
    backgroundColor: "rgba(255,255,255,0.7)",
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
  actionButton: {
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  updateButton: {
    backgroundColor: "#EAE5E5",
  },
  cancelButton: {
    backgroundColor: "#FFCACA",
  },
  actionButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
});