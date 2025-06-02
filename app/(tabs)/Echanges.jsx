import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useUserContext } from "../../context/UserContext";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { router, useLocalSearchParams } from "expo-router";
import SlideMenu from "./SlideMenu";
import { collection, query, where, getDocs, documentId, getDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { deleteDoc } from "firebase/firestore";
import { Alert } from "react-native";
import { ImageBackground } from "expo-image";

const { width, height } = Dimensions.get("window");

export default function Echanges() {
  const { userDetail } = useUserContext();
  const params = useLocalSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState(params?.initialTab || "reservations");
  const [refreshing, setRefreshing] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [actesBenevoles, setActesBenevoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingActes, setLoadingActes] = useState(true);
  const [associationsData, setAssociationsData] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params?.initialTab === "actes") {
      setActiveTab("actes");
      router.setParams({ initialTab: undefined });
    }
  }, [params?.initialTab]);

  const safeConvertToDate = (timestamp) => {
    try {
      if (!timestamp) return null;
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        return timestamp.toDate();
      }
      if (timestamp instanceof Date) {
        return timestamp;
      }
      return null;
    } catch (error) {
      console.error("Error converting timestamp:", error);
      return null;
    }
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      if (!userDetail?.uid) {
        console.log("No valid user UID");
        setReservations([]);
        return;
      }

      const q = query(collection(db, "reservations"), where("restaurantId", "==", userDetail.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("No reservations found");
        setReservations([]);
        return;
      }

      const associationIds = [];
      const reservationsData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const status = data.status || "active";
        console.log(`Reservation ${doc.id} status: ${status}`);
        if (data.associationId) associationIds.push(data.associationId);
        return {
          id: doc.id,
          associationId: data.associationId,
          associationName: data.associationName || "Association inconnue",
          restaurantVille: data.restaurantVille || "Ville inconnue",
          quantite: data.quantite || "Quantité inconnue",
          offre: data.offre || "Offre inconnue",
          createdAt: safeConvertToDate(data.createdAt),
          dateRecuperation: safeConvertToDate(data.dateRecuperation),
          annonceCreationTimestamp: safeConvertToDate(data.annonceCreationTimestamp),
          target: "Cible non spécifiée",
          status,
        };
      });

      if (associationIds.length > 0) {
        const associationsSnapshot = await getDocs(
          query(collection(db, "associations"), where(documentId(), "in", associationIds))
        );
        const newAssociationsData = {};
        associationsSnapshot.forEach((doc) => {
          newAssociationsData[doc.id] = doc.data();
        });

        reservationsData.forEach((reservation) => {
          if (reservation.associationId && newAssociationsData[reservation.associationId]) {
            reservation.target = newAssociationsData[reservation.associationId].target || "Cible non spécifiée";
          }
        });
        setAssociationsData((prev) => ({ ...prev, ...newAssociationsData }));
      }

      setReservations(reservationsData.sort((a, b) => (a.status === "active" && b.status !== "active" ? -1 : 1)));
    } catch (error) {
      console.error("Error fetching reservations:", error);
      setError("Erreur lors du chargement des réservations");
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActesBenevoles = async () => {
    try {
      setLoadingActes(true);
      if (!userDetail?.uid) {
        console.log("No valid user UID");
        setActesBenevoles([]);
        return;
      }

      const q = query(collection(db, "aides"), where("restaurantId", "==", userDetail.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("No actes bénévoles found");
        setActesBenevoles([]);
        return;
      }

      const actesData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        let associationVille = "Ville inconnue";
        let associationCible = "Cible non spécifiée";
        let associationPhone = "Non renseigné";

        if (data.associationId) {
          try {
            const associationDocRef = doc(db, "associations", data.associationId);
            const associationSnap = await getDoc(associationDocRef);
            if (associationSnap.exists()) {
              const associationData = associationSnap.data();
              associationVille = associationData.ville || associationVille;
              associationCible = associationData.target || associationCible;
              associationPhone = associationData.phone || associationPhone;
              setAssociationsData((prev) => ({
                ...prev,
                [data.associationId]: associationData,
              }));
            }
          } catch (error) {
            console.error(`Error fetching association ${data.associationId}:`, error);
          }
        }

        const status = data.status || "active";
        console.log(`Acte ${docSnapshot.id} status: ${status}`);
        return {
          id: docSnapshot.id,
          besoinId: data.besoinId,
          associationId: data.associationId,
          associationName: data.associationName || "Association inconnue",
          associationPhone: data.associationPhone || associationPhone,
          quantite: data.quantite || "Quantité inconnue",
          aideStatus: data.aideStatus || "en attente",
          type: data.aidetype,
          createdAt: safeConvertToDate(data.createdAt),
          dateRecuperation: safeConvertToDate(data.dateRecuperation),
          besoinContent: data.besoinContent || "Contenu inconnu",
          ville: data.associationVille || associationVille,
          cible: data.associationCible || associationCible,
          status,
        };
      }));

      setActesBenevoles(actesData.sort((a, b) => (a.status === "active" && b.status !== "active" ? -1 : 1)));
    } catch (error) {
      console.error("Error fetching actes bénévoles:", error);
      setError("Erreur lors du chargement des actes bénévoles");
      setActesBenevoles([]);
    } finally {
      setLoadingActes(false);
    }
  };

  const fetchAllData = async () => {
    try {
      await Promise.all([fetchReservations(), fetchActesBenevoles()]);
    } catch (error) {
      console.error("Error fetching all data:", error);
      setError("Erreur lors du chargement des données");
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (isMounted && userDetail?.uid) {
      fetchAllData();
    }
    return () => {
      isMounted = false;
    };
  }, [userDetail?.uid]);

  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : width * 0.75;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleProfilePress = () => {
    router.push("/ProfileResto");
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const formatDate = (date) => {
    if (!date) return "Date inconnue";
    try {
      if (date.toDate && typeof date.toDate === "function") {
        date = date.toDate();
      }
      const dateObj = date instanceof Date ? date : new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }
      return "Date inconnue";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date inconnue";
    }
  };

  const formatTime = (date) => {
    if (!date) return "Heure inconnue";
    try {
      if (date.toDate && typeof date.toDate === "function") {
        date = date.toDate();
      }
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

  const handleUpdateReservation = (reservationId) => {
    router.push({
      pathname: "/ModifierReservation",
      params: { id: reservationId, type: "reservation" },
    });
  };

  const handleDeleteReservation = async (reservationId) => {
    try {
      await deleteDoc(doc(db, "reservations", reservationId));
      setReservations((prev) => prev.filter((r) => r.id !== reservationId));
      Alert.alert("Succès", "Réservation supprimée");
    } catch (error) {
      console.error("Error deleting reservation:", error);
      Alert.alert("Erreur", "Échec de la suppression");
    }
  };

  const handleDeleteActe = async (acteId) => {
    try {
      await deleteDoc(doc(db, "aides", acteId));
      setActesBenevoles((prev) => prev.filter((a) => a.id !== acteId));
      Alert.alert("Succès", "Acte bénévole annulé");
    } catch (error) {
      console.error("Error deleting acte:", error);
      Alert.alert("Erreur", "Échec de l'annulation");
    }
  };

  const handleViewActeDetails = (acteId) => {
    router.push({
      pathname: "/ModifierReservation",
      params: { id: acteId, type: "acte" },
    });
  };

  const handleMarkAsRecovered = async (itemId, type) => {
    try {
      const collectionName = type === "reservation" ? "reservations" : "aides";
      await updateDoc(doc(db, collectionName, itemId), {
        status: "archived",
      });

      if (type === "reservation") {
        setReservations((prev) =>
          prev
            .map((r) => (r.id === itemId ? { ...r, status: "archived" } : r))
            .sort((a, b) => (a.status === "active" && b.status !== "active" ? -1 : 1))
        );
      } else {
        setActesBenevoles((prev) =>
          prev
            .map((a) => (a.id === itemId ? { ...a, status: "archived" } : a))
            .sort((a, b) => (a.status === "active" && b.status !== "active" ? -1 : 1))
        );
      }
      Alert.alert("Succès", `${type === "reservation" ? "Réservation" : "Acte bénévole"} marqué comme récupéré`);
    } catch (error) {
      console.error("Error archiving:", error);
      Alert.alert("Erreur", "Échec de l'archivage");
    }
  };

  const initials = userDetail?.name
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "NA";

  const colors = ["#7B9DD2", "#DAD4DE", "#BBB4DA", "#7B9DD2", "#70C7C6"];
  const colorIndex = userDetail?.uid?.length % colors.length || 0;

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAllData}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

      <Animated.View style={[styles.mainContent, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleMenu}>
            <MaterialIcons name="menu" size={35} color="black" style={styles.menuIcon} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Échanges</Text>
          </View>

          <TouchableOpacity onPress={handleProfilePress}>
            <View style={[styles.avatar, { backgroundColor: colors[colorIndex] }]}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "reservations" && styles.activeTab]}
            onPress={() => setActiveTab("reservations")}
          >
            <Text style={[styles.tabText, activeTab === "reservations" && styles.activeTabText]}>
              Réservations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "actes" && styles.activeTab]}
            onPress={() => setActiveTab("actes")}
          >
            <Text style={[styles.tabText, activeTab === "actes" && styles.activeTabText]}>
              Actes Bénévoles
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
          }
        >
          {activeTab === "reservations" ? (
            <View style={{ flex: 1, alignItems: "center" }}>
              <View style={styles.textContainer}>
                <Text style={styles.text}>Vos réservations :</Text>
              </View>

              {loading ? (
                <ActivityIndicator size="large" color="gray" />
              ) : reservations.length === 0 ? (
                <Text style={styles.noReservationsText}>Aucune réservation</Text>
              ) : (
                reservations.map((reservation) => {
                  const associationInfo = associationsData[reservation.associationId] || {};
                  return (
                    <View
                      key={reservation.id}
                      style={[
                        styles.reservationCard,
                        reservation.status === "archived" && styles.archivedCard,
                      ]}
                    >
                      <View style={styles.headerContainer}>
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: "/AssoPr",
                              params: {
                                associationId: reservation.associationId,
                                association: JSON.stringify(associationInfo),
                              },
                            })
                          }
                        >
                          <View
                            style={[
                              styles.avatarReservation,
                              { backgroundColor: colors[reservation.associationId?.length % colors.length || 0] },
                            ]}
                          >
                            <Text style={{ color: "black", fontSize: 25 }}>
                              {reservation.associationName
                                ?.split(" ")
                                .map((word) => word[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2) || "NA"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.titleWrapper}>
                          <Text style={styles.reservationTitle}>{reservation.associationName}</Text>
                          <Text style={styles.reservationSubtitle}>
                            {reservation.restaurantVille} - {formatDate(reservation.annonceCreationTimestamp)}
                          </Text>
                          {reservation.status === "archived" && (
                            <Text style={styles.archivedText}>Archivé</Text>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.recoverButton}
                          onPress={() => handleMarkAsRecovered(reservation.id, "reservation")}
                        >
                          <FontAwesome5 name="check-circle" size={24} color="green" />
                          {/* <MaterialIcons name="check-circle" size={24} color="green" /> */}
                        </TouchableOpacity>
                      </View>

                      <View style={styles.reservationContent}>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Offre: </Text>
                          {reservation.quantite} {reservation.offre}
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Cible: </Text>
                          {reservation.target}
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Date Récup.: </Text>
                          {formatDate(reservation.dateRecuperation)}
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Heure Récup.: </Text>
                          {formatTime(reservation.dateRecuperation)}
                        </Text>
                      </View>

                      <View style={styles.reservationActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleUpdateReservation(reservation.id)}
                        >
                          <Text style={styles.actionButtonText}>Modifier</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteReservation(reservation.id)}
                        >
                          <Text style={styles.actionButtonText}>Supprimer</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: "center" }}>
              <View style={styles.textContainer}>
                <Text style={styles.text}>Vos actes bénévoles :</Text>
              </View>

              {loadingActes ? (
                <ActivityIndicator size="large" color="gray" />
              ) : actesBenevoles.length === 0 ? (
                <Text style={styles.noReservationsText}>Aucun acte bénévole</Text>
              ) : (
                actesBenevoles.map((acte) => {
                  const associationInfo = associationsData[acte.associationId] || {};
                  return (
                    <View
                      key={acte.id}
                      style={[
                        styles.reservationCard,
                        acte.status === "archived" && styles.archivedCard,
                      ]}
                    >
                      <View style={styles.headerContainer}>
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: "/AssoPr",
                              params: {
                                associationId: acte.associationId,
                                association: JSON.stringify(associationInfo),
                              },
                            })
                          }
                        >
                          <View
                            style={[
                              styles.avatarReservation,
                              { backgroundColor: colors[acte.associationId?.length % colors.length || 0] },
                            ]}
                          >
                            <Text style={{ color: "black", fontSize: 25 }}>
                              {acte.associationName
                                ?.split(" ")
                                .map((word) => word[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2) || "NA"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.titleWrapper}>
                          <Text style={styles.reservationTitle}>{acte.associationName}</Text>
                          <Text style={styles.reservationSubtitle}>
                            {acte.ville} - {associationInfo.phone || acte.associationPhone}
                          </Text>
                          <Text style={styles.reservationSubtitle}>
                            {formatDate(acte.createdAt)} - {formatTime(acte.createdAt)}
                          </Text>
                          {acte.status === "archived" && (
                            <Text style={styles.archivedText}>Archivé</Text>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.recoverButton}
                          onPress={() => handleMarkAsRecovered(acte.id, "acte")}
                        >
                          <FontAwesome5 name="check-circle" size={24} color="green" />
                          {/* <MaterialIcons name="check-circle" size={24} color="green" /> */}
                        </TouchableOpacity>
                      </View>

                      <View style={styles.reservationContent}>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Besoin: </Text>
                          {acte.quantite} {acte.besoinContent}
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Cible: </Text>
                          {acte.cible}
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Statut: </Text>
                          <Text
                            style={{
                              color:
                                acte.aideStatus === "confirmé"
                                  ? "green"
                                  : acte.aideStatus === "refusé"
                                  ? "red"
                                  : "orange",
                            }}
                          >
                            {acte.aideStatus}
                          </Text>
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Date Récup.: </Text>
                          {formatDate(acte.dateRecuperation)} à {formatTime(acte.dateRecuperation)}
                        </Text>
                      </View>

                      <View style={styles.reservationActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: "#E5E5EA" }]}
                          onPress={() => handleViewActeDetails(acte.id)}
                        >
                          <Text style={styles.actionButtonText}>Modifier</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            {
                              backgroundColor: acte.aideStatus === "en attente" ? "#FFCDD2" : "#F5F5F5",
                            },
                          ]}
                          onPress={() => acte.aideStatus === "en attente" && handleDeleteActe(acte.id)}
                          disabled={acte.aideStatus !== "en attente"}
                        >
                          <Text
                            style={[
                              styles.actionButtonText,
                              acte.aideStatus !== "en attente" && { color: "#9E9E9E" },
                            ]}
                          >
                            Annuler
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      </Animated.View>

      <SlideMenu isOpen={isMenuOpen} toggleMenu={toggleMenu} userDetail={userDetail} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
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
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: StatusBar.currentHeight || 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderColor: "#FFFFFF",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarReservation: {
    width: 60,
    height: 60,
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
    fontSize: 32,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    flex: 1,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  menuIcon: {
    padding: 5,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: 5,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#EAE5E5",
    borderWidth: 1,
    borderColor: "#000",
    marginHorizontal: 5,
    borderRadius: 5,
  },
  activeTab: {
    backgroundColor: "#EEE6D8",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  activeTabText: {
    color: "#000",
    fontWeight: "bold",
  },
  contentContainer: {
    paddingBottom: 50,
    alignItems: "center",
  },
  textContainer: {
    backgroundColor: "#EAE5E5",
    width: width * 0.9,
    padding: 10,
    borderRadius: 20,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  noReservationsText: {
    fontSize: 18,
    color: "#666",
    marginTop: 20,
  },
  reservationCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#000",
    width: width * 0.9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  archivedCard: {
    backgroundColor: "#F5F5F5",
    opacity: 0.7,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    position: "relative",
    minHeight: 70,
    paddingRight: 40, // Space for button
  },
  titleWrapper: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  reservationTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },
  reservationSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 3,
  },
  archivedText: {
    fontSize: 14,
    color: "#0000FF",
    fontWeight: "600",
    marginTop: 3,
  },
  reservationContent: {
    marginTop: 10,
    marginBottom: 10,
  },
  reservationText: {
    fontSize: 16,
    color: "#000",
    marginTop: 5,
  },
  reservationActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    padding: 10,
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 5,
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  recoverButton: {
    position: "absolute",
    top: 5,
    right: 5,
    padding: 8,
    backgroundColor: "green", // Debug red
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#000",
    zIndex: 1000,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#FF0000",
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 5,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});