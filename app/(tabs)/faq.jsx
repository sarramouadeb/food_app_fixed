import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  ScrollView, 
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useUserContext } from '../../context/UserContext';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

const FAQ = () => {
  const { userDetail } = useUserContext();
  const [messages, setMessages] = useState([
    { 
      text: "Bonjour ! Je suis l'assistant des besoins associatifs. Posez-moi vos questions ou choisissez une option ci-dessous.", 
      isUser: false 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);

  // Base de connaissances des besoins associatifs
  const knowledgeBase = {
    "bonjour": "Bonjour ! Comment puis-je vous aider avec les besoins associatifs aujourd'hui ?",
    "comment poster": "Pour poster un besoin :\n1. Allez dans 'Mes besoins'\n2. Cliquez sur 'Ajouter'\n3. Remplissez les détails\n4. Publiez",
    "types besoins": "Nous acceptons :\n- Nourriture\n- Vêtements\n- Matériel scolaire\n- Produits d'hygiène\n- Bénévolat",
    "urgent": "Pour marquer un besoin comme urgent, sélectionnez 'Urgent' lors de la création. Ces besoins apparaissent en rouge.",
    "contacter": "Pour contacter une association :\n1. Allez sur leur profil\n2. Utilisez le bouton 'Contacter'\n3. Envoyez votre message",
    "statut": "Vous pouvez suivre l'état de votre don dans la section 'Mes contributions'.",
    "remerciement": "Merci pour votre générosité ! Les associations comptent sur des donateurs comme vous.",
    "critères": "Les besoins doivent être :\n- Réels et vérifiables\n- D'intérêt général\n- Non commerciaux",
    "bénévolat": "Pour proposer du bénévolat :\n1. Créez un besoin de type 'Bénévolat'\n2. Décrivez les compétences recherchées\n3. Précisez la durée",
    "livraison": "Les modalités de livraison/don sont à convenir directement avec l'association bénéficiaire.",
  };

  // Questions rapides pertinentes
  const quickQuestions = [
    "Comment poster un besoin ?",
    "Quels types de besoins ?",
    "Marquer un besoin urgent",
    "Comment contacter ?",
    "Proposer du bénévolat"
  ];

  const handleSend = useCallback((text = inputText) => {
    if (!text.trim()) return;
    
    // Ajouter le message de l'utilisateur
    setMessages(prev => [...prev, { text: text, isUser: true }]);
    setIsLoading(true);
    
    // Trouver une réponse adaptée
    const lowerText = text.toLowerCase();
    let response = "Je n'ai pas compris. Voici ce que je peux expliquer :\n" + 
      Object.keys(knowledgeBase).map(q => `- ${q}`).join('\n');
    
    // Vérifier les correspondances
    for (const [keyword, answer] of Object.entries(knowledgeBase)) {
      if (lowerText.includes(keyword)) {
        response = answer;
        break;
      }
    }
    
    // Ajouter la réponse du bot avec un léger délai pour simuler la réflexion
    setTimeout(() => {
      setMessages(prev => [...prev, { text: response, isUser: false }]);
      setIsLoading(false);
    }, 800);
    
    if (text === inputText) setInputText('');
  }, [inputText]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Calcul des initiales pour l'avatar
  const initials = userDetail?.name
    ? userDetail.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'NA';

  const colors = ["#e2eaff", "#DAD4DE", "#BBB4DA", "#7B9DD2", "#70C7C6"];
  const colorIndex = userDetail?.uid ? userDetail.uid.length % colors.length : 0;

  const handleProfilePress = () => {
    router.push('ProfileResto');
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/cover.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={30} color="black" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Assistant FAQ</Text>
          </View>
          
          <TouchableOpacity onPress={handleProfilePress}>
            <View style={[styles.avatar, { backgroundColor: colors[colorIndex] }]}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <View style={styles.messagesWrapper}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={[
                styles.messageContainer, 
                item.isUser ? styles.userContainer : styles.botContainer
              ]}>
                <View style={[
                  styles.messageBubble,
                  item.isUser ? styles.userBubble : styles.botBubble
                ]}>
                  <Text style={[
                    styles.messageText,
                    item.isUser ? styles.userText : styles.botText
                  ]}>
                    {item.text}
                  </Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
          {isLoading && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color="#70C7C6" />
            </View>
          )}
        </View>

        {/* Bottom Section: Quick Questions + Input */}
        <View style={styles.bottomContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.quickQuestionsContainer}
            contentContainerStyle={styles.quickQuestionsContent}
          >
            {quickQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestion}
                onPress={() => handleSend(question)}
              >
                <Text style={styles.quickQuestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Zone de saisie */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Posez votre question..."
              placeholderTextColor="#888"
              onSubmitEditing={() => handleSend()}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
              onPress={() => handleSend()}
              disabled={!inputText.trim()}
            >
              <MaterialIcons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    flex: 1,
    
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
  },
  messagesWrapper: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messagesContainer: {
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 8,
  },
  botContainer: {
    alignItems: 'flex-start',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: width * 0.8,
    padding: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userBubble: {
    backgroundColor: '#70C7C6',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botText: {
    color: '#333',
  },
  userText: {
    color: '#fff',
  },
  loadingIndicator: {
    padding: 10,
    alignItems: 'center',
  },
  bottomContainer: {
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  quickQuestionsContainer: {
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  quickQuestionsContent: {
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  quickQuestion: {
    backgroundColor: '#DED8E1',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#bbb',
  },
  quickQuestionText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 100,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#70C7C6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#bbb',
  },
});

export default FAQ;