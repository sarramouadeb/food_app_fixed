import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useUserContext } from '../../context/UserContext';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';

const AddReport = () => {
  const { userDetail } = useUserContext();
  const params = useLocalSearchParams();

  // État initial avec les valeurs du rapport existant si en mode édition
  const [description, setDescription] = useState(params.description || '');
  const [images, setImages] = useState(params.images ? JSON.parse(params.images) : []);
  const [uploading, setUploading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!params.reportId);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Autorisation nécessaire pour accéder aux photos');
      }
    })();

    // Si en mode édition, initialiser avec les données existantes
    if (params.reportId) {
      setIsEditMode(true);
    }
  }, []);

  const pickImage = async () => {
    try {
      if (images.length >= 5) {
        Alert.alert("Limite atteinte", "Maximum 5 images par rapport");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setImages([...images, base64Image]);
      }
    } catch (error) {
      console.error("Erreur sélection image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };

  const removeImage = (index) => {
    Alert.alert(
      "Confirmer la suppression",
      "Voulez-vous vraiment supprimer cette image?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            const newImages = [...images];
            newImages.splice(index, 1);
            setImages(newImages);
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!userDetail?.uid) {
      Alert.alert("Erreur", "Association non identifiée");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Erreur", "Veuillez saisir une description");
      return;
    }

    try {
      setUploading(true);

      const reportData = {
        associationId: userDetail.uid,
        assoName: userDetail.name || "Association",
        assoEmail: userDetail.email || "",
        assoPhone: userDetail.phone || "",
        assoAddress: userDetail.ville || userDetail.address || "",
        description: description.trim(),
        images: images,
        date: isEditMode ? params.date : new Date().toLocaleDateString('fr-FR'),
        updatedAt: serverTimestamp(),
        status: 'active'
      };

      if (isEditMode) {
        // Mode édition - mise à jour du document existant
        await updateDoc(doc(db, 'rapports', params.reportId), reportData);
        Alert.alert("Succès", "Rapport mis à jour avec succès", [
          { text: "OK", onPress: () => router.replace('/(tabs2)/RapportsA') }
        ]);
      } else {
        // Mode création - ajout d'un nouveau document
        await addDoc(collection(db, 'rapports'), {
          ...reportData,
          createdAt: serverTimestamp()
        });
        Alert.alert("Succès", "Rapport enregistré avec succès", [
          { text: "OK", onPress: () => router.replace('/(tabs2)/RapportsA') }
        ]);
      }

    } catch (error) {
      console.error("Erreur enregistrement:", error);
      Alert.alert("Erreur", error.message || "Échec de l'enregistrement");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/cover.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs2)/RapportsA')}
          disabled={uploading}
        >
          <MaterialIcons
            name="arrow-back"
            size={30}
            color={uploading ? '#ccc' : 'black'}
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          {isEditMode ? 'Modifier Rapport' : 'Nouveau Rapport'}
        </Text>

        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.label}>Description*</Text>
        <TextInput
          style={styles.descriptionInput}
          multiline
          numberOfLines={5}
          placeholder="Décrivez votre rapport en détail..."
          placeholderTextColor="#888"
          value={description}
          onChangeText={setDescription}
          editable={!uploading}
        />

        <Text style={styles.label}>
          Images ({images.length}/5) {isEditMode && '(Cliquez pour supprimer)'}
        </Text>

        {images.length > 0 && (
          <View style={styles.imagesContainer}>
            {images.map((img, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => removeImage(index)}
                disabled={uploading}
              >
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: img }}
                    style={styles.image}
                  />
                  {!uploading && (
                    <View style={styles.deleteImageButton}>
                      <MaterialIcons name="close" size={20} color="white" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.addImageButton,
            (uploading || images.length >= 5) && styles.disabledButton
          ]}
          onPress={pickImage}
          disabled={uploading || images.length >= 5}
        >
          <MaterialIcons
            name="add-photo-alternate"
            size={30}
            color={uploading || images.length >= 5 ? '#ccc' : '#70C7C6'}
          />
          <Text style={[
            styles.addImageText,
            (uploading || images.length >= 5) && styles.disabledButtonText
          ]}>
            {images.length > 0 ? 'Ajouter plus d\'images' : 'Ajouter des images'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButtonContainer,
            (!description.trim() || uploading) && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={uploading || !description.trim()}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? 'Mettre à jour' : 'Confirmer'}
            </Text>
          )}
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
  },
  headerPlaceholder: {
    width: 80, // Placeholder to balance the header layout
  },
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    marginTop: 15,
    color: '#333',
  },
  descriptionInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    minHeight: 150,
    marginBottom: 15,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#333',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  disabledButton: {
    opacity: 0.6,
  },
  addImageText: {
    marginLeft: 10,
    color: '#70C7C6',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  imageWrapper: {
    marginRight: 10,
    marginBottom: 10,
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  deleteImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,0,0,0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonContainer: {
    backgroundColor: '#70C7C6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddReport;