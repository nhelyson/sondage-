// Objet global pour stocker les résultats du sondage
const surveyData = {
  genre: "",
  age: "",
  secteur: "",
  reconnaissance_torts: "",
  promesse_rappel: "",
  compensation: "",
  frequence_panne: "",
  alerte_panne: "",
  canal_prefere: "",
  frustration: "",
  temps_perdu_recherche: "",
  societe_sans_sav: "",
  comportement_deception: "",
  memoire_agence: "",
  interet_app_unique: "",
  acceptation_ia: "",
  ville_residence: "",
  phone: "",
};

let currentStepNum = 0;
const totalSteps = 17; // <-- Passé à 17 étapes

// Tableau pour enregistrer l'historique des étapes parcourues
let stepHistory = [0];

// Démarrer l'enquête
function startSurvey() {
  goToStep(1);
}

// Passer à une étape spécifique
function goToStep(nextStep, isGoingBack = false) {
  currentStepNum = nextStep;

  const nextScreenId =
    currentStepNum === "Merci" ? "stepMerci" : `step${currentStepNum}`;
  const nextScreen = document.getElementById(nextScreenId);

  // Retirer la classe active de tous les écrans
  document.querySelectorAll(".screen").forEach((s) => {
    s.classList.remove("active", "active-back");
  });

  // Appliquer l'animation correspondante
  if (isGoingBack) {
    if (nextScreen) nextScreen.classList.add("active-back");
  } else {
    if (nextScreen) nextScreen.classList.add("active");
    if (stepHistory[stepHistory.length - 1] !== nextStep) {
      stepHistory.push(nextStep);
    }
  }

  // Gérer l'affichage du Header commun
  const header = document.getElementById("appHeader");
  if (header) {
    if (currentStepNum === 0 || currentStepNum === "Merci") {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
      const stepIndicator = document.getElementById("stepIndicator");
      const progressBar = document.getElementById("progressBar");

      // S'adapter dynamiquement selon la version du HTML
      const hasStep17 = document.getElementById("step17") !== null;
      const hasStep16 = document.getElementById("step16") !== null;

      let effectiveTotal = 15; // Par défaut ancien
      if (hasStep17) effectiveTotal = 17;
      else if (hasStep16) effectiveTotal = 16;

      if (stepIndicator) {
        stepIndicator.innerText = `Question ${currentStepNum} / ${effectiveTotal}`;
      }
      if (progressBar) {
        const progressPercent = (currentStepNum / effectiveTotal) * 100;
        progressBar.style.width = `${progressPercent}%`;
      }
    }
  }
}

// Fonction de retour en arrière
function prevStep() {
  if (stepHistory.length > 1) {
    stepHistory.pop();
    const previousStep = stepHistory[stepHistory.length - 1];
    goToStep(previousStep, true);
  }
}

// Enregistrer un choix par clic de bouton standard et passer à l'étape suivante
function selectAndNext(key, value, stepId) {
  surveyData[key] = value;
  console.log(`[DATA STORE UPDATE] Key: ${key} | Captured Text: "${value}"`);

  // Détection dynamique de la fin du formulaire (selon la version du HTML)
  const hasStep17 = document.getElementById("step17") !== null;
  const hasStep16 = document.getElementById("step16") !== null;

  let lastStepOfThisUser = 15;
  if (hasStep17) lastStepOfThisUser = 17;
  else if (hasStep16) lastStepOfThisUser = 16;

  if (stepId < lastStepOfThisUser) {
    goToStep(stepId + 1);
  } else {
    goToStep("Merci");
  }
}

// Traiter et soumettre une réponse écrite sur mesure (Custom Input Text)
function submitCustomAnswer(key, inputId, stepId) {
  const inputEl = document.getElementById(inputId);
  if (!inputEl) return;

  const val = inputEl.value.trim();

  if (!val) {
    alert(
      "Veuillez saisir une réponse ou sélectionner un choix proposé ci-dessus.",
    );
    inputEl.focus();
    return;
  }

  surveyData[key] = val;
  console.log(
    `[DATA STORE UPDATE CUSTOM] Key: ${key} | Written Text: "${val}"`,
  );

  const hasStep17 = document.getElementById("step17") !== null;
  const hasStep16 = document.getElementById("step16") !== null;

  let lastStepOfThisUser = 15;
  if (hasStep17) lastStepOfThisUser = 17;
  else if (hasStep16) lastStepOfThisUser = 16;

  if (stepId < lastStepOfThisUser) {
    goToStep(stepId + 1);
  } else {
    goToStep("Merci");
  }
}

// Validation finale des données et envoi vers MongoDB Atlas
function submitFinalSurvey() {
  const hasStep17 = document.getElementById("step17") !== null;

  if (hasStep17) {
    // Pour le nouveau formulaire à 17 étapes, on valide la ville de résidence
    if (!surveyData.ville_residence) {
      alert("Veuillez indiquer votre ville de résidence avant de valider.");
      return;
    }
  } else {
    // Rétrocompatibilité si un ancien formulaire est utilisé
    if (!surveyData.acceptation_ia) {
      alert("Veuillez répondre à toutes les questions avant de valider.");
      return;
    }
    if (!surveyData.ville_residence) {
      surveyData.ville_residence = "Brazzaville";
    }
  }

  const phoneInput = document.getElementById("user_phone");
  if (!phoneInput) return;

  const phoneVal = phoneInput.value.trim();
  const congoPhoneRegex = /^(04|05|06|22)\d{7}$/;

  if (!phoneVal) {
    alert(
      "Veuillez entrer votre numéro de téléphone pour certifier votre participation.",
    );
    phoneInput.focus();
    return;
  }

  if (!congoPhoneRegex.test(phoneVal)) {
    alert(
      "Format invalide. Veuillez entrer un numéro conforme (ex: 069420972) à 9 chiffres.",
    );
    phoneInput.focus();
    return;
  }

  surveyData.phone = phoneVal;

  console.log("=== SOUMISSION FINALE DU SONDAGE SAV CONGO ===");
  console.log(JSON.stringify(surveyData, null, 2));

  // --- ENVOI DES DONNÉES AU SERVEUR ---
  fetch("/api/survey", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(surveyData),
  })
    .then((response) => {
      // Si le serveur renvoie une erreur 400 (doublon), on extrait quand même le JSON
      if (!response.ok && response.status !== 400) {
        throw new Error("Erreur réseau lors de l'enregistrement");
      }
      return response.json();
    })
    .then((result) => {
      if (result.success) {
        console.log("✅ Données enregistrées dans MongoDB ! ID :", result.id);
        alert(
          "Merci pour votre participation ! Vos réponses ont bien été enregistrées.",
        );
        goToStep("Merci");
      } else if (result.error === "duplicate") {
        // Message d'indication clair en cas de doublon
        alert(
          "⚠️ Désolé, ce numéro de téléphone a déjà été enregistré pour ce sondage. Vous ne pouvez participer qu'une seule fois.",
        );
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
