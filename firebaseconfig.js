// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyD3rclD0oyA2DWlEsTK4vSM3Pa65871ntU",
    authDomain: "barber-website-55f10.firebaseapp.com",
    databaseURL: "https://barber-website-55f10-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "barber-website-55f10",
    storageBucket: "barber-website-55f10.firebasestorage.app",
    messagingSenderId: "595663207332",
    appId: "1:595663207332:web:6c28bba5118cb9486a9f31",
    measurementId: "G-F0EMZQ01Q7"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Export the database for use in other modules
export { database, ref, get };
