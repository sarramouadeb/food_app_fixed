import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  StatusBar
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const About = () => {
  const openExternalLink = (url) => {
    Linking.openURL(url).catch(err => console.error("Erreur lors de l'ouverture du lien", err));
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/cover.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar backgroundColor="transparent" translucent={true} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header avec le même style que les autres pages */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={30} color="black" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>À Propos</Text>
          </View>
          
          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* Logo et description */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo1.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>FoodBridge</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.tagline}>Connecter les surplus aux besoins</Text>
        </View>

        {/* Section description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notre Mission</Text>
          <Text style={styles.sectionText}>
            FoodBridge révolutionne la gestion des surplus alimentaires en connectant directement 
            les restaurants avec des associations caritatives et des personnes dans le besoin.
          </Text>
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <MaterialIcons name="restaurant" size={20} color="#70C7C6" />
              <Text style={styles.featureText}>Réduction du gaspillage alimentaire</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="group" size={20} color="#70C7C6" />
              <Text style={styles.featureText}>Solidarité locale renforcée</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="eco" size={20} color="#70C7C6" />
              <Text style={styles.featureText}>Impact environnemental positif</Text>
            </View>
          </View>
        </View>

        {/* Comment ça marche */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comment ça marche ?</Text>
          <View style={styles.stepContainer}>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Les restaurants signalent leurs surplus</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Les associations voient les disponibilités</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>Collecte et redistribution organisée</Text>
            </View>
          </View>
        </View>

        {/* Statistiques */}
        <View style={[styles.section, styles.statsSection]}>
          <Text style={styles.sectionTitle}>Notre Impact</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>250+</Text>
              <Text style={styles.statLabel}>Restaurants partenaires</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5T+</Text>
              <Text style={styles.statLabel}>Nourriture sauvée</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>50+</Text>
              <Text style={styles.statLabel}>Associations bénéficiaires</Text>
            </View>
          </View>
        </View>

        {/* Section contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rejoignez-nous</Text>
          <Text style={styles.sectionText}>
            Vous êtes un restaurant ou une association ? Contactez-nous pour participer au mouvement !
          </Text>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => openExternalLink('mailto:contact@foodbridge.app')}
          >
            <MaterialIcons name="email" size={20} color="#70C7C6" />
            <Text style={styles.contactText}>contact@foodbridge.app</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => openExternalLink('tel:+21650123456')}
          >
            <MaterialIcons name="phone" size={20} color="#70C7C6" />
            <Text style={styles.contactText}>+216 50 123 456</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => openExternalLink('https://www.foodbridge.app')}
          >
            <MaterialIcons name="public" size={20} color="#70C7C6" />
            <Text style={styles.contactText}>www.foodbridge.app</Text>
          </TouchableOpacity>
        </View>

        {/* Footer simplifié */}
        <View style={styles.footer}>
          <View style={styles.socialIcons}>
            <TouchableOpacity 
              style={styles.socialIcon} 
              onPress={() => openExternalLink('https://facebook.com/foodbridge')}
            >
              <MaterialIcons name="facebook" size={24} color="#70C7C6" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialIcon} 
              onPress={() => openExternalLink('https://instagram.com/foodbridge')}
            >
              <AntDesign name="instagram" size={24} color="#70C7C6" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialIcon} 
              onPress={() => openExternalLink('https://linkedin.com/foodbridge')}
            >
              <AntDesign name="linkedin-square" size={24} color="#70C7C6" />
            </TouchableOpacity>
          </View>
          <Text style={styles.footerText}>© 2025 FoodBridge. Tous droits réservés.</Text>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flexGrow: 1,
    paddingBottom: 30,
   
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
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    textShadowRadius: 10,
  },
  headerRightPlaceholder: {
    width: 30,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical:5,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#70C7C6',
    marginTop: 10,
  },
  version: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 5,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsSection: {
    backgroundColor: 'rgba(112, 199, 198, 0.1)',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#70C7C6',
    marginBottom: 15,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 15,
  },
  featuresContainer: {
    marginTop: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  stepContainer: {
    marginTop: 10,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#70C7C6',
    color: 'white',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: 'bold',
    marginRight: 15,
  },
  stepText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#70C7C6',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  contactText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginTop: 15,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  socialIcon: {
    marginHorizontal: 15,
  },
});

export default About;