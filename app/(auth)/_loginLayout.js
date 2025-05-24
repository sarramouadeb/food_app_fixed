import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: "#DED8E1",
  },
  login: {
    width: width * 0.9,
    height: height * 0.4,
    resizeMode: "cover",
    marginTop: height * 0,
    marginLeft:-width*0.1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
  position: 'absolute',
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.4)', // Blanc semi-transparent
},
  wlc: {
    fontSize: width * 0.1,
    marginLeft:width*0.22,
    fontWeight: 'bold',
    color: "black",
  },
  inscri: {
    fontSize: width * 0.09,
    color: "black",
    marginTop: 5,
    textAlign:"center"
  },
  text: {
    marginBottom: height * 0.1,
  marginTop:-height*0.1,
  },
  inputContainerMail: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DED8E1",
    paddingHorizontal: 10,
    borderRadius: 10,
    width: width * 0.8,
    height: 50,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    elevation: 5,
    marginBottom: height * 0.02, 
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingLeft: 20,
    color: "gray",
  },
  form: {
    width: "100%",
    alignItems: "center",
  },
  checkboxContainerLogin: {
    flexDirection: "row",
    alignItems: "center",
    width: width * 0.8,
    marginBottom: height * 0.02, 
    marginRight:width*0.04,
    
  },
  Rappeler:{
    marginRight:width*0.05,
    paddingLeft:width*0.01,
  },
  signInButton: {
    backgroundColor: "#D7D7D7",
    width: width * 0.8,
    justifyContent: "center",
    alignItems: "center",
   marginLeft:width*0.05,
    marginBottom: height * 0.02, 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 5,
    height:50,
  },
  textUnderButton: {
    marginBottom: height * 0.02,
    marginLeft:width*0.1,
  },
  errorMessageContainer: {
    backgroundColor: "#ffebee",
    padding: 10,
    borderRadius: 5,
    marginBottom: height * 0.02,
  },
  errorMessageText: {
    color: "#c62828",
    fontSize: 14,
    textAlign: "center",
  },
  successMessageContainer: {
    backgroundColor: "#d4edda",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#c3e6cb",
    marginBottom: height * 0.02, 
  },
  successMessageText: {
    color: "#155724",
    textAlign: "center",
  },
  linkText:{
    color:"pink",
    fontWeight:"bold",
  },
  signUpButtonText:{
    fontWeight:'bold',
    fontSize:18,
    alignContent:"center"
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)', 
    padding: 20,
    
    justifyContent: 'center',
  },

});

export default loginStyles;