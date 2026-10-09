/* DostBattle - Firebase room connection */
(function () {
  "use strict";

  const config = {
    apiKey: "AIzaSyB5Ufrk6LsNx0zAKh6lDwnNvUjpBl6_eto",
    authDomain: "dostbattle.firebaseapp.com",
    databaseURL: "https://dostbattle-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "dostbattle",
    storageBucket: "dostbattle.firebasestorage.app",
    messagingSenderId: "227013997466",
    appId: "1:227013997466:web:32f892acd884682c89c023"
  };

  let db, user, myRoom = "";

  function note(message) {
    const el = document.getElementById("roomDemoNote");
    if (el) el.textContent = message;
  }

  function loadFirebase(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Firebase load failed"));
      document.head.appendChild(script);
    });
  }

  async function setup() {
    try {
      await loadFirebase(
        "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"
      );
      await loadFirebase(
        "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"
      );
      await loadFirebase(
        "https://www.gstatic.com/firebasejs/10.14.1/firebase-database-compat.js"
      );

      if (!firebase.apps.length) firebase.initializeApp(config);
      await firebase.auth().signInAnonymously();
      user = firebase.auth().currentUser;
      db = firebase.database();

      window.DostBattleMultiplayer = {
        ready: true,
        status: () => "Firebase connected"
      };
      console.log("DostBattle Firebase connected");
      note("Firebase connected. Room banane ya join karne ki koshish karo.");
    } catch (error) {
      console.error(error);
      note("Connection nahi hua. Internet aur Firebase settings check karo.");
    }
  }

  async function createRoom() {
    if (typeof getPlayer === "function" && !getPlayer()) return;
    if (!db || !user) {
      note("Firebase connect ho raha hai. Thodi der baad dobara try karo.");
      return;
    }

    try {
      myRoom = "DB-" + Math.floor(1000 + Math.random() * 9000);
      const roomRef = db.ref("rooms/" + myRoom);

      await roomRef.set({
        hostUid: user.uid,
        status: "waiting",
        createdAt: Date.now(),
        players: {
          [user.uid]: {
            name: document.getElementById("playerName").value.trim(),
            score: 0
          }
        }
      });

      document.getElementById("roomCode").textContent = myRoom;
      document.getElementById("joinCode").value = "";
      if (typeof show === "function") show("room");
      note("Online room ban gaya! Code dost ko share karo.");
    } catch (error) {
      console.error(error);
      note("Room nahi bana. Firebase Database Rules check karo.");
    }
  }

  async function joinRoom() {
    if (typeof getPlayer === "function" && !getPlayer()) return;
    if (!db || !user) {
      note("Firebase connect ho raha hai. Thodi der baad try karo.");
      return;
    }

    const code = document.getElementById("joinCode").value.trim().toUpperCase();
    if (!/^DB-\d{4}$/.test(code)) {
      note("Sahi room code daalo, jaise DB-1234.");
      return;
    }

    try {
      const roomRef = db.ref("rooms/" + code);
      const snap = await roomRef.once("value");

      if (!snap.exists()) {
        note("Yeh room nahi mila. Code dobara check karo.");
        return;
      }

      await roomRef.child("players/" + user.uid).set({
        name: document.getElementById("playerName").value.trim(),
        score: 0
      });

      myRoom = code;
      document.getElementById("roomCode").textContent = code;
      if (typeof show === "function") show("room");

      roomRef.child("players").on("value", snapshot => {
        const players = snapshot.val() || {};
        const names = Object.values(players).map(p => p.name).join(", ");
        note("Room connected! Players: " + names +
          ". Quiz abhi har device par alag chalega.");
      });
    } catch (error) {
      console.error(error);
      note("Join nahi hua. Firebase Rules aur room code check karo.");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const createBtn = document.getElementById("makeRoom");
    const joinBtn = document.getElementById("submitJoin");

    if (createBtn) createBtn.onclick = createRoom;
    if (joinBtn) joinBtn.onclick = joinRoom;
    setup();
  });
})();

