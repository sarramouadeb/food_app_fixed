import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Platform,
  ImageBackground,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Timestamp } from "firebase/firestore";
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get("window");

export default function ModifierReservation() {
  const { id, type } = useLocalSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [colors] = useState(["#7B9DD2", "#DAD4DE", "#BBB4DA", "#7B9DD2", "#70C7C6"]);
  const colorIndex = id ? id.length % colors.length : 0;

  // Fonctions de conversion et formatage
  const safeConvertToDate = (timestamp) => {
    try {
      if (!timestamp) {
        console.log("Timestamp est null ou undefined");
        return null;
      }

      // Si c'est un objet Timestamp Firebase
      if (timestamp.seconds && timestamp.nanoseconds) {
        return new Date(timestamp.seconds * 1000);
      }
      
      // Si c'est un objet avec méthode toDate()
      if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
      
      // Si c'est déjà un objet Date
      if (timestamp instanceof Date) {
        return timestamp;
      }
      
      // Si c'est une string de date
      if (typeof timestamp === 'string') {
        return new Date(timestamp);
      }
      
      console.log("Format de date non reconnu:", timestamp);
      return null;
    } catch (error) {
      console.error("Erreur de conversion de date:", error, "Valeur:", timestamp);
      return null;
    }
  };

  const formatDate = (date) => {
    try {
      if (!date) {
        console.warn("Date non fournie à formatDate");
        return "Date inconnue";
      }

      const dateObj = date instanceof Date ? date : new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        console.warn("Date invalide:", date);
        return "Date inconnue";
      }

      return dateObj.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      console.error("Erreur de formatage de date:", error);
      return "Date inconnue";
    }
  };

  const formatTime = (date) => {
    if (!date) return "Heure inconnue";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return "Heure inconnue";
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Heure inconnue";
    }
  };

  // Chargement des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        const collectionName = type === "acte" ? "aides" : "reservations";
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Données brutes:", data);
          
          // Récupération des données de l'association pour les actes
          if (type === "acte" && data.associationId) {
            const associationRef = doc(db, "associations", data.associationId);
            const associationSnap = await getDoc(associationRef);
            if (associationSnap.exists()) {
              Object.assign(data, associationSnap.data());
            }
          }

          setData(data);
          
          // Gestion de la date
          const dateField = type === "acte" ? "dateRecuperation" : "dateRecuperation";
          const rawDate = data[dateField];
          console.log("Date brute:", rawDate);
          
          const dateRecuperation = safeConvertToDate(rawDate);
          console.log("Date convertie:", dateRecuperation);
          
          if (dateRecuperation) {
            setDate(dateRecuperation);
          } else {
            console.warn("Aucune date valide trouvée, utilisation de la date actuelle");
            setDate(new Date());
          }
        } else {
          Alert.alert("Erreur", "Données non trouvées");
          router.back();
        }
      } catch (error) {
        console.error("Erreur lors du chargement:", error);
        Alert.alert("Erreur", "Impossible de charger les données");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, type]);

  // Gestion des pickers
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onChangeTime = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setDate(new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        selectedTime.getHours(),
        selectedTime.getMinutes()
      ));
    }
  };

  // Mise à jour des données
  const handleUpdate = async () => {
    try {
      const collectionName = type === "acte" ? "aides" : "reservations";
      await updateDoc(doc(db, collectionName, id), {
        dateRecuperation: Timestamp.fromDate(date),
      });
      Alert.alert("Succès", "Modification enregistrée");
      router.push('./Echanges');
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      Alert.alert("Erreur", "Échec de la mise à jour");
    }
  };

  const handleBack = () => {
    router.push('./Echanges');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B9DD2" />
      </View>
    );
  }

  if (!data) {
    return null;
  }

  const isActe = type === "acte";
  const title = isActe ? "Modifier Acte Bénévole" : "Modifier Réservation";
  const associationName = data.associationName || "Association inconnue";
  const ville = isActe ? (data.ville || data.associationVille) : data.restaurantVille;
  const dateCreation = isActe ? data.createdAt : data.annonceCreationTimestamp;
  const quantite = data.quantite || "Quantité inconnue";
  const offre = isActe ? data.besoinContent : data.offre;
  const cible = isActe ? (data.target || data.associationCible) : data.target;
  const status = isActe ? data.status : null;
  const phone = isActe ? (data.phone || data.associationPhone) : null;

  const initials = associationName && typeof associationName === "string"
    ? associationName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "NA";

  return (
    <ImageBackground 
      source={require('../../assets/images/cover.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Carte de données */}
        <View style={styles.card}>
          {/* En-tête avec avatar */}
          <View style={styles.cardHeader}>
            <View style={[styles.avatar, { backgroundColor: colors[colorIndex] }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.associationName}>{associationName}</Text>
              {isActe && phone && (
                <Text style={styles.subtitle}>Tél: {phone}</Text>
              )}
              <Text style={styles.subtitle}>
                {ville || "Ville inconnue"} • {date ? formatDate(date) : "Date inconnue"}
              </Text>
            </View>
          </View>

          {/* Détails */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{isActe ? "Besoin" : "Offre"}</Text>
              <Text style={styles.detailValue}>
                {quantite} {offre || (isActe ? "Besoin inconnu" : "Offre inconnue")}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Cible</Text>
              <Text style={styles.detailValue}>
                {cible || "Cible non spécifiée"}
              </Text>
            </View>

            {isActe && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Statut</Text>
                <Text style={[
                  styles.detailValue,
                  { 
                    color: status === "confirmé" ? "green" : 
                          status === "refusé" ? "red" : "orange"
                  }
                ]}>
                  {status || "Statut inconnu"}
                </Text>
              </View>
            )}

            {/* Sélecteur de date */}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date de récupération</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {date.toLocaleDateString("fr-FR")}
                </Text>
                <MaterialIcons name="calendar-today" size={20} color="#555" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    console.log("Nouvelle date sélectionnée:", selectedDate);
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Sélecteur d'heure */}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Heure de récupération</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateText}>
                  {date.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <MaterialIcons name="access-time" size={20} color="#555" />
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={date}
                  mode="time"
                  display="default"
                  onChange={onChangeTime}
                />
              )}
            </View>
          </View>

          {/* Boutons d'action */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleUpdate}
            >
              <Text style={styles.actionButtonText}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleBack}
            >
              <Text style={styles.actionButtonText}>Annuler</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 40,
    width: '100%',
    marginBottom: height * 0.02,
  },
  backButton: {
    padding: 5,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    textShadowRadius: 10,
  },
  headerRightPlaceholder: {
    width: 35,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardHeaderText: {
    flex: 1,
  },
  associationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  detailsContainer: {
    marginTop: 10,
  },
  detailItem: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#7B9DD2',
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    marginLeft: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});