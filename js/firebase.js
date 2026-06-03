// Firebase Configuration
// =============================================================================
// TO SETUP:
// 1. Go to https://console.firebase.google.com/ and create a project
// 2. Enable Firestore Database (start in test mode, then update security rules)
// 3. Enable Authentication → Sign-in method → Email/Password
// 4. Register a Web app and copy the config object below
// 5. Replace the placeholder values with your actual Firebase config
// =============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyA-MQyFmNOI_hbp-1bpNKQQ0711wJXcyEM",
  authDomain: "ctiers-92384.firebaseapp.com",
  projectId: "ctiers-92384",
  storageBucket: "ctiers-92384.firebasestorage.app",
  messagingSenderId: "480397348755",
  appId: "1:480397348755:web:fc7402bb9258c612092266",
  measurementId: "G-FB206J48Q2"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Firestore collection reference
const PLAYERS_COLLECTION = 'players';

// Admin email - only this email can access the admin dashboard
const ADMIN_EMAIL = 'verynextgenai@gmail.com';

// =============================================================================
// DATA LAYER - Firestore CRUD Operations
// =============================================================================

const PlayerData = {
  async getAll() {
    const snapshot = await db.collection(PLAYERS_COLLECTION)
      .orderBy('points', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getByCategory(category) {
    const all = await this.getAll();
    return all.filter(p => p.tiers && p.tiers[category]);
  },

  async getById(id) {
    const doc = await db.collection(PLAYERS_COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async add(player) {
    const docRef = await db.collection(PLAYERS_COLLECTION).add(player);
    return { id: docRef.id, ...player };
  },

  async update(id, player) {
    await db.collection(PLAYERS_COLLECTION).doc(id).update(player);
  },

  async delete(id) {
    await db.collection(PLAYERS_COLLECTION).doc(id).delete();
  },

  async search(query) {
    const all = await this.getAll();
    const q = query.toLowerCase();
    return all.filter(p =>
      p.username && p.username.toLowerCase().includes(q)
    );
  }
};
