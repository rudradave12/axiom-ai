const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyDSnyuKsqTsnqWk5CZ7OI_BztHgoHd0YZU",
  authDomain: "axiom-96f84.firebaseapp.com",
  projectId: "axiom-96f84",
  storageBucket: "axiom-96f84.firebasestorage.app",
  messagingSenderId: "983072681655",
  appId: "1:983072681655:web:185b973822c42df5b92732"
};

console.log("Initializing firebase with config:", JSON.stringify(firebaseConfig, null, 2));

try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  console.log("Attempting guest login...");
  signInAnonymously(auth)
    .then((userCredential) => {
      console.log("Success! Guest User UID:", userCredential.user.uid);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Failed guest login!");
      console.error("Code:", err.code);
      console.error("Message:", err.message);
      process.exit(1);
    });
} catch (err) {
  console.error("Error during initialization:", err);
  process.exit(1);
}
