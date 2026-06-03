// Authentication Module
// Handles Firebase Email/Password authentication and admin access control

const Auth = {
  async login(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  },

  async logout() {
    return auth.signOut();
  },

  onAuthChanged(callback) {
    auth.onAuthStateChanged(callback);
  },

  getCurrentUser() {
    return auth.currentUser;
  },

  isAdmin(email) {
    return email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  },

  async requireAdmin() {
    return new Promise((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        if (user && this.isAdmin(user.email)) {
          resolve(user);
        } else {
          reject(new Error('Access denied: admin only'));
        }
      });
    });
  }
};
