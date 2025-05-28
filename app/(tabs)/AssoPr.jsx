import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

export default function AssoPr() {
  const router = useRouter();
  const { associationId, association } = useLocalSearchParams();
  const [associationData, setAssociationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadAssociationData = async () => {
      try {
        let data;
        // Try to use passed association data
        if (association) {
          try {
            data = JSON.parse(association);
            // Ensure createdAt is a Date object
            if (data.createdAt && typeof data.createdAt === 'string') {
              data.createdAt = new Date(data.createdAt);
            }
          } catch (parseError) {
            console.error('Erreur lors du parsing JSON:', parseError);
          }
        }

        // Fallback to Firestore if no valid passed data or missing key fields
        if (!data || !data.name) {
          if (!associationId) {
            console.log('Aucun associationId fourni');
            return;
          }
          
          const docRef = doc(db, 'associations', associationId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            data = docSnap.data();
            if (data.createdAt?.toDate) {
              data.createdAt = data.createdAt.toDate();
            } else if (data.createdAt) {
              data.createdAt = new Date(data.createdAt);
            } else {
              data.createdAt = null;
            }
          } else {
            console.log('Aucune association trouvée avec cet ID');
            return;
          }
        }

        setAssociationData({
          id: associationId || data.id,
          ...data,
        });
      } catch (error) {
        console.error('Erreur lors de la récupération de l’association:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAssociationData();
  }, [associationId, association]);

  const handleGoBack = () => {
    router.back();
  };

  const formatDate = (date) => {
    if (!date || isNaN(new Date(date).getTime())) return 'Non spécifié';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const initials = associationData?.name
    ? associationData.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'NA';

  const colors = ['#7B9DD2', '#DAD4DE', '#BBB4DA', '#7B9DD2', '#70C7C6'];
  const colorIndex = associationData?.id ? associationData.id.length % colors.length : 0;

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

  if (!associationData) {
    return (
      <ImageBackground 
        source={require('../../assets/images/cover.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.container}>
          <Text>Aucune donnée disponible pour cette association</Text>
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
        <TouchableOpacity 
          onPress={handleGoBack}
          style={styles.backButton}
        >
          <EvilIcons name="arrow-left" size={45} color="black" />
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <View style={styles.avatarWrapper}>
            {associationData?.image && !imageError ? (
              <Image
                source={{ uri: associationData.image }}
                style={styles.avatarImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors[colorIndex] }]}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.associationName}>{associationData.name}</Text>
          <Text style={styles.target}>{associationData.target}</Text>
          <Text style={styles.location}>
            <MaterialIcons name="location-on" size={18} color="black" />
            {associationData.ville}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <MaterialIcons name="email" size={24} color="black" style={styles.icon} />
            <Text style={styles.infoText}>{associationData.email || 'Non spécifié'}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="phone" size={24} color="black" style={styles.icon} />
            <Text style={styles.infoText}>{associationData.phone || 'Non spécifié'}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="person" size={24} color="black" style={styles.icon} />
            <Text style={styles.infoText}>Responsable: {associationData.nameResp || 'Non spécifié'}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="phone" size={24} color="black" style={styles.icon} />
            <Text style={styles.infoText}>Téléphone responsable: {associationData.phoneResp || 'Non spécifié'}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <FontAwesome name="group" size={24} color="black" style={styles.icon} />
            <Text style={styles.infoText}>Cible: {associationData.target || 'Non spécifié'}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <MaterialIcons name="list" size={24} color="black" style={styles.icon} />
            <Text style={styles.infoText}>Total besoins publiés: {associationData.totalBesoins || 0}</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="date-range" size={24} color="black" style={styles.icon} />
            <Text style={styles.infoText}>Membre depuis: {formatDate(associationData.createdAt)}</Text>
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
  associationName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "black",
    textAlign: 'center',
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  target: {
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
});