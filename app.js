const express = require('express');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const bcrypt = require('bcryptjs'); // Import bcryptjs for password hashing

const app = express();

// Initialize Firebase Admin SDK
const serviceAccount = require("./key2.json");
initializeApp({
  credential: cert(serviceAccount)
});

// Get Firebase Firestore instance
const db = getFirestore();

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'views')));

// Middleware to parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

// Route handlers
app.get("/signup", function (req, res) {
  res.render("signup");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/signupsub", async function (req, res) {
  const { email, password } = req.body;
  
  try {
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10); // Hash with salt rounds = 10
  
    // Save the hashed password to the database
    await db.collection("todo").add({
      email: email,
      password: hashedPassword
    });
  
    res.send("Sign up is successful. Go to <a href='/login'>login</a>.");
  } catch (error) {
    console.error("Error adding document: ", error);
    res.status(500).send("Error: Unable to sign up. Please try again later.");
  }
});

app.post("/loginsub", async function (req, res) {
  const { email, password } = req.body;
  
  try {
    const userSnapshot = await db.collection("todo").where("email", "==", email).get();
    
    if (userSnapshot.empty) {
      return res.send("User not found.");
    }
    
    const userData = userSnapshot.docs[0].data();
    const hashedPassword = userData.password;
    
    // Compare the provided password with the hashed password
    const passwordMatch = await bcrypt.compare(password, hashedPassword);
    
    if (passwordMatch) {
      res.render("dashboard");
    } else {
      res.send("Incorrect password.");
    }
  } catch (error) {
    console.error("Error getting user data: ", error);
    res.status(500).send("Error: Unable to login. Please try again later.");
  }
});

// Start the server
const PORT = process.env.PORT || 5000; // Change the port number as needed
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
