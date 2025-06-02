import React, { useEffect, useRef, useState } from "react";
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
import SlideMenuA from "./SlideMenuA";
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { ImageBackground } from "expo-image";
import { Alert } from "react-native";

const { width, height } = Dimensions.get("window");

export default function EchangesA() {
  const { userDetail } = useUserContext();
  const params = useLocalSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState(params?.initialTab || "reservations");
  const [reservations, setReservations] = useState([]);
  const [actesBenevoles, setActesBenevoles] = useState([]);
  const [restaurantsData, setRestaurantsData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingActes, setLoadingActes] = useState(true);
  const [error, setError] = useState(null);
  const [highlightedReservation, setHighlightedReservation] = useState(null);

  useEffect(() => {
    if (params?.highlightReservation) {
      setHighlightedReservation(params.highlightReservation);
      setActiveTab(params.tab || "reservations");

      const timer = setTimeout(() => {
        setHighlightedReservation(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [params]);

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

  const fetchReservations = () => {
    try {
      setLoading(true);
      if (!userDetail?.uid) {
        console.log("No valid user UID");
        setReservations([]);
        setLoading(false);
        return;
      }

      const q = query(collection(db, "reservations"), where("associationId", "==", userDetail.uid));
      return onSnapshot(q, async (snapshot) => {
        const reservationsList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            restaurantId: data.restaurantId,
            restaurantName: data.restaurantName || "Nom inconnu",
            restaurantVille: data.restaurantVille || "Ville inconnue",
            restaurantPhone: data.restaurantPhone || "Non renseigné",
            quantite: data.quantite || "Non spécifié",
            offre: data.offre || "Non spécifié",
            type: data.type || "Non spécifié",
            createdAt: safeConvertToDate(data.createdAt),
            dateRecuperation: safeConvertToDate(data.dateRecuperation),
            expirationDate: safeConvertToDate(data.expirationDate),
            status: data.status || "active",
          };
        });

        if (reservationsList.length === 0) {
          setReservations([]);
          setLoading(false);
          return;
        }

        const restaurantIds = [...new Set(reservationsList.map((r) => r.restaurantId).filter((id) => id))];
        const newRestaurantsData = {};

        for (const id of restaurantIds) {
          try {
            const docSnap = await getDoc(doc(db, "restaurants", id));
            if (docSnap.exists()) {
              newRestaurantsData[id] = docSnap.data();
            }
          } catch (error) {
            console.error(`Error fetching restaurant ${id}:`, error);
          }
        }

        setRestaurantsData((prev) => ({ ...prev, ...newRestaurantsData }));
        setReservations(reservationsList.sort((a, b) => (a.status === "active" && b.status !== "active" ? -1 : 1)));
        setLoading(false);
      }, (error) => {
        console.error("Error fetching reservations:", error);
        setError("Erreur lors du chargement des réservations");
        setReservations([]);
        setLoading(false);
      });
    } catch (error) {
      console.error("Error fetching reservations:", error);
      setError("Erreur lors du chargement des réservations");
      setReservations([]);
      setLoading(false);
    }
  };

  const fetchActesBenevoles = () => {
    try {
      setLoadingActes(true);
      if (!userDetail?.uid) {
        console.log("No valid user UID");
        setActesBenevoles([]);
        setLoadingActes(false);
        return;
      }

      const q = query(collection(db, "aides"), where("associationId", "==", userDetail.uid));
      return onSnapshot(q, async (snapshot) => {
        const actesList = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            let restaurantVille = "Ville inconnue";
            let restaurantPhone = "Non renseigné";

            if (data.restaurantId) {
              try {
                const restaurantDocRef = doc(db, "restaurants", data.restaurantId);
                const restaurantSnap = await getDoc(restaurantDocRef);
                if (restaurantSnap.exists()) {
                  const restaurantData = restaurantSnap.data();
                  restaurantVille = restaurantData.ville || restaurantVille;
                  restaurantPhone = restaurantData.phone || restaurantPhone;
                  setRestaurantsData((prev) => ({
                    ...prev,
                    [data.restaurantId]: restaurantData,
                  }));
                }
              } catch (error) {
                console.error(`Error fetching restaurant ${data.restaurantId}:`, error);
              }
            }

            return {
              id: docSnapshot.id,
              restaurantId: data.restaurantId,
              restaurantName: data.restaurantName || "Nom inconnu",
              restaurantVille: data.restaurantVille || restaurantVille,
              restaurantPhone: data.restaurantPhone || restaurantPhone,
              quantite: data.quantite || "Non spécifié",
              besoinContent: data.besoinContent || "Non spécifié",
              aidetype: data.aidetype || "Non spécifié",
              besoinEtat: data.besoinEtat || "Non spécifié",
              associationCible: data.associationCible || "Non spécifié",
              createdAt: safeConvertToDate(data.createdAt),
              dateRecuperation: safeConvertToDate(data.dateRecuperation),
              status: data.status || "active",
              aideStatus: data.aideStatus || "en attente",
            };
          })
        );

        setActesBenevoles(actesList.sort((a, b) => (a.status === "active" && b.status !== "active" ? -1 : 1)));
        setLoadingActes(false);
      }, (error) => {
        console.error("Error fetching actes bénévoles:", error);
        setError("Erreur lors du chargement des actes bénévoles");
        setActesBenevoles([]);
        setLoadingActes(false);
      });
    } catch (error) {
      console.error("Error fetching actes bénévoles:", error);
      setError("Erreur lors du chargement des actes bénévoles");
      setActesBenevoles([]);
      setLoadingActes(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (isMounted && userDetail?.uid) {
      const unsubscribeReservations = fetchReservations();
      const unsubscribeActes = fetchActesBenevoles();
      return () => {
        isMounted = false;
        if (unsubscribeReservations && typeof unsubscribeReservations === "function") {
          unsubscribeReservations();
        }
        if (unsubscribeActes && typeof unsubscribeActes === "function") {
          unsubscribeActes();
        }
      };
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
    router.push("ProfileAsso");
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchReservations(), fetchActesBenevoles()]);
    setRefreshing(false);
  };

  const handleDeleteReservation = async (reservationId) => {
    try {
      await deleteDoc(doc(db, "reservations", reservationId));
      Alert.alert("Succès", "Réservation supprimée avec succès");
    } catch (error) {
      console.error("Error deleting reservation:", error);
      Alert.alert("Erreur", "Échec de la suppression de la réservation");
    }
  };

  const handleDeleteActe = async (acteId) => {
    try {
      await deleteDoc(doc(db, "aides", acteId));
      Alert.alert("Succès", "Acte bénévole supprimé avec succès");
    } catch (error) {
      console.error("Error deleting acte:", error);
      Alert.alert("Erreur", "Échec de la suppression de l'acte bénévole");
    }
  };

  const handleModifyReservation = (reservation) => {
    if (!reservation.restaurantId) {
      Alert.alert("Erreur", "Impossible de modifier cette réservation (ID restaurant manquant)");
      return;
    }

    router.push({
      pathname: "ReserverAnnonce",
      params: {
        annonce: JSON.stringify({
          ...reservation,
          restaurantId: reservation.restaurantId,
        }),
        isModification: true,
      },
    });
  };

  const handleModifyActe = (acte) => {
    if (!acte.id) {
      Alert.alert("Erreur", "Impossible de modifier cet acte bénévole");
      return;
    }

    router.push({
      pathname: "ReserverAnnonce",
      params: {
        annonce: JSON.stringify(acte),
        isModification: true,
        isActeBenevole: true,
      },
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
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
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
              Vos Réservations
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#70C7C6"]}
            />
          }
        >
          {activeTab === "reservations" ? (
            <View style={{ flex: 1, alignItems: "center" }}>
              <View style={styles.textContainer}>
                <Text style={styles.text}>Filtrer vos réservations :</Text>
              </View>

              {loading ? (
                <ActivityIndicator size="large" color="#70C7C6" style={{ marginTop: 20 }} />
              ) : reservations.length === 0 ? (
                <Text style={styles.noReservationsText}>Aucune réservation trouvée</Text>
              ) : (
                reservations.map((reservation) => {
                  const restaurant = restaurantsData[reservation.restaurantId] || {};
                  const isHighlighted = reservation.id === highlightedReservation;
                  const restaurantInitials = restaurant.name
                    ?.split(" ")
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "NA";

                  return (
                    <View
                      key={reservation.id}
                      style={[
                        styles.reservationCard,
                        isHighlighted && styles.highlightedReservation,
                        reservation.status === "archived" && styles.archivedCard,
                      ]}
                    >
                      <View style={styles.headerContainer}>
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: "/RestoPr",
                              params: {
                                restaurantId: reservation.restaurantId,
                                restaurant: JSON.stringify(restaurant),
                              },
                            })
                          }
                        >
                          <View style={[styles.avatarReservation, { backgroundColor: colors[colorIndex] }]}>
                            <Text style={styles.avatarText}>{restaurantInitials}</Text>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.titleWrapper}>
                          <Text style={styles.reservationTitle}>{restaurant.name || reservation.restaurantName}</Text>
                          <Text style={styles.reservationSubtitle}>
                            {reservation.restaurantVille} • {restaurant.phone || reservation.restaurantPhone}
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
                        </TouchableOpacity>
                      </View>

                      <View style={styles.reservationContent}>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Offre: </Text>
                          {reservation.quantite} {reservation.offre}
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Type: </Text>
                          {reservation.type}
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Expiration: </Text>
                          {formatDate(reservation.expirationDate)}
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Récupération: </Text>
                          {formatDate(reservation.dateRecuperation)} à {formatTime(reservation.dateRecuperation)}
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Réservé le: </Text>
                          {formatDate(reservation.createdAt)}
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Statut: </Text>
                          <Text
                            style={{
                              color:
                                reservation.status === "confirmé"
                                  ? "green"
                                  : reservation.status === "refusé"
                                  ? "red"
                                  : "orange",
                            }}
                          >
                            {reservation.status || "en attente"}
                          </Text>
                        </Text>
                      </View>

                      <View style={styles.reservationActions}>
                        <TouchableOpacity
                          style={styles.actionButtonModifier}
                          onPress={() => handleModifyReservation(reservation)}
                        >
                          <Text style={styles.actionButtonTextModifier}>Modifier</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButtonSupprimer}
                          onPress={() => handleDeleteReservation(reservation.id)}
                        >
                          <Text style={styles.actionButtonTextSupprimer}>Supprimer</Text>
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
                <Text style={styles.text}>Filtrer vos actes bénévoles :</Text>
              </View>

              {loadingActes ? (
                <ActivityIndicator size="large" color="#70C7C6" style={{ marginTop: 20 }} />
              ) : actesBenevoles.length === 0 ? (
                <Text style={styles.noReservationsText}>Aucun acte bénévole trouvé</Text>
              ) : (
                actesBenevoles.map((acte) => {
                  const restaurantInitials = acte.restaurantName
                    ?.split(" ")
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "NA";

                  return (
                    <View
                      key={acte.id}
                      style={[styles.reservationCard, acte.status === "archived" && styles.archivedCard]}
                    >
                      <View style={styles.headerContainer}>
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: "/RestoPr",
                              params: {
                                restaurantId: acte.restaurantId,
                                restaurant: JSON.stringify(restaurantsData[acte.restaurantId] || {}),
                              },
                            })
                          }
                        >
                          <View style={[styles.avatarReservation, { backgroundColor: colors[colorIndex] }]}>
                            <Text style={styles.avatarText}>{restaurantInitials}</Text>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.titleWrapper}>
                          <Text style={styles.reservationTitle}>{acte.restaurantName}</Text>
                          <Text style={styles.reservationSubtitle}>
                            {acte.restaurantVille} - {acte.restaurantPhone}
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
                        </TouchableOpacity>
                      </View>

                      <View style={styles.reservationContent}>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Besoin: </Text>
                          {acte.quantite} {acte.besoinContent}
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Type d'aide: </Text>
                          {acte.aidetype}
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>État: </Text>
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
                          <Text style={{ fontWeight: "bold" }}>Date de récupération: </Text>
                          {formatDate(acte.dateRecuperation)} à {formatTime(acte.dateRecuperation)}
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Cible: </Text>
                          {acte.associationCible}
                        </Text>
                      </View>

                      <View style={styles.reservationActions}>
                        <TouchableOpacity
                          style={[styles.actionButtonModifier, { backgroundColor: "#E5E5EA" }]}
                          onPress={() => handleModifyActe(acte)}
                        >
                          <Text style={styles.actionButtonTextModifier}>Modifier</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionButtonSupprimer,
                            {
                              backgroundColor: acte.aideStatus === "en attente" ? "#FFCDD2" : "#F5F5F5",
                            },
                          ]}
                          onPress={() => acte.aideStatus === "en attente" && handleDeleteActe(acte.id)}
                          disabled={acte.aideStatus !== "en attente"}
                        >
                          <Text
                            style={[
                              styles.actionButtonTextSupprimer,
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

      <SlideMenuA isOpen={isMenuOpen} toggleMenu={toggleMenu} userDetail={userDetail} />
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
  highlightedReservation: {
    borderColor: "#70C7C6",
    borderWidth: 3,
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
    paddingRight: 40,
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
  actionButtonModifier: {
    padding: 10,
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 5,
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  actionButtonTextModifier: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  actionButtonSupprimer: {
    padding: 10,
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 5,
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  actionButtonTextSupprimer: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  recoverButton: {
    position: "absolute",
    top: 5,
    right: 5,
    padding: 8,
    backgroundColor: "green",
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
  avatarText: {
    color: "black",
    fontSize: 25,
    fontWeight: "bold",
  },
});