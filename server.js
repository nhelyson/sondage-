const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

// 1. CONNEXION À MONGODB
// Remplace la chaîne ci-dessous par la tienne si nécessaire, et ajoute un nom de base (ex: /sondage) juste avant le '?'
const MONGO_URI =
  "mongodb+srv://user_db:ikoule%40400@cluster0.t8abrog.mongodb.net/sondage?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("🔌 Connecté avec succès à MongoDB Atlas !"))
  .catch((err) => console.error("❌ Erreur de connexion à MongoDB :", err));

// 2. DÉFINITION DU SCHÉMA (La structure de tes données)
// MongoDB génère automatiquement un ID unique (nommé _id), donc plus besoin du module 'crypto' !
const SurveySchema = new mongoose.Schema(
  {
    submittedAt: { type: Date, default: Date.now },
  },
  { strict: false },
); // 'strict: false' permet d'accepter n'importe quelle structure de données envoyée par le formulaire

const Survey = mongoose.model("Response", SurveySchema);

// 3. MIDDLEWARES
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// 4. ROUTE POUR RECEVOIR ET ENREGISTRER LES RÉPONSES
app.post("/api/survey", async (req, res) => {
  try {
    const newResponse = new Survey(req.body);

    // Sauvegarde dans la base de données MongoDB
    const savedResponse = await newResponse.save();

    console.log(
      `✅ Nouvelle réponse enregistrée dans MongoDB. ID : ${savedResponse._id}`,
    );

    // On renvoie l'ID généré par MongoDB au frontend
    res.status(200).json({ success: true, id: savedResponse._id });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement :", error);
    res.status(500).json({
      error: "Erreur lors de l'enregistrement dans la base de données.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
