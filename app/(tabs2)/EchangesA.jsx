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
    ImageBackground,
  } from "react-native";
  import { useUserContext } from "../../context/UserContext";
  import MaterialIcons from "react-native-vector-icons/MaterialIcons";
  import { router } from "expo-router";
  import SlideMenuA from "./SlideMenuA";
  import {
    doc,
    collection,
    query,
    where,
    onSnapshot,
    deleteDoc,
    getDoc,
  } from "firebase/firestore";
  import { db } from "../../config/FirebaseConfig";
  import * as Animatable from "react-native-animatable";
  import { useRoute } from "@react-navigation/native";

  const { width, height } = Dimensions.get("window");

  export default function EchangesA() {
    const { userDetail } = useUserContext();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("reservations");
    const [reservations, setReservations] = useState([]);
    const [actesBenevoles, setActesBenevoles] = useState([]);
    const [restaurantsData, setRestaurantsData] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingActes, setLoadingActes] = useState(true);
    const route = useRoute();
    const [highlightedReservation, setHighlightedReservation] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(Date.now());

    useEffect(() => {
      if (route.params?.highlightReservation) {
        setHighlightedReservation(route.params.highlightReservation);
        setActiveTab(route.params.tab || "reservations");
        setLastUpdate(Date.now());

        const timer = setTimeout(() => {
          setHighlightedReservation(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [route.params]);

    const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
    };

    const handleProfilePress = () => {
      router.push("ProfileAsso");
    };

    const handleDeleteReservation = async (reservationId) => {
      try {
        await deleteDoc(doc(db, "reservations", reservationId));
        alert("Réservation supprimée avec succès");
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression");
      }
    };

    const handleDeleteActe = async (acteId) => {
      try {
        await deleteDoc(doc(db, "aides", acteId));
        alert("Acte bénévole supprimé avec succès");
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression");
      }
    };

    const fetchReservations = () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, "reservations"),
          where("associationId", "==", userDetail?.uid || "")
        );

        return onSnapshot(q, async (snapshot) => {
          const reservationsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setReservations(reservationsList);

          if (reservationsList.length === 0) {
            setLoading(false);
            return;
          }

          const restaurantIds = [
            ...new Set(reservationsList.map((r) => r.restaurantId).filter(id => id)),
          ];
          const newRestaurantsData = {};

          for (const id of restaurantIds) {
            if (!id) continue;
            const docSnap = await getDoc(doc(db, "restaurants", id));
            if (docSnap.exists()) {
              newRestaurantsData[id] = docSnap.data();
            }
          }

          setRestaurantsData(newRestaurantsData);
          setLoading(false);
        });
      } catch (error) {
        console.error("Erreur lors du chargement des réservations:", error);
        setLoading(false);
        setReservations([]);
      }
    };

    const fetchActesBenevoles = () => {
      try {
        setLoadingActes(true);
        const q = query(
          collection(db, "aides"),
          where("associationId", "==", userDetail?.uid || "")
        );

        return onSnapshot(q, (snapshot) => {
          const actesList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setActesBenevoles(actesList);
          setLoadingActes(false);
        });
      } catch (error) {
        console.error("Erreur lors du chargement des actes bénévoles:", error);
        setLoadingActes(false);
        setActesBenevoles([]);
      }
    };

    useEffect(() => {
      const unsubscribeReservations = fetchReservations();
      const unsubscribeActes = fetchActesBenevoles();
      
      return () => {
        if (unsubscribeReservations && typeof unsubscribeReservations === "function") {
          unsubscribeReservations();
        }
        if (unsubscribeActes && typeof unsubscribeActes === "function") {
          unsubscribeActes();
        }
      };
    }, [userDetail?.uid, lastUpdate]);

    const onRefresh = async () => {
      setRefreshing(true);
      setLastUpdate(Date.now());
      setRefreshing(false);
    };

    const formatDate = (dateInput) => {
      if (!dateInput) return "Date inconnue";
      
      if (dateInput?.seconds) {
        return new Date(dateInput.seconds * 1000).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric"
        });
      }
      if (typeof dateInput === 'string') {
        return new Date(dateInput).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric"
        });
      }
      if (dateInput instanceof Date) {
        return dateInput.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric"
        });
      }
      return "Date inconnue";
    };

    const formatTime = (timestamp) => {
      if (!timestamp?.seconds) return "Heure inconnue";
      return new Date(timestamp.seconds * 1000).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const handleModifyReservation = (reservation) => {
      if (!reservation.restaurantId) {
        alert("Erreur: Impossible de modifier cette réservation (ID restaurant manquant)");
        return;
      }

      router.push({
        pathname: "ReserverAnnonce",
        params: {
          annonce: JSON.stringify({
            ...reservation,
            restaurantId: reservation.restaurantId
          }),
          isModification: true,
        }
      });
    };

const handleModifyActe = (acte) => {
  if (!acte.id) {
    alert("Erreur: Impossible de modifier cet acte bénévole");
    return;
  }

  router.push({
    pathname: "ReserverAnnonce",
    params: {
      annonce: JSON.stringify(acte),
      isModification: true,
      isActeBenevole: true
    }
  });
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

        <Animated.View style={[styles.mainContent, { paddingTop: 30 }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={toggleMenu}>
              <MaterialIcons name="menu" size={35} color="black" style={styles.menuIcon} />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>Echanges</Text>
            </View>

            <TouchableOpacity onPress={handleProfilePress}>
              <View style={[styles.avatar, { backgroundColor: colors[colorIndex] }]}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "reservations" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("reservations")}
            >
              <Text style={[
                styles.tabText,
                activeTab === "reservations" && styles.activeTabText,
              ]}>
                Vos Réservations
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "actes" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("actes")}
            >
              <Text style={[
                styles.tabText,
                activeTab === "actes" && styles.activeTabText,
              ]}>
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
              colors={['#70C7C6']}
            />
          }
        >
            {activeTab === "reservations" ? (
              <View style={{ flex: 1, alignItems: "center" }}>
                <View style={styles.textContainer}>
                  <Text style={styles.text}>Filtrer vos réservations:</Text>
                </View>

                {loading ? (
                  <ActivityIndicator
                    size="large"
                    color="#70C7C6"
                    style={{ marginTop: 20 }}
                  />
                ) : reservations.length === 0 ? (
                  <Text style={styles.noReservationsText}>
                    Aucune réservation trouvée
                  </Text>
                ) : (
                  reservations.map((reservation) => {
                    const restaurant = restaurantsData[reservation.restaurantId] || {};
                    const isHighlighted = reservation.id === highlightedReservation;
                    const restaurantInitials = restaurant.name
                      ? restaurant.name
                          .split(" ")
                          .map((word) => word[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "NA";

                    return (
                      <View
                        key={reservation.id}
                        style={[
                          styles.reservationCard,
                          isHighlighted && styles.highlightedReservation,
                        ]}
                      >
                        <View style={styles.headerContainer}>
                          <View style={[
                            styles.avatarReservation, 
                            { backgroundColor: colors[colorIndex] }
                          ]}>
                            <Text style={styles.avatarText}>{restaurantInitials}</Text>
                          </View>
                          <View style={styles.titleWrapper}>
                            <Text style={styles.reservationTitle}>
                              {restaurant.name || "Nom inconnu"}
                            </Text>
                            <Text style={styles.reservationSubtitle}>
                              {restaurant.ville || "Ville inconnue"} • {restaurant.phone || "Non renseigné"}
                            </Text>
                          </View>
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
                        </View>

                        <View style={styles.statusContainer}>
                          <Text style={[
                            styles.statusText,
                            { 
                              backgroundColor: 
                                reservation.status === "confirmé" ? "#D4EDDA" :
                                reservation.status === "refusé" ? "#F8D7DA" : "#FFF3CD",
                              color: 
                                reservation.status === "confirmé" ? "#155724" :
                                reservation.status === "refusé" ? "#721C24" : "#856404"
                            }
                          ]}>
                            {reservation.status || "en attente"}
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
            ) :(
            <View style={{ flex: 1, alignItems: "center" }}>
              <View style={styles.textContainer}>
                <Text style={styles.text}>Filtrer vos actes bénévoles:</Text>
              </View>

              {loadingActes ? (
                <ActivityIndicator
                  size="large"
                  color="#70C7C6"
                  style={{ marginTop: 20 }}
                />
              ) : actesBenevoles.length === 0 ? (
                <Text style={styles.noReservationsText}>
                  Aucun acte bénévole trouvé
                </Text>
              ) : (
                actesBenevoles.map((acte) => {
                  const restaurantInitials = acte.restaurantName
                    ? acte.restaurantName
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "NA";

                  return (
                    <View
                      key={acte.id}
                      style={styles.reservationCard}
                    >
                      <View style={styles.headerContainer}>
                        <View style={[
                          styles.avatarReservation, 
                          { backgroundColor: colors[colorIndex] }
                        ]}>
                          <Text style={styles.avatarText}>{restaurantInitials}</Text>
                        </View>
                        <View style={styles.titleWrapper}>
                          <Text style={styles.reservationTitle}>
                            {acte.restaurantName || "Nom inconnu"}
                          </Text>
                          <Text style={styles.reservationSubtitle}>
                            {acte.restaurantVille || "Ville inconnue"} - {acte.restaurantPhone || "Non renseigné"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.reservationContent}>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Besoin: </Text>
                           {acte.quantite || "Non spécifié"} {acte.besoinContent || "Non spécifié"}
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Type d'aide: </Text>
                          {acte.aidetype || "Non spécifié"}
                        </Text>
                   
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>État: </Text>
                          {acte.besoinEtat || "Non spécifié"}
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Date de récupération: </Text>
                          {formatDate(acte.dateRecuperation)} à {formatTime(acte.dateRecuperation)}
                        </Text>
                        <Text style={styles.reservationText}>
                          <Text style={{ fontWeight: "bold" }}>Cible: </Text>
                          {acte.associationCible || "Non spécifié"}
                        </Text>
                      </View>

                      <View style={styles.statusContainer}>
                        <Text style={[
                          styles.statusText,
                          { 
                            backgroundColor: 
                              acte.status === "confirmé" ? "#D4EDDA" :
                              acte.status === "refusé" ? "#F8D7DA" : "#FFF3CD",
                            color: 
                              acte.status === "confirmé" ? "#155724" :
                              acte.status === "refusé" ? "#721C24" : "#856404"
                          }
                        ]}>
                          {acte.status || "en attente"}
                        </Text>
                      </View>

                      <View style={styles.reservationActions}>
                        <TouchableOpacity
                          style={styles.actionButtonModifier}
                          onPress={() => handleModifyActe(acte)}
                        >
                          <Text style={styles.actionButtonTextModifier}>Modifier</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButtonSupprimer}
                          onPress={() => handleDeleteActe(acte.id)}
                        >
                          <Text style={styles.actionButtonTextSupprimer}>Supprimer</Text>
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
      paddingTop: 30,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 15,
      paddingTop: 15,
      marginTop: 0,
      marginBottom: height * 0.02,
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
      fontSize: 35,
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
      backgroundColor: "rgba(255,255,255,0.5)",
      paddingHorizontal: 0,
    },
    tabButton: {
      paddingVertical: 12,
      paddingHorizontal: 30,
      backgroundColor: "#EAE5E5",
      borderWidth: 1,
      borderColor: "black",
      marginHorizontal: 0,
    },
    activeTab: {
      backgroundColor: "#EEE6D8",
    },
    tabText: {
      fontSize: 16,
      fontWeight: "bold",
      color: "black",
      textAlign: "center",
    },
    activeTabText: {
      color: "black",
    },
    contentContainer: {
      paddingBottom: 50,
      alignItems: "center",
    },
    textContainer: {
      backgroundColor: "#EAE5E5",
      width: width * 0.9,
      height: 35,
      borderRadius: 30,
      marginTop: height * 0.04,
      marginBottom: height * 0.04,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      alignSelf: "center",
    },
    text: {
      fontSize: 22,
      fontWeight: "bold",
      color: "black",
    },
    noReservationsText: {
      textAlign: "center",
      fontSize: 18,
      marginTop: 20,
      color: "gray",
    },
    reservationCard: {
      backgroundColor: "white",
      borderRadius: 20,
      padding: 15,
      marginBottom: 15,
      borderColor: "black",
      borderWidth: 2,
      width: width * 0.9,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      alignSelf: "center",
    },
    highlightedReservation: {
      borderColor: "#70C7C6",
      borderWidth: 3,
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    titleWrapper: {
      flex: 1,
      marginLeft: 10,
    },
    reservationTitle: {
      fontSize: 25,
      fontWeight: "bold",
      color: "black",
    },
    reservationSubtitle: {
      fontSize: 15,
      color: "gray",
      marginTop: 5,
    },
    reservationContent: {
      marginTop: 10,
      marginBottom: 15,
    },
    reservationText: {
      fontSize: 18,
      marginTop: 5,
      color: "black",
    },
    statusContainer: {
      alignSelf: "flex-end",
      marginBottom: 10,
    },
    statusText: {
      fontSize: 14,
      fontWeight: "600",
      paddingVertical: 5,
      paddingHorizontal: 15,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: "#ddd",
    },
    reservationActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
    },
    actionButtonModifier: {
      padding: 10,
      flex: 1,
      marginRight: 5,
      borderColor: "black",
      borderWidth: 1,
      alignItems: "center",
    },
    actionButtonTextModifier: {
      color: "black",
      fontSize: 18,
      fontWeight: "bold",
    },
    actionButtonSupprimer: {
      padding: 10,
      flex: 1,
      marginLeft: 5,
      borderColor: "black",
      borderWidth: 1,
      alignItems: "center",
    },
    actionButtonTextSupprimer: {
      color: "black",
      fontSize: 18,
      fontWeight: "bold",
    },
    avatarText: {
      color: "black",
      fontSize: 24,
      fontWeight: "bold",
    },
  });