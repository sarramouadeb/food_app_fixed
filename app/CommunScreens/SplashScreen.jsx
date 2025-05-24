import { StyleSheet, View, Text, Image } from "react-native";
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import Screen1 from './Screen1'
// Use require with correct relative path
const logo1 = require("../../assets/images/logo1.png");

export default function SplashScreen() {
  const router = useRouter();
  const [isShowSplash, setIsShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShowSplash(false);
    }, 3000); 
    return () => clearTimeout(timer); 
  }, []);

    if (!isShowSplash) {
    return <Screen1 />; 
  }

  return (
    <View style={styles.container}>
      <Image 
        source={logo1} 
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>MealBridge</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff"
  },
  image: {
    width: 180,
    height: 180
  },
  title: {
    fontSize: 25,
    color: 'black',
    fontWeight: 'bold',
    marginTop: 20
  }
});