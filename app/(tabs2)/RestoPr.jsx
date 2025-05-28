import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

export default function RestoPr() {
  const route = useRoute();
  const navigation = useNavigation();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

useEffect(() => {
  const fetchRestaurantData = async () => {
    try {
      const restaurantId = route.params?.restaurantId;
      if (restaurantId) {
        const docRef = doc(db, 'restaurants', restaurantId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Convertir les timestamps Firebase en dates JavaScript
          const workingDays = {};
          if (data.workingDays) {
            Object.keys(data.workingDays).forEach(day => {
              workingDays[day] = {
                ...data.workingDays[day],
                // Vérifier si heureOuverture/heureFermeture existent avant toDate()
                heureOuverture: data.workingDays[day].heureOuverture?.toDate 
                  ? data.workingDays[day].heureOuverture.toDate() 
                  : null,
                heureFermeture: data.workingDays[day].heureFermeture?.toDate 
                  ? data.workingDays[day].heureFermeture.toDate() 
                  : null
              };
            });
          }
          
          // Gérer createdAt qui pourrait être soit un Timestamp soit une string
          let createdAtDate;
          if (data.createdAt?.toDate) {
            createdAtDate = data.createdAt.toDate();
          } else if (data.createdAt) {
            // Si c'est déjà une string, la convertir en Date
            createdAtDate = new Date(data.createdAt);
          } else {
            createdAtDate = null;
          }
          
          setRestaurant({
            id: docSnap.id,
            ...data,
            createdAt: createdAtDate,
            workingDays
          });
        } else {
          console.log('Aucun restaurant trouvé avec cet ID');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchRestaurantData();
}, [route.params?.restaurantId]);

  const handleGoBack = () => {
    navigation.goBack();
  };

const formatDate = (date) => {
  if (!date || isNaN(new Date(date).getTime())) return 'Non spécifié';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};
  const formatTime = (date) => {
    if (!date) return 'Non spécifié';
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderWorkingDays = () => {
    if (!restaurant?.workingDays) return null;

    const daysOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const daysMap = {
      lundi: 'Lundi',
      mardi: 'Mardi',
      mercredi: 'Mercredi',
      jeudi: 'Jeudi',
      vendredi: 'Vendredi',
      samedi: 'Samedi',
      dimanche: 'Dimanche'
    };

    return daysOrder.map(day => {
      const dayData = restaurant.workingDays[day];
      if (!dayData) return null;

      return (
        <View key={day} style={styles.workingDayItem}>
          <Text style={styles.workingDayText}>
            {daysMap[day]}: {dayData.ouvert ? 'Ouvert' : 'Fermé'}
          </Text>
          {dayData.ouvert && (
            <Text style={styles.workingHoursText}>
              {formatTime(dayData.heureOuverture)} - {formatTime(dayData.heureFermeture)}
            </Text>
          )}
        </View>
      );
    });
  };

  const initials = restaurant?.name
    ? restaurant.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'NA';

  const colors = ['#7B9DD2', '#DAD4DE', '#BBB4DA', '#7B9DD2', '#70C7C6'];
  const colorIndex = restaurant?.id ? restaurant.id.length % colors.length : 0;

  if (loading) {
    return (
      <ImageBackground 
        source={require('../../assets/images/cover.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B4BAFF" />
        </View>
      </ImageBackground>
    );
  }

  if (!restaurant) {
    return (
      <ImageBackground 
        source={require('../../assets/images/cover.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.container}>
          <Text>Aucune donnée disponible pour ce restaurant</Text>
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Back Button */}
        <TouchableOpacity 
          onPress={handleGoBack}
          style={styles.backButton}
        >
          <EvilIcons name="arrow-left" size={45} color="black" />
        </TouchableOpacity>

        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.avatarWrapper}>
            {restaurant?.image && !imageError ? (
              <Image
                source={{ uri: restaurant.image }}
                style={styles.avatarImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors[colorIndex] }]}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.speciality}>{restaurant.speciality}</Text>
          <Text style={styles.location}>
            <MaterialIcons name="location-on" size={18} color="black" />
            {restaurant.ville}
          </Text>
        </View>

        {/* Information Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <MaterialIcons name="email" size={24} color="black" style={styles.icon} />
            <Text style={styles.infoText}>{restaurant.email}</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="phone" size={24} color="black" style={styles.icon} />
            <Text style={styles.infoText}>{restaurant.phone}</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="assignment" size={24} color="black" style={styles.icon} />
            <Text style={styles.infoText}>N° d'enregistrement: {restaurant.registerNb}</Text>
          </View>

          <View style={styles.infoItem}>
            <FontAwesome name="cutlery" size={24} color="black" style={styles.icon} />
            <Text style={styles.infoText}>Spécialité: {restaurant.speciality}</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="date-range" size={24} color="black" style={styles.icon} />
            <Text style={styles.infoText}>Membre depuis: {formatDate(restaurant.createdAt)}</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="local-offer" size={24} color="black" style={styles.icon} />
            <Text style={styles.infoText}>Annonces publiées: {restaurant.nbAnnonces || 0}</Text>
          </View>

          {/* Horaires d'ouverture */}
          <View style={styles.scheduleSection}>
            <Text style={styles.sectionTitle}>Horaires d'ouverture</Text>
            {renderWorkingDays()}
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  backButton: {
    position: 'absolute',
    top: height * 0.05,
    left: width * 0.05,
    zIndex: 1,
  },
  headerContainer: {
    marginTop: height * 0.12,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: 'black',
    fontSize: 64,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "black",
    textAlign: 'center',
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  speciality: {
    fontSize: 20,
    color: "black",
    fontStyle: 'italic',
    marginBottom: 5,
  },
  location: {
    fontSize: 18,
    color: "black",
    marginTop: 5,
    fontWeight: '500',
  },
  infoSection: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'black',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoText: {
    fontSize: 18,
    color: 'black',
    marginLeft: 10,
    flex: 1,
  },
  icon: {
    marginRight: 10,
  },
  scheduleSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 15,
  },
  workingDayItem: {
    marginBottom: 10,
  },
  workingDayText: {
    fontSize: 16,
    color: 'black',
    fontWeight: '500',
  },
  workingHoursText: {
    fontSize: 14,
    color: 'gray',
    marginLeft: 20,
  },
});