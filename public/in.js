// Objet global pour stocker les résultats du sondage
const surveyData = {
  genre: "",
  age: "",
  secteur: "",
  reconnaissance_torts: "",
  promesse_rappel: "",
  compensation: "",
  frequence_panne: "",
  canal_prefere: "",
  frustration: "",
  temps_perdu_recherche: "",
  societe_sans_sav: "",
  comportement_deception: "",
  memoire_agence: "",
  interet_app_unique: "",
  acceptation_ia: "",
  phone: "",
};

let currentStepNum = 0;
const totalSteps = 15;

// Tableau pour enregistrer l'historique des étapes parcourues
let stepHistory = [0];

// Démarrer l'enquête
function startSurvey() {
  goToStep(1);
}

// Passer à une étape spécifique
function goToStep(nextStep, isGoingBack = false) {
  // Sélectionner l'écran actuel et le prochain écran
  const currentScreen = document.getElementById(
    `step${currentStepNum === "Merci" ? "Merci" : currentStepNum}`,
  );

  // Mettre à jour l'index actuel
  currentStepNum = nextStep;

  const nextScreenId =
    currentStepNum === "Merci" ? "stepMerci" : `step${currentStepNum}`;
  const nextScreen = document.getElementById(nextScreenId);

  // Retirer la classe active de tous les écrans
  document.querySelectorAll(".screen").forEach((s) => {
    s.classList.remove("active", "active-back");
  });

  // Appliquer l'animation correspondante (droite-gauche ou gauche-droite)
  if (isGoingBack) {
    nextScreen.classList.add("active-back");
  } else {
    nextScreen.classList.add("active");
    // Enregistrer dans l'historique si on avance
    if (stepHistory[stepHistory.length - 1] !== nextStep) {
      stepHistory.push(nextStep);
    }
  }

  // Gérer l'affichage du Header commun
  const header = document.getElementById("appHeader");
  if (currentStepNum === 0 || currentStepNum === "Merci") {
    header.classList.add("hidden");
  } else {
    header.classList.remove("hidden");
    // Mettre à jour les indicateurs visuels du header
    document.getElementById("stepIndicator").innerText =
      `Question ${currentStepNum} / ${totalSteps}`;
    const progressPercent = (currentStepNum / totalSteps) * 100;
    document.getElementById("progressBar").style.width = `${progressPercent}%`;
  }
}

// Fonction de retour en arrière
function prevStep() {
  if (stepHistory[stepHistory.length > 1] || stepHistory.length === 1) {
    // Retirer l'étape actuelle de l'historique
    stepHistory.pop();
    // Récupérer l'étape précédente
    const previousStep = stepHistory[stepHistory.length - 1];
    goToStep(previousStep, true);
  }
}

// Enregistrer un choix par clic de bouton standard et passer à l'étape suivante
function selectAndNext(key, value, stepId) {
  surveyData[key] = value;

  // Progression logique
  if (stepId < totalSteps) {
    goToStep(stepId + 1);
  } else if (stepId === totalSteps) {
    // Si c'est l'étape 15 mais sans le champ téléphone final, on gère la transition
    goToStep("Merci");
  }
}

// Traiter et soumettre une réponse écrite sur mesure (Custom Input Text)
function submitCustomAnswer(key, inputId, stepId) {
  const inputEl = document.getElementById(inputId);
  const val = inputEl.value.trim();

  if (!val) {
    alert(
      "Veuillez saisir une réponse ou sélectionner un choix proposé ci-dessus.",
    );
    inputEl.focus();
    return;
  }

  surveyData[key] = val; // Stockage de l'avis personnalisé écrit

  if (stepId < totalSteps) {
    goToStep(stepId + 1);
  } else if (stepId === totalSteps) {
    goToStep("Merci");
  }
}

// Validation finale des données et envoi vers MongoDB Atlas
function submitFinalSurvey() {
  const phoneInput = document.getElementById("user_phone");
  const phoneVal = phoneInput.value.trim();

  if (!phoneVal || phoneVal.length < 7) {
    alert(
      "Veuillez entrer un numéro de téléphone valide pour certifier votre participation.",
    );
    phoneInput.focus();
    return;
  }

  surveyData.phone = phoneVal;

  // Affichage console final avant envoi
  console.log("=== SOUMISSION FINALE DU SONDAGE SAV CONGO ===");
  console.log(JSON.stringify(surveyData, null, 2));

  // --- ENVOI DES DONNÉES AU SERVEUR NODE.JS ---
  fetch("/api/survey", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(surveyData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur réseau lors de l'enregistrement");
      }
      return response.json();
    })
    .then((result) => {
      if (result.success) {
        console.log("✅ Données enregistrées dans MongoDB ! ID :", result.id);

        // On bascule proprement l'utilisateur sur l'écran de remerciement
        goToStep("Merci");
      } else {
        alert("Une erreur est survenue sur le serveur lors de la sauvegarde.");
      }
    })
    .catch((error) => {
      console.error("❌ Erreur lors de la requête POST :", error);
      alert(
        "Impossible de joindre le serveur. Vos données n'ont pas pu être sauvegardées.",
      );
    });
}
