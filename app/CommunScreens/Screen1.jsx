
import { View, StyleSheet, Text, Dimensions, Pressable } from "react-native";
import Background from "../../assets/images/Background.png"; // Import de l'image de fond
import { Image } from 'react-native';

import { useRouter } from "expo-router";

// Get screen width and height
const { width, height } = Dimensions.get('window');

export default function Screen1() {
  const router = useRouter(); 
  return (
    <View style={styles.container}>
      <Image 
        source={Background} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      <Text style={styles.text}></Text>
      <Text style={styles.para}>Votre plateforme pour lutter contre 
      {"\n"}le gaspillage alimentaire et aider ceux
      qui en ont besoin.</Text>
      
      <View>
        <Pressable onPress={() => router.push('/CommunScreens/Screen2')}>
          <Text style={styles.btn}>Suivant</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  text: {
    color: 'black',
    fontSize:20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: height * 0.35,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    lineHeight: height * 0.06, // Espacement entre les lignes
  },
  para: {
    color: 'black',
    fontSize: width * 0.05, // Légèrement plus petit pour équilibrer
    textAlign: 'center',
    marginHorizontal: width * 0.1, // Marge plus large pour un meilleur rendu
    marginTop: height * 0.03,
    lineHeight: height * 0.035, // Meilleure lisibilité
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  btn: {
    padding: 15,
    backgroundColor: "#D7D7D7",
    marginTop: height * 0.05,
    
    width: width * 0.7,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: width * 0.06,
    color: 'black',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  }
});
