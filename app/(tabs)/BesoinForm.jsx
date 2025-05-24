import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import cover from "../../assets/images/cover.png";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useUserContext } from "../../context/UserContext";

export default function BesoinForm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userDetail } = useUserContext();
  const [activeTab, setActiveTab] = useState(params?.initialTab || "reservations");

  const besoin = params.besoin ? JSON.parse(params.besoin) : {};
  const association = params.association ? JSON.parse(params.association) : {};

  console.log("Paramètres reçus:", { besoin, association }); // Log 1

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [restaurantData, setRestaurantData] = useState(null);
  const [associationData, setAssociationData] = useState({});

  useEffect(() => {
    console.log("Chargement initial - vérification des onglets"); // Log 2
    if (params?.initialTab) {
      router.setParams({ initialTab: undefined });
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (userDetail?.uid) {
        console.log("Début du chargement des données pour l'UID:", userDetail.uid); // Log 3
        
        try {
          // Récupérer les données du restaurant
          console.log("Récupération des données du restaurant..."); // Log 4
          const restaurantRef = doc(db, "restaurants", userDetail.uid);
          const restaurantSnap = await getDoc(restaurantRef);
          
          if (restaurantSnap.exists()) {
            console.log("Données restaurant trouvées:", restaurantSnap.data()); // Log 5
            setRestaurantData({
              ...restaurantSnap.data(),
              uid: userDetail.uid
            });
          } else {
            console.warn("Aucune donnée restaurant trouvée"); // Log 6
          }

          // Récupérer les données complètes de l'association
          if (besoin.userId) {
            console.log("Récupération des données de l'association..."); // Log 7
            const associationRef = doc(db, "associations", besoin.userId);
            const associationSnap = await getDoc(associationRef);
            
            if (associationSnap.exists()) {
              console.log("Données association trouvées:", associationSnap.data()); // Log 8
              setAssociationData({
                ...associationSnap.data(),
                uid: besoin.userId
              });
            } else {
              console.warn("Aucune donnée association trouvée"); // Log 9
            }
          }
        } catch (error) {
          console.error("Erreur lors du chargement des données:", error); // Log 10
        }
      }
    };

    fetchData();
  }, [userDetail?.uid, besoin.userId]);

  const handleSubmit = async () => {
    console.log("Début de la soumission du formulaire"); // Log 11
    
    try {
      if (!restaurantData?.uid) {
        console.error("UID restaurant non trouvé"); // Log 12
        Alert.alert(
          "Erreur d'identification",
          "Impossible d'identifier votre restaurant. Veuillez vous reconnecter.",
          [{ text: "OK", onPress: () => router.replace("/auth/login") }]
        );
        return;
      }

      const docId = `aide_${restaurantData.uid}_${besoin.id}_${Date.now()}`;
      
      // Préparation des données complètes
      const aideData = {
        besoinId: besoin.id,
        restaurantId: restaurantData.uid,
        restaurantName: restaurantData.name || "Restaurant sans nom",
        restaurantVille: restaurantData.ville || "Ville inconnue",
        restaurantPhone: restaurantData.phone || "Non renseigné",
        restaurantEmail: restaurantData.email || "Non renseigné",
        dateRecuperation: date,
        aidetype: besoin.type,
        besoinContent: besoin.besoin,
        quantite: besoin.quantite || 1,
        status: "en attente",
        createdAt: new Date(),
        associationId: besoin.userId,
        associationName: association.name || "Association inconnue",
        associationVille: associationData.ville || "Ville inconnue",
        associationCible: associationData.target || "Cible non spécifiée",
        associationPhone: association.phone || "Non renseigné",
        associationEmail: associationData.email || "Non renseigné",
        besoinEtat: besoin.etat || "Non spécifié",
      };

      console.log("Données prêtes à être enregistrées:", aideData); // Log 13

      // 1. Enregistrer l'aide dans la collection 'aides'
      console.log("Enregistrement dans la collection 'aides'..."); // Log 14
      await setDoc(doc(db, "aides", docId), aideData);
      
      // 2. Mettre à jour le besoin pour indiquer que ce restaurant y a répondu
      console.log("Mise à jour du besoin dans la collection 'besoins'..."); // Log 15
      const besoinRef = doc(db, "besoins", besoin.id);
      await updateDoc(besoinRef, {
        respondedRestaurants: arrayUnion(restaurantData.uid)
      });

      console.log("Enregistrement réussi!"); // Log 16
      Alert.alert(
        "Succès", 
        "Votre aide a bien été enregistrée avec toutes les informations !",
        [{ text: "OK", onPress: () => router.replace({
            pathname: "/Echanges",
            params: { forceTab: "actes" }
          }) }]
      );
      
    } catch (error) {
      console.error("Erreur complète lors de l'enregistrement:", error); // Log 17
      Alert.alert(
        "Erreur technique",
        `L'enregistrement a échoué: ${error.message}`,
        [{ text: "OK" }]
      );
    }
  };

  if (!besoin.id) {
    console.error("ID du besoin manquant dans les paramètres"); // Log 18
    return (
      <ImageBackground source={cover} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erreur: Données du besoin non disponibles</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    );
  }

  console.log("Rendu du formulaire avec les données:", { 
    restaurantData, 
    associationData,
    date 
  }); // Log 19

  return (
    <ImageBackground source={cover} style={styles.backgroundImage} resizeMode="cover">
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Formulaire d'aide</Text>
          
          {/* Détails du besoin */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détails du besoin</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{besoin.type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Besoin:</Text>
              <Text style={styles.detailValue}>{besoin.quantite} {besoin.besoin}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cible:</Text>
              <Text style={styles.detailValue}>{associationData.target || "Cible non spécifiée"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>État:</Text>
              <Text style={styles.detailValue}>{besoin.etat}</Text>
            </View>
          </View>

          {/* Détails de l'association */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Association</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nom:</Text>
              <Text style={styles.detailValue}>{association.name || "Inconnu"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Adresse:</Text>
              <Text style={styles.detailValue}>{associationData.ville || "Ville inconnue"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Téléphone:</Text>
              <Text style={styles.detailValue}>{association.phone || "Inconnu"}</Text>
            </View>
          </View>

          {/* Formulaire */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Votre proposition</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date de récupération:</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.dateButtonContent}>
                  <Text style={styles.dateButtonText}>{date.toLocaleDateString('fr-FR')}</Text>
                  <MaterialIcons name="event" size={24} color="#555" style={styles.icon} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Heure de récupération:</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
              >
                <View style={styles.dateButtonContent}>
                  <Text style={styles.dateButtonText}>
                      {date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                  <MaterialIcons name="access-time" size={24} color="#555" style={styles.icon1} />
                </View>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    console.log("Nouvelle date sélectionnée:", selectedDate); // Log 20
                    setDate(selectedDate);
                  }
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
                  if (selectedTime) {
                    console.log("Nouvelle heure sélectionnée:", selectedTime); // Log 21
                    setDate(selectedTime);
                  }
                }}
              />
            )}
          </View>

          {/* Boutons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
    color: 'black',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: 'black',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    fontWeight: 'bold',
    width: 100,
    fontSize: 16,
    color: 'black',
  },
  detailValue: {
    flex: 1,
    fontSize: 16,
    color: 'black',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: 'black',
    fontWeight: '600',
  },
  dateButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginLeft: 150,
  },
  icon1: {
    marginLeft: 200,
  },
  dateButtonText: {
    fontSize: 16,
    color: 'black',
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
    justifyContent: 'center',
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: "#E5E5EA",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    width: '60%',
    alignItems: 'center',
  },
});