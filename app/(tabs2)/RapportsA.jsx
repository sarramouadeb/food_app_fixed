import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ImageBackground,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  PanResponder,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useUserContext } from '../../context/UserContext';
import { router } from 'expo-router';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import SlideMenuA from './SlideMenuA';

const { width, height } = Dimensions.get('window');

const RapportsA = () => {
  const { userDetail } = useUserContext();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    console.log('Association data:', JSON.stringify(userDetail, null, 2));
  }, [userDetail]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      if (!userDetail?.uid) {
        console.warn('Missing association UID:', userDetail);
        Alert.alert('Erreur', "Identifiant de l'association manquant");
        return;
      }

      const q = query(
        collection(db, 'rapports'),
        where('associationId', '==', userDetail.uid)
      );
      const querySnapshot = await getDocs(q);

      const reportsData = [];
      querySnapshot.forEach((doc) => {
        const reportData = doc.data();
        reportsData.push({
          id: doc.id,
          assoName: reportData.assoName || userDetail?.name || 'Association',
          assoPhone: reportData.assoPhone || userDetail?.phone || '',
          assoAddress: reportData.assoAddress || userDetail?.ville || '',
          assoEmail: reportData.assoEmail || userDetail?.email || '',
          date: reportData.date || new Date().toLocaleDateString('fr-FR'),
          description: reportData.description || 'Aucune description',
          images: reportData.images || [],
          status: reportData.status || 'active',
        });
      });

      setReports(reportsData);
      console.log('Reports loaded:', reportsData);
    } catch (error) {
      console.error('Firebase error:', error);
      Alert.alert('Erreur', 'Impossible de charger les rapports: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userDetail?.uid) {
      fetchReports();
    }
  }, [userDetail?.uid]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleProfilePress = () => {
    router.push('ProfileAsso');
  };

  const handleAddReport = () => {
    if (!userDetail?.uid) {
      Alert.alert('Erreur', "Association non identifiée");
      return;
    }
    router.push('/(tabs2)/AddReport');
  };

  const handleEditReport = (report) => {
    router.push({
      pathname: '/(tabs2)/AddReport',
      params: {
        reportId: report.id,
        assoName: report.assoName,
        assoEmail: report.assoEmail,
        assoPhone: report.assoPhone,
        assoAddress: report.assoAddress,
        description: report.description,
        images: JSON.stringify(report.images),
        date: report.date,
        status: report.status,
      },
    });
  };

  const handleDeleteReport = async (reportId) => {
    Alert.alert(
      'Confirmer la suppression',
      'Voulez-vous vraiment supprimer ce rapport ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'rapports', reportId));
              Alert.alert('Succès', 'Rapport supprimé avec succès');
              fetchReports();
            } catch (error) {
              console.error('Error deleting report:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le rapport: ' + error.message);
            }
          },
        },
      ]
    );
  };

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

  // Helper function to chunk images into pairs
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
        source={require('../../assets/images/cover.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#70C7C6" />
          <Text style={styles.loadingText}>Chargement des rapports...</Text>
        </View>
      </ImageBackground>
    );
  }

  if (!userDetail?.uid) {
    return (
      <ImageBackground
        source={require('../../assets/images/cover.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={50} color="#ff4444" />
          <Text style={styles.errorText}>Association non identifiée</Text>
          <Text style={styles.errorSubText}>Veuillez vous reconnecter</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/cover.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {isMenuOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleMenu}
          accessibilityLabel="Fermer le menu"
        />
      )}

      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleMenu} accessibilityLabel="Ouvrir le menu">
            <MaterialIcons name="menu" size={35} color="black" style={styles.menuIcon} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Rapports</Text>
          </View>

          <TouchableOpacity onPress={handleProfilePress} accessibilityLabel="Voir le profil">
            <View style={styles.avatar}>
              <Text style={styles.initials}>
                {userDetail?.name?.substring(0, 2).toUpperCase() || 'AS'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[styles.contentContainer, { paddingBottom: 150 }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#70C7C6']}
              />
            }
          >
            <View style={{ flex: 1, alignItems: 'center' }}>
              {reports.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="description" size={80} color="#70C7C6" />
                  <Text style={styles.noReportsText}>Aucun rapport trouvé</Text>
                </View>
              ) : (
                reports.map((report) => (
                  <View key={report.id} style={styles.reportCard}>
                    <View style={styles.headerContainer}>
                      <View style={styles.avatarReport}>
                        <Text style={styles.avatarText}>
                          {report.assoName?.substring(0, 2).toUpperCase() || 'AS'}
                        </Text>
                      </View>
                      <View style={styles.titleWrapper}>
                        <Text style={styles.reportTitle}>{report.assoName}</Text>
                        <Text style={styles.reportSubtitle}>
                          {report.date} , {report.assoAddress} {report.assoPhone}
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

                    <View style={styles.reportActions}>
                      <TouchableOpacity
                        style={styles.actionButtonModifier}
                        onPress={() => handleEditReport(report)}
                        accessibilityLabel="Modifier le rapport"
                      >
                        <Text style={styles.actionButtonTextModifier}>Modifier</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButtonSupprimer}
                        onPress={() => handleDeleteReport(report.id)}
                        accessibilityLabel="Supprimer le rapport"
                      >
                        <Text style={styles.actionButtonTextSupprimer}>Supprimer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.floatingButton}
            onPress={handleAddReport}
            accessibilityLabel="Ajouter un nouveau rapport"
          >
            <MaterialIcons name="add" size={30} color="white" />
          </TouchableOpacity>
        </View>
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

      <SlideMenuA isOpen={isMenuOpen} toggleMenu={toggleMenu} />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 99,
  },
  mainContent: {
    flex: 1,
    paddingTop: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#555',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4444',
    marginTop: 20,
  },
  errorSubText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 15,
    marginTop: 0,
    marginBottom: height * 0.02,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    color: 'black',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderColor: '#FFFFFF',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#70C7C6',
  },
  initials: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuIcon: {
    padding: 5,
  },
  contentContainer: {
    paddingBottom: 150,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.25,
  },
  noReportsText: {
    textAlign: 'center',
    fontSize: 18,
    marginTop: 20,
    color: 'gray',
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    borderColor: 'black',
    borderWidth: 2,
    width: width * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignSelf: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarReport: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: '#FFFFFF',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#70C7C6',
  },
  avatarText: {
    color: 'black',
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleWrapper: {
    flex: 1,
    marginLeft: 10,
  },
  reportTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: 'black',
  },
  reportSubtitle: {
    fontSize: 15,
    color: 'gray',
    marginTop: 5,
  },
  reportContent: {
    marginTop: 10,
    marginBottom: 15,
  },
  reportText: {
    fontSize: 18,
    marginTop: 5,
    color: 'black',
  },
  imagesContainer: {
    marginTop: 10,
    width: width * 0.9,
  },
  imageRow: {
    flexDirection: 'row',
    width: width * 0.9,
    marginBottom: 8,
  },
  imageContainer: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5', // Subtle background for better contrast
  },
  singleImage: {
    width: width * 0.8,
    height: 220,
  },
  largeImage: {
    width: width * 0.9 * 0.4, // 60% of container width
    height: 160,
    marginRight: 8,
  },
  smallImage: {
    width: width * 0.9 * 0.5, // 30% of container width for more contrast
    height: 160,
  },
  emptyImage: {
    width: width * 0.9 * 0.3,
    height: 160,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButtonModifier: {
    padding: 10,
    flex: 1,
    marginRight: 5,
    borderColor: 'black',
    borderWidth: 1,
    alignItems: 'center',
  },
  actionButtonTextModifier: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtonSupprimer: {
    padding: 10,
    flex: 1,
    marginLeft: 5,
    borderColor: 'black',
    borderWidth: 1,
    alignItems: 'center',
  },
  actionButtonTextSupprimer: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    backgroundColor: '#70C7C6',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 100,
  },
  imageViewerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enlargedImage: {
    width: '100%',
    height: '70%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1001,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  navButton: {
    padding: 20,
  },
  imageCounter: {
    color: 'white',
    fontSize: 18,
    marginHorizontal: 20,
  },
});

export default RapportsA;