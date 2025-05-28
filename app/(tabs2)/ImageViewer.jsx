import React from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

const ImageViewer = () => {
  const { imageUrl } = router.params;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton}
         onPress={() => router.replace('/(tabs2)/RapportsA')}
      >
        <MaterialIcons name="close" size={30} color="white" />
      </TouchableOpacity>
      
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
});

export default ImageViewer;