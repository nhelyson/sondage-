const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

// 1. CONNEXION À MONGODB
const MONGO_URI =
  "mongodb+srv://user_db:ikoule%40400@cluster0.t8abrog.mongodb.net/sondage?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("🔌 Connecté avec succès à MongoDB Atlas !"))
  .catch((err) => console.error("❌ Erreur de connexion à MongoDB :", err));

// 2. DÉFINITION DU SCHÉMA (La structure de tes données)
const SurveySchema = new mongoose.Schema(
  {
    submittedAt: { type: Date, default: Date.now },
    // AJOUT UNIQUEMENT : Index unique pour bloquer les doublons de numéros
    phone: { type: String, unique: true, sparse: true },
  },
  { strict: false },
);

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
    // AJOUT UNIQUEMENT : Interception de l'erreur de doublon MongoDB (code 11000)
    if (error.code === 11000) {
      console.warn(`⚠️ Numéro en doublon refusé : ${req.body.phone}`);
      return res.status(400).json({
        success: false,
        error: "duplicate",
        message: "Ce numéro de téléphone a déjà été utilisé.",
      });
    }

    console.error("Erreur lors de l'enregistrement :", error);
    res.status(500).json({
      error: "Erreur lors de l'enregistrement dans la base de données.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
