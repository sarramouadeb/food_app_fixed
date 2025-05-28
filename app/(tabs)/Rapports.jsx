import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  PanResponder,
} from "react-native";
import { useUserContext } from "../../context/UserContext";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { router } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { ImageBackground, Image } from "expo-image";
import SlideMenu from "./SlideMenu";

const { width, height } = Dimensions.get("window");

export default function Rapports() {
  const { userDetail } = useUserContext();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "rapports"));

      const reportsData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          assoName: data.assoName || "Association inconnue",
          assoAddress: data.assoAddress || "Adresse inconnue",
          assoEmail: data.assoEmail || "Email inconnu",
          assoPhone: data.assoPhone || "Téléphone inconnu",
          associationId: data.associationId || "",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : null,
          date: data.date || "Date inconnue",
          description: data.description || "Aucune description",
          images: data.images || [],
          status: data.status || "N/A",
        };
      });

      setReports(reportsData);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleProfilePress = () => {
    router.push("ProfileResto");
  };

  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return "Date inconnue";
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const initials = userDetail?.name
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "NA";

  const colors = ["#7B9DD2", "#DAD4DE", "#BBB4DA", "#7B9DD2", "#70C7C6"];
  const colorIndex = userDetail?.uid?.length % colors.length || 0;

  const openImageViewer = (images, index) => {
    setSelectedImages(images);
    setCurrentImageIndex(index);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === selectedImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? selectedImages.length - 1 : prevIndex - 1
    );
  };

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderRelease: (evt, gestureState) => {
          if (gestureState.dx > 50) {
            goToPrevImage();
          } else if (gestureState.dx < -50) {
            goToNextImage();
          }
        },
      }),
    [currentImageIndex, selectedImages]
  );

  const chunkImages = (images) => {
    const chunks = [];
    for (let i = 0; i < images.length; i += 2) {
      chunks.push(images.slice(i, i + 2));
    }
    return chunks;
  };

  if (loading && !refreshing) {
    return (
      <ImageBackground
        source={require("../../assets/images/cover.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="gray" />
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/images/cover.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {isMenuOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleMenu}>
            <MaterialIcons name="menu" size={35} color="black" style={styles.menuIcon} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Rapports</Text>
          </View>

          <TouchableOpacity onPress={handleProfilePress}>
            <View style={[styles.avatar, { backgroundColor: colors[colorIndex] }]}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
          }
        >
          <View style={{ flex: 1, alignItems: "center" }}>
            {reports.length === 0 ? (
              <Text style={styles.noReportsText}>Aucun rapport trouvé</Text>
            ) : (
              reports.map((report) => (
                <View key={report.id} style={styles.reportCard}>
                  <View style={styles.headerContainer}>
                    <View style={[styles.avatarReport, { backgroundColor: colors[report.associationId?.length % colors.length || 0] }]}>
                      <Text style={styles.avatarText}>
                        {report.assoName
                          .split(" ")
                          .map((word) => word[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </Text>
                    </View>
                    <View style={styles.titleWrapper}>
                      <Text style={styles.reportTitle}>{report.assoName}</Text>
                      <Text style={styles.reportSubtitle}>
                        {report.date} - {report.assoAddress} {"\n"}
                        {report.assoPhone}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.reportContent}>
                    <Text style={styles.reportText}>
                      {report.description}
                    </Text>

                    {report.images?.length > 0 && (
                      <View style={styles.imagesContainer}>
                        {report.images.length === 1 ? (
                          <TouchableOpacity
                            onPress={() => openImageViewer(report.images, 0)}
                            style={[styles.imageContainer, styles.singleImage]}
                          >
                            <Image
                              source={{ uri: report.images[0] }}
                              style={styles.gridImage}
                              resizeMode="cover"
                              onError={() => console.log(`Failed to load image 0 for report ${report.id}`)}
                            />
                          </TouchableOpacity>
                        ) : (
                          chunkImages(report.images).map((imagePair, rowIndex) => (
                            <View key={rowIndex} style={styles.imageRow}>
                              {imagePair.map((img, index) => (
                                <TouchableOpacity
                                  key={`${rowIndex}-${index}`}
                                  onPress={() => openImageViewer(report.images, rowIndex * 2 + index)}
                                  style={[
                                    styles.imageContainer,
                                    index === 0 ? styles.largeImage : styles.smallImage,
                                  ]}
                                >
                                  <Image
                                    source={{ uri: img }}
                                    style={styles.gridImage}
                                    resizeMode="cover"
                                    onError={() => console.log(`Failed to load image ${rowIndex * 2 + index} for report ${report.id}`)}
                                  />
                                </TouchableOpacity>
                              ))}
                              {imagePair.length === 1 && (
                                <View style={[styles.imageContainer, styles.smallImage, styles.emptyImage]} />
                              )}
                            </View>
                          ))
                        )}
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {imageViewerVisible && (
        <View style={styles.imageViewerOverlay} {...panResponder.panHandlers}>
          <TouchableOpacity style={styles.closeButton} onPress={closeImageViewer}>
            <MaterialIcons name="close" size={30} color="white" />
          </TouchableOpacity>

          <Image
            source={{ uri: selectedImages[currentImageIndex] }}
            style={styles.enlargedImage}
            resizeMode="contain"
          />

          <View style={styles.navigationButtons}>
            <TouchableOpacity onPress={goToPrevImage} style={styles.navButton}>
              <MaterialIcons name="chevron-left" size={40} color="white" />
            </TouchableOpacity>

            <Text style={styles.imageCounter}>
              {currentImageIndex + 1} / {selectedImages.length}
            </Text>

            <TouchableOpacity onPress={goToNextImage} style={styles.navButton}>
              <MaterialIcons name="chevron-right" size={40} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <SlideMenu isOpen={isMenuOpen} toggleMenu={toggleMenu} userDetail={userDetail} />
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 0,
    marginTop: 15,
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
  avatarReport: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: "#FFFFFF",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "black",
    fontSize: 25,
    fontWeight: "bold",
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
  contentContainer: {
    paddingBottom: 50,
    alignItems: "center",
  },
  noReportsText: {
    textAlign: "center",
    fontSize: 18,
    marginTop: 20,
    color: "gray",
  },
  reportCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    borderColor: "black",
    borderWidth: 1,
    width: width * 0.9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignSelf: "center",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  titleWrapper: {
    flex: 1,
    marginLeft: 10,
  },
  reportTitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "black",
  },
  reportSubtitle: {
    fontSize: 15,
    color: "gray",
    marginTop: 5,
  },
  reportContent: {
    marginTop: 10,
    marginBottom: 15,
  },
  reportText: {
    fontSize: 18,
    marginTop: 5,
    color: "black",
  },
  imagesContainer: {
    marginTop: 10,
    width: width * 0.9,
  },
  imageRow: {
    flexDirection: "row",
    width: width * 0.9,
    marginBottom: 8,
  },
  imageContainer: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  singleImage: {
    width: width * 0.8,
    height: 220,
  },
  largeImage: {
    width: width * 0.9 * 0.4,
    height: 160,
    marginRight: 8,
  },
  smallImage: {
    width: width * 0.9 * 0.5,
    height: 160,
  },
  emptyImage: {
    width: width * 0.9 * 0.3,
    height: 160,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  imageViewerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.9)",
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  enlargedImage: {
    width: "100%",
    height: "70%",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1001,
  },
  navigationButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  navButton: {
    padding: 20,
  },
  imageCounter: {
    color: "white",
    fontSize: 18,
    marginHorizontal: 20,
  },
});