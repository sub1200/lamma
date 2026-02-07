/**
 * Firebase Configuration (Compat Version for File// protocol support)
 */

// Define config globally
const firebaseConfig = {
    apiKey: "AIzaSyDw1A2Zo1aM5OCWdBjkbGvs-AheQrkhvy4",
    authDomain: "lamma-7f0bf.firebaseapp.com",
    projectId: "lamma-7f0bf",
    storageBucket: "lamma-7f0bf.firebasestorage.app",
    messagingSenderId: "264778331501",
    appId: "1:264778331501:web:eb8512589738fbb1a89664"
};

// Initialize only if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Export globals for other scripts
window.auth = firebase.auth();
window.firestore = firebase.firestore();
window.storage = firebase.storage();
