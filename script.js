let currentStep = 0,
selectedNature = "",
selectedBatiment = "",
victimsSelected = false;

const OTHER_INTERVENTION_LEGACY_MAP = {
  "Fuite de Gaz procédure classique": "Fuite de gaz procédure classique",
  "Fuite de Gaz procédure renforcée": "Fuite de gaz procédure renforcée"
};

const BUILDING_CONTEXT_INTERVENTIONS = new Set([
  "Feu de bâtiment",
  "Fuite de gaz procédure classique",
  "Fuite de gaz procédure renforcée",
  "Fumée suspecte",
  "Odeur de brulé",
  "Feu de cheminée",
  "Autre type de feu",
  "Déclenchement alarme",
  "Intoxication au monoxyde de carbone (CO)",
  "Personne bloquée dans un ascenseur"
]);

const FIRE_BUILDING_INTERVENTIONS = new Set([
  "Feu de bâtiment",
  "Fumée suspecte",
  "Odeur de brulé",
  "Feu de cheminée",
  "Autre type de feu"
]);

const VICTIME_TYPES = ["UA", "UR", "DCD", "incarcerees", "intoxiquees", "indemnes", "impliques"];

const MOYENS_POMPIERS_IDS = ["VSAV", "FPT", "FPTSR", "VSR", "EPA", "CCF", "CCFS", "CCGC", "VID", "chefGroupe", "SMUR", "ISP", "vehiculeSpecifique"];
const MOYENS_DEPART_IDS = ["VSAVDepart", "FPTDepart", "FPTSRDepart", "VSRDepart", "EPADepart", "VIDDepart", "chefGroupeDepart", "SMURDepart", "ISPDepart", "vehiculeSpecifiqueDepart"];

const VICTIME_CARD_LABELS = {
  UA: "Victime UA",
  UR: "Victime UR",
  DCD: "Victime DCD",
  incarcerees: "Victime incarcérée",
  intoxiquees: "Victime intoxiquée",
  indemnes: "Victime indemne",
  impliques: "Victime impliquée"
};

const victimCardState = {};

function normalizeInterventionValue(value) {
  return OTHER_INTERVENTION_LEGACY_MAP[value] || value;
}

function isBuildingContextIntervention(value) {
  return BUILDING_CONTEXT_INTERVENTIONS.has(normalizeInterventionValue(value));
}

function isFireBuildingIntervention(value) {
  return FIRE_BUILDING_INTERVENTIONS.has(normalizeInterventionValue(value));
}

function formatNatureLine(value) {
  const normalizedValue = normalizeInterventionValue(value);

  switch (normalizedValue) {
    case "AVP":
      return "Un AVP";
    case "Feu de véhicule":
      return "Un feu de véhicule";
    case "Feu de bâtiment":
      return "Un feu de bâtiment";
    case "Chute de ligne électrique":
      return "Une chute de ligne électrique";
    case "Fuite de gaz procédure classique":
      return "Une fuite de gaz procédure classique";
    case "Fuite de gaz procédure renforcée":
      return "Une fuite de gaz procédure renforcée";
    case "Fumée suspecte":
      return "Une fumée suspecte";
    case "Odeur de brulé":
      return "Une odeur de brulé";
    case "Feu de cheminée":
      return "Un feu de cheminée";
    case "Déclenchement alarme":
      return "Un déclenchement d'alarme";
    case "Intoxication au monoxyde de carbone (CO)":
      return "Une intoxication au monoxyde de carbone (CO)";
    case "Personne bloquée dans un ascenseur":
      return "Une personne bloquée dans un ascenseur";
    case "Autre type de feu":
      return "Un autre type de feu";
    default:
      return normalizedValue ? `Intervention : ${normalizedValue}` : "";
  }
}

function configureBuildingFieldsForIntervention(value) {
  const normalizedValue = normalizeInterventionValue(value);
  const includeFireSpecificFields = isFireBuildingIntervention(normalizedValue);
  const niveauSinistreLabel = document.getElementById("niveauSinistreLabel");
  const surfaceSinistreeSection = document.getElementById("surfaceSinistreeSection");
  const propagationBatimentSection = document.getElementById("propagationBatimentSection");
  const evolutionFeuBatimentSection = document.getElementById("evolutionFeuBatimentSection");

  if (niveauSinistreLabel) {
    if (normalizedValue === "Personne bloquée dans un ascenseur") {
      niveauSinistreLabel.textContent = "Préciser l'étage concerné";
    } else if (includeFireSpecificFields) {
      niveauSinistreLabel.textContent = "Préciser le niveau sinistré";
    } else {
      niveauSinistreLabel.textContent = "Préciser le niveau concerné";
    }
  }

  [surfaceSinistreeSection, propagationBatimentSection, evolutionFeuBatimentSection].forEach(section => {
    if (section) {
      section.classList.toggle("hidden", !includeFireSpecificFields);
    }
  });
}

function getVictimeCardLabel(id) {
  return VICTIME_CARD_LABELS[id] || "Victime";
}

function getVictimeTypeLabel(id) {
  const label = getVictimeCardLabel(id);
  return label.startsWith("Victime ") ? label.substring(8).trim() : label;
}

function getVictimeDetails(victimeId) {
  return {
    sexe: document.getElementById(`${victimeId}-sexe`)?.value || "",
    age: document.getElementById(`${victimeId}-age`)?.value || "",
    ageUnit: document.getElementById(`${victimeId}-age-unit`)?.value || "ans"
  };
}

function formatVictimeAge(age, ageUnit = "ans") {
  if (!age) {
    return "";
  }

  if (ageUnit === "mois") {
    return `${age} mois`;
  }

  return `${age} ${age === "1" ? "an" : "ans"}`;
}

function getVictimeCompletionState(victimeId) {
  const { sexe, age } = getVictimeDetails(victimeId);

  if (sexe && age) {
    return "complete";
  }

  if (sexe || age) {
    return "partial";
  }

  return "empty";
}

function getVictimeSummary(victimeId) {
  const { sexe, age, ageUnit } = getVictimeDetails(victimeId);
  const parts = [];

  if (sexe === "M") {
    parts.push("VSM");
  } else if (sexe === "F") {
    parts.push("VSF");
  }

  if (age) {
    parts.push(formatVictimeAge(age, ageUnit));
  }

  return parts.length > 0 ? parts.join(" · ") : "";
}

function parseVictimeId(victimeId) {
  const separatorIndex = victimeId.lastIndexOf("-");

  return {
    typeId: separatorIndex === -1 ? victimeId : victimeId.slice(0, separatorIndex),
    index: separatorIndex === -1 ? "" : victimeId.slice(separatorIndex + 1)
  };
}

function formatVictimeCardTitle(victimeId) {
  const { typeId, index } = parseVictimeId(victimeId);
  const baseTitle = `${getVictimeTypeLabel(typeId)} ${index}`.trim();
  const summary = getVictimeSummary(victimeId);

  return summary ? `${baseTitle} · ${summary}` : baseTitle;
}

function getVictimeDetailedSummary(typeId, index) {
  const { sexe, age, ageUnit } = getVictimeDetails(`${typeId}-${index}`);

  if (!sexe && !age) {
    return "";
  }

  const parts = ["1"];

  if (sexe === "M") {
    parts.push("VSM");
  } else if (sexe === "F") {
    parts.push("VSF");
  } else {
    parts.push("Victime");
  }

  parts.push(getVictimeTypeLabel(typeId));

  if (age) {
    parts.push(formatVictimeAge(age, ageUnit));
  }

  return parts.join(" ");
}

function formatVictimeTitleSummaryItem(summaryItem) {
  return summaryItem.replace(/\bVictimes?\b\s*/g, "").replace(/\s{2,}/g, " ").trim();
}

function collectVictimeSummaryData() {
  const detailMessages = [];
  const countMessages = [];
  let totalVictimes = 0;

  VICTIME_TYPES.forEach(typeId => {
    const count = parseInt(document.getElementById(typeId)?.textContent || "0", 10);

    if (count <= 0) {
      return;
    }

    totalVictimes += count;

    let victimsWithDetails = 0;

    for (let i = 1; i <= count; i++) {
      const detailMessage = getVictimeDetailedSummary(typeId, i);

      if (detailMessage) {
        detailMessages.push(detailMessage);
        victimsWithDetails += 1;
      }
    }

    const victimsWithoutDetails = count - victimsWithDetails;

    if (victimsWithoutDetails > 0) {
      countMessages.push(
        `${victimsWithoutDetails} ${victimsWithoutDetails === 1 ? "Victime" : "Victimes"} ${getVictimeTypeLabel(typeId)}`
      );
    }
  });

  return {
    totalVictimes,
    detailMessages,
    countMessages
  };
}

function formatVictimesTitleSummary() {
  const { totalVictimes, detailMessages, countMessages } = collectVictimeSummaryData();
  const summaryParts = [...detailMessages, ...countMessages].map(formatVictimeTitleSummaryItem);

  return {
    totalVictimes,
    summaryText: summaryParts.join(", ")
  };
}

function hasVictimeDetails(victimeId) {
  const { sexe, age } = getVictimeDetails(victimeId);
  return Boolean(sexe || age);
}

function setVictimeCardCollapsed(victimeId, collapsed) {
  victimCardState[victimeId] = {
    ...victimCardState[victimeId],
    collapsed
  };
}

function updateVictimeCardUI(victimeId) {
  const card = document.querySelector(`.victime-info[data-victime-id="${victimeId}"]`);
  if (!card) {
    return;
  }

  const hasDetails = hasVictimeDetails(victimeId);
  const completionState = getVictimeCompletionState(victimeId);
  const isCollapsed = Boolean(victimCardState[victimeId]?.collapsed && hasDetails);
  const title = card.querySelector(".victime-card-title");
  const detailsContainer = card.querySelector(".victime-card-details");
  const header = card.querySelector(".victime-card-header");

  card.classList.toggle("is-complete", completionState === "complete");
  card.classList.toggle("is-partial", completionState === "partial");
  card.classList.toggle("is-incomplete", completionState === "empty");
  card.classList.toggle("is-collapsed", isCollapsed);

  if (title) {
    title.textContent = formatVictimeCardTitle(victimeId);
  }

  if (detailsContainer) {
    detailsContainer.hidden = isCollapsed;
  }

  if (header) {
    header.setAttribute("aria-expanded", String(!isCollapsed));
  }

  updateVictimesTotalCounter();
}

function focusVictimeCard(victimeId, shouldFocusInput = true) {
  const card = document.querySelector(`.victime-info[data-victime-id="${victimeId}"]`);
  if (!card) {
    return;
  }

  setVictimeCardCollapsed(victimeId, false);
  updateVictimeCardUI(victimeId);

  card.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  if (shouldFocusInput) {
    const { sexe } = getVictimeDetails(victimeId);
    const target = sexe ? card.querySelector(".victime-age-input") : card.querySelector(".sexe-btn");

    if (target) {
      window.setTimeout(() => {
        target.focus();
      }, 180);
    }
  }
}

function collapseCompletedVictimeCards(exceptVictimeId = "") {
  document.querySelectorAll(".victime-info[data-victime-id]").forEach(card => {
    const victimeId = card.dataset.victimeId;
    if (!victimeId || victimeId === exceptVictimeId) {
      return;
    }

    if (hasVictimeDetails(victimeId)) {
      setVictimeCardCollapsed(victimeId, true);
      updateVictimeCardUI(victimeId);
    }
  });
}

function toggleVictimeCard(victimeId) {
  if (!hasVictimeDetails(victimeId)) {
    focusVictimeCard(victimeId);
    return;
  }

  const nextCollapsed = !Boolean(victimCardState[victimeId]?.collapsed);
  setVictimeCardCollapsed(victimeId, nextCollapsed);
  updateVictimeCardUI(victimeId);

  if (!nextCollapsed) {
    focusVictimeCard(victimeId, false);
  }
}

function goToStep(step) {
  document.querySelector(`.step.active`).classList.replace("active", "hidden");
  document.querySelector(`#step${step}`).classList.replace("hidden", "active");
  
  // Mettre à jour la classe active des éléments de progression
  document.querySelectorAll('.progress-step').forEach((el, index) => {
if (index === step) {
  el.classList.add('active');
} else {
  el.classList.remove('active');
}
  });
  
  currentStep = step;
  updateProgress();
  
  // Masquer le bouton Précédent sur l'étape INTER (step 0)
  const prevButton = document.querySelector(`#step${step} .prev-btn`);
  if (prevButton) {
prevButton.style.display = step === 0 ? 'none' : 'block';
  }
  
  // Faire défiler vers le haut de la page
  window.scrollTo({
top: 0,
behavior: 'smooth'
  });
  
  // Si on arrive à l'étape "Je suis" (step 1), vérifier si le motif est AVP
  if (step === 1) {
const motifDepart = document.getElementById('motifDepart').value;
if (motifDepart === 'AVP') {
  updateRouteFields();
}

// Déclencher automatiquement la géolocalisation sur mobile
if (navigator.geolocation) {
  // Vérifier si on est sur mobile (écran tactile et taille d'écran)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                   (window.matchMedia && window.matchMedia("(max-width: 768px)").matches);
  
  if (isMobile) {
    // Attendre un court délai pour que la page soit bien affichée
    setTimeout(() => {
      geolocalise();
    }, 300);
  }
}
  }
  
  // Si on arrive à l'étape "Je vois" (step 2), sélectionner automatiquement le motif de départ
  if (step === 2) {
const motifDepart = normalizeInterventionValue(document.getElementById('motifDepart').value);
    
// Réinitialiser d'abord toutes les sélections
document.querySelectorAll(".nature-toggle").forEach(b => b.classList.remove("selected"));
    
// Sélectionner le bouton approprié en fonction du motif de départ
switch(motifDepart) {
  case 'AVP':
    const avpButton = document.querySelector('.nature-toggle[data-value="AVP"]');
    if (avpButton) {
      selectNature(avpButton);
      // Forcer l'affichage des champs AVP et de l'état de la circulation
      document.getElementById("avpFields").classList.remove("hidden");
      document.getElementById("etatCirculationContainer").classList.remove("hidden");
    }
    break;
  case 'Feu de véhicule':
    const feuVLButton = document.querySelector('.nature-toggle[data-value="Feu de véhicule"]');
    if (feuVLButton) selectNature(feuVLButton);
    break;
  case 'Feu de bâtiment':
    const feuBatButton = document.querySelector('.nature-toggle[data-value="Feu de bâtiment"]');
    if (feuBatButton) selectNature(feuBatButton);
    break;
  case 'Chute de ligne électrique':
  case 'Odeur de brulé':
  case 'Fumée suspecte':
  case 'Fuite de gaz procédure classique':
  case 'Fuite de gaz procédure renforcée':
  case 'Feu de cheminée':
  case 'Déclenchement alarme':
  case 'Intoxication au monoxyde de carbone (CO)':
  case 'Personne bloquée dans un ascenseur':
    const autreButton = document.querySelector('.nature-toggle[data-value="Autre"]');
    if (autreButton) {
      selectNature(autreButton);
      const autreSelect = document.getElementById('autreTypeIntervention');
      if (autreSelect) {
        autreSelect.value = motifDepart;
        handleAutreIntervention(motifDepart);
      }
    }
    break;
  case 'Autre type d\'intervention':
    const autreTypeButton = document.querySelector('.nature-toggle[data-value="Autre"]');
    if (autreTypeButton) {
      selectNature(autreTypeButton);
    }
    break;
}
  }

  // Si on arrive à l'étape des victimes (step 3), activer automatiquement la section
  if (step === 3) {
victimsSelected = true;
  }
  
  if (step === 5) updateSuggestions();
  
  // Si on clique directement sur l'étape "message" (step 6), générer le message
  if (step === 6) {
// Générer le message avant d'afficher l'étape
const messageTextarea = document.getElementById("message");
if (messageTextarea) {
  messageTextarea.value = generateMessage();
  // Ajuster la hauteur du textarea
  setTimeout(() => {
    messageTextarea.style.height = "auto";
    messageTextarea.style.height = messageTextarea.scrollHeight + "px";
  }, 0);
}
  }
}

function updateProgress() {
  document.querySelectorAll(".progress-step").forEach((el, index) => {
el.classList.toggle("active", index === currentStep);
  });
}

function setCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  document.getElementById('groupeHoraireAuto').value = `${hours}:${minutes}`;
  updateMessage();
}

function geolocalise() {
  if (navigator.geolocation) {
navigator.geolocation.getCurrentPosition(pos => {
  let lat = pos.coords.latitude, lon = pos.coords.longitude;
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`)
    .then(r => r.json()).then(d => {
      console.log('Données reçues:', d);
          
      let address = '';
      if (d.address) {
        console.log('Composants d\'adresse:', d.address);
            
        // Construire l'adresse dans l'ordre logique
        if (d.address.isolated_dwelling) {
          address = d.address.isolated_dwelling;
        }
            
        if (d.address.neighbourhood) {
          if (address) address += ', ';
          address += d.address.neighbourhood;
        }
            
        if (d.address.road) {
          if (address) address += ', ';
          address += d.address.road;
        }
            
        // Si nous n'avons toujours pas d'adresse, utiliser le village
        if (!address && d.address.village) {
          address = d.address.village;
        }
            
        console.log('Adresse construite:', address);
            
        // Si aucune adresse n'a pu être construite, utiliser l'adresse complète
        if (!address) {
          address = d.display_name || `Lat:${lat},Lon:${lon}`;
        }
            
        document.querySelector("#adresse").value = address;
            
        // Mettre à jour la commune si elle est disponible
        if (d.address) {
          const commune = d.address.village || d.address.town || d.address.city || d.address.municipality || "";
          if (commune) {
            document.querySelector("#commune").value = commune;
          }
        }
            
        // Afficher les informations GPS
        document.getElementById("gpsInfo").classList.remove("hidden");
        document.getElementById("gpsInfoCommune").classList.remove("hidden");
      }
    })
    .catch(error => {
      console.error('Erreur lors de la géolocalisation:', error);
      document.querySelector("#adresse").value = `Lat:${lat},Lon:${lon}`;
      // Afficher les informations GPS même en cas d'erreur de géocodage
      document.getElementById("gpsInfo").classList.remove("hidden");
      document.getElementById("gpsInfoCommune").classList.remove("hidden");
    });
});
  }
}

// Ajout d'une fonction pour réinitialiser les infos GPS quand l'utilisateur modifie manuellement les champs
function setupGPSInfoReset() {
  ['adresse', 'commune'].forEach(id => {
document.getElementById(id).addEventListener('input', function() {
  document.getElementById("gpsInfo").classList.add("hidden");
  document.getElementById("gpsInfoCommune").classList.add("hidden");
});
  });
}

function increment(id) {
  let i = document.getElementById(id);
  i.value = +i.value + 1;
}

function decrement(id) {
  let i = document.getElementById(id);
  if (+i.value > 0) i.value = +i.value - 1;
}

function selectNature(btn) {
  // Si le bouton est déjà sélectionné, on le désélectionne et on cache tous les champs
  if (btn.classList.contains("selected")) {
btn.classList.remove("selected");
selectedNature = "";
["avpFields", "feuVehiculeFields", "batimentFields", "chuteLigneFields", "autreTypeBox", "etatCirculationContainer"].forEach(id => 
  document.getElementById(id).classList.add("hidden")
);
document.getElementById("infoFuiteGaz").classList.add("hidden");
// Suppression de la ligne suivante
// document.getElementById("selectedNatureTitle").classList.add("hidden");
// Réinitialiser les champs du formulaire
resetFields();
updateSuggestions(); // Mettre à jour les suggestions quand on désélectionne
return;
  }

  // Réinitialiser le select d'autres types d'intervention
  document.getElementById("autreTypeIntervention").value = "";

  document.querySelectorAll(".nature-toggle").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  selectedNature = btn.dataset.value;
  
  // Hide all fields first
  ["avpFields", "feuVehiculeFields", "batimentFields", "chuteLigneFields", "autreTypeBox", "etatCirculationContainer"].forEach(id => 
document.getElementById(id).classList.add("hidden")
  );
  document.getElementById("infoFuiteGaz").classList.add("hidden");
  // Suppression de la ligne suivante
  // document.getElementById("selectedNatureTitle").classList.add("hidden");

  // Show relevant fields based on selection
  if (selectedNature === "AVP") {
document.getElementById("avpFields").classList.remove("hidden");
document.getElementById("etatCirculationContainer").classList.remove("hidden");
updateSuggestions(); // Mettre à jour les suggestions quand AVP est sélectionné
  } else if (selectedNature === "Feu de véhicule") {
document.getElementById("feuVehiculeFields").classList.remove("hidden");
  } else if (selectedNature === "Feu de bâtiment") {
document.getElementById("batimentFields").classList.remove("hidden");
configureBuildingFieldsForIntervention(selectedNature);
  } else if (selectedNature === "Autre") {
document.getElementById("autreTypeBox").classList.remove("hidden");
// Suppression de la ligne suivante
// document.getElementById("selectedNatureTitle").classList.remove("hidden");
  }
}

function handleAutreIntervention(value) {
  const normalizedValue = normalizeInterventionValue(value);
  const autreTypeIntervention = document.getElementById("autreTypeIntervention");

  if (autreTypeIntervention && autreTypeIntervention.value !== normalizedValue) {
    autreTypeIntervention.value = normalizedValue;
  }

  if (!normalizedValue) {
resetFields();
document.getElementById("selectedNatureTitle").classList.add("hidden");
return;
  }

  // Désélectionner tous les boutons de nature sauf "Autre"
  document.querySelectorAll(".nature-toggle").forEach(b => {
if (b.dataset.value !== "Autre") {
  b.classList.remove("selected");
}
  });
  selectedNature = normalizedValue;
  
  // Hide all fields first
  ["avpFields", "feuVehiculeFields", "batimentFields", "chuteLigneFields"].forEach(id => 
document.getElementById(id).classList.add("hidden")
  );
  document.getElementById("infoFuiteGaz").classList.add("hidden");
  document.getElementById("selectedNatureTitle").classList.add("hidden");

  // Show relevant fields based on selection
  if (normalizedValue === "Chute de ligne électrique") {
document.getElementById("chuteLigneFields").classList.remove("hidden");
  } else if (normalizedValue.startsWith("Fuite de gaz")) {
document.getElementById("batimentFields").classList.remove("hidden");
document.getElementById("infoFuiteGaz").classList.remove("hidden");
configureBuildingFieldsForIntervention(normalizedValue);
  } else if (isBuildingContextIntervention(normalizedValue)) {
document.getElementById("batimentFields").classList.remove("hidden");
configureBuildingFieldsForIntervention(normalizedValue);
  }
}

function updateMinusButtonState(id) {
  let minusBtn = document.getElementById(id + "Minus");
  let value = parseInt(document.getElementById(id).textContent);
  if (value === 0) {
minusBtn.classList.add("disabled");
minusBtn.disabled = true;
  } else {
minusBtn.classList.remove("disabled");
minusBtn.disabled = false;
  }
}

// Initialiser l'état des boutons au chargement
window.addEventListener('load', function() {
  // Compteurs de véhicules
  ['vehiculeLeger', 'poidsLourd', 'deuxRoues', 'bus'].forEach(id => {
updateMinusButtonState(id);
updateVehicleDetails(id);
  });
  
  // Compteurs de victimes
  VICTIME_TYPES.forEach(id => {
updateMinusButtonState(id);
  });
  
  // Mettre à jour le compteur total de victimes
  updateVictimesTotalCounter();
  
  // Compteurs de moyens pompiers
  MOYENS_POMPIERS_IDS.forEach(id => {
updateVehicleDetails(id);
updateMinusButtonState(id);
  });
  
  // Compteurs de moyens au départ
  MOYENS_DEPART_IDS.forEach(id => {
updateVehicleDetails(id);
updateMinusButtonState(id);
  });
});

function incrementVehicle(id) {
  const span = document.getElementById(id);
  if (span) {
try {
  const previousValue = parseInt(span.textContent || '0');
  const value = previousValue + 1;
  span.textContent = value;
  updateVehicleDetails(id);
  updateMinusButtonState(id);
  updateVictimesTotalCounter();
  if (VICTIME_TYPES.includes(id)) {
    const victimeId = `${id}-${value}`;
    collapseCompletedVictimeCards(victimeId);
    focusVictimeCard(victimeId);
  }
} catch (error) {
  console.error('Error incrementing vehicle:', error);
}
  }
}

function decrementVehicle(id) {
  const span = document.getElementById(id);
  if (span) {
try {
  const value = parseInt(span.textContent || '0');
  if (value > 0) {
    if (VICTIME_TYPES.includes(id)) {
      delete victimCardState[`${id}-${value}`];
    }
    span.textContent = value - 1;
    updateVehicleDetails(id);
    updateMinusButtonState(id);
    updateVictimesTotalCounter();
  }
} catch (error) {
  console.error('Error decrementing vehicle:', error);
}
  }
}

function updateVehicleDetails(id) {
  let details = document.getElementById(id + "Details");
  let counter = document.getElementById(id);
  let value = parseInt(counter.textContent);
  if (details) {
if (value > 0) {
  details.classList.remove("hidden");
} else {
  details.classList.add("hidden");
}
  }

  const vehicleContainer = counter?.closest('.vehicle-count');
  if (vehicleContainer && counter.closest('#moyensPompiers')) {
    vehicleContainer.classList.toggle('moyen-pompier-active', value > 0);
  }
  
  // Ajouter/mettre à jour les champs de sexe et âge pour les victimes
  if (VICTIME_TYPES.includes(id)) {
updateVictimeInfoFields(id, value);
  }
}

// Fonction pour mettre à jour le compteur total de victimes
function updateVictimesTotalCounter() {
  const { totalVictimes, summaryText } = formatVictimesTitleSummary();
  const totalCounter = document.getElementById("victimesTotalCounter");
  const summaryCard = document.getElementById("victimesSummaryCard");
  const summaryTextElement = document.getElementById("victimesSummaryText");

  if (totalCounter) {
    totalCounter.textContent = totalVictimes;
    totalCounter.hidden = totalVictimes === 0;
  }

  if (summaryCard && summaryTextElement) {
    summaryTextElement.textContent = summaryText;
    summaryCard.classList.toggle("hidden", !summaryText);
  }
}

function toggleDetailsSupplementaires() {
  const details = document.getElementById("detailsSupplementaires");
  const btn = document.getElementById("toggleDetailsBtn");
  const icon = btn.querySelector('.toggle-icon');
  
  details.classList.toggle("hidden");
  btn.classList.toggle("active");
  icon.classList.toggle("rotated");
}

function selectTypeLigne(type) {
  document.querySelectorAll("#typeLigneContainer .toggle-btn").forEach(btn => 
btn.classList.remove("selected")
  );
  document.querySelector(`#typeLigneContainer button[onclick="selectTypeLigne('${type}')"]`).classList.add("selected");
  
  let info = document.getElementById("perimetresInfo");
  if (type === "BT") {
info.innerText = "Rappel des périmètres : zone exclusion = 1m, zone contrôlée = 20m.";
  } else {
info.innerText = "Rappel des périmètres : zone exclusion = 10m, zone contrôlée = 50m.";
  }
  info.classList.remove("hidden");

  // Show/hide RTE button in "Je demande" step
  let rteBtn = document.getElementById("action-RTE");
  if (rteBtn) {
rteBtn.style.display = type === "HTB" ? "block" : "none";
if (type !== "HTB") rteBtn.classList.remove("selected");
  }
}

function selectToggle(fieldId, btn) {
  // Désélectionner tous les boutons du même groupe
  const container = document.getElementById(fieldId + 'Container');
  container.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('selected'));
  
  // Sélectionner le bouton cliqué
  btn.classList.add('selected');
  
  // Mettre à jour la valeur cachée
  document.getElementById(fieldId).value = btn.dataset.value;
  
  // Gérer l'affichage des détails
  const detailsContainer = document.getElementById(fieldId + 'Details');
  if (fieldId.includes('isole')) {
// Pour le cas isolé, on affiche les détails quand "Non" est sélectionné
if (btn.dataset.value === 'Non') {
  detailsContainer.classList.remove('hidden');
} else {
  detailsContainer.classList.add('hidden');
  const inputId = 'precisions' + fieldId.charAt(0).toUpperCase() + fieldId.slice(1);
  document.getElementById(inputId).value = '';
}
  } else {
// Pour les autres cas, on affiche les détails quand "Oui" est sélectionné
if (btn.dataset.value === 'Oui') {
  detailsContainer.classList.remove('hidden');
} else {
  detailsContainer.classList.add('hidden');
  const inputId = 'precisions' + fieldId.charAt(0).toUpperCase() + fieldId.slice(1);
  document.getElementById(inputId).value = '';
}
  }
  
  updateMessage();
}

function selectBatimentType(btn) {
  // Si le bouton est déjà sélectionné, on le désélectionne
  if (btn.classList.contains("selected")) {
btn.classList.remove("selected");
selectedBatiment = "";
document.getElementById("etagesFields").classList.add("hidden");
return;
  }

  // Désélectionner tous les boutons avant de sélectionner le nouveau
  document.querySelectorAll("#typeBatimentContainer .toggle-btn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  selectedBatiment = btn.dataset.value;
  document.getElementById("etagesFields").classList.toggle("hidden", selectedBatiment !== "R+");

  // Réinitialiser les champs d'étages si on passe à "Plain pied"
  if (selectedBatiment === "Plain pied") {
document.getElementById("etagesRPlus").value = "";
document.getElementById("etagesRMoins").value = "";
  }
}

function selectVictimsToggle(show, btn) {
  document.querySelectorAll("#victimsToggleContainer .toggle-btn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  victimsSelected = show;
  document.getElementById("victimsFields").classList.toggle("hidden", !show);
}

function toggleButton(el) {
  el.classList.toggle("selected");
  
  // Si le bouton a un data-target, gérer l'affichage des détails
  const target = el.getAttribute("data-target");
  if (target) {
const details = document.getElementById(target);
if (details) {
  details.classList.toggle("hidden");
}
  }
}

function updateExtinctionFields() {
  document.getElementById("extinctionFields").classList.toggle("hidden",
!document.getElementById("action-extinction").classList.contains("selected"));
}

function updateCamThermiqueField() {
  document.getElementById("camThermiqueContainer").classList.toggle("hidden",
!document.getElementById("action-relevesThermiques").classList.contains("selected"));
}

function updateExplosimetreField() {
  document.getElementById("explosimetreContainer").classList.toggle("hidden",
!document.getElementById("action-relevesExplosimetre").classList.contains("selected"));
}

function updateSuggestions() {
  // Réinitialiser toutes les suggestions
  document.querySelectorAll('.suggestion-tag').forEach(tag => {
tag.classList.add('hidden');
tag.textContent = ''; // Réinitialiser le texte
  });
  
  // Réinitialiser tous les tags "déjà engagé"
  document.querySelectorAll('.engaged-tag').forEach(tag => {
tag.classList.add('hidden');
tag.textContent = '';
  });

  // Vérifier si AVP est sélectionné
  const motifDepart = document.getElementById('motifDepart').value;
  if (motifDepart === 'AVP') {
const dirsoTag = document.getElementById('DIRSOSuggestion');
const gendarmerieTag = document.getElementById('gendarmerieSuggestion');
const policeTag = document.getElementById('policeSuggestion');
    
dirsoTag.textContent = 'Suggéré';
gendarmerieTag.textContent = 'Suggéré';
policeTag.textContent = 'Suggéré';
    
dirsoTag.classList.remove('hidden');
gendarmerieTag.classList.remove('hidden');
policeTag.classList.remove('hidden');
  }

  // Récupérer le nombre de victimes
  const UA = parseInt(document.getElementById('UA').textContent) || 0;
  const UR = parseInt(document.getElementById('UR').textContent) || 0;
  const DCD = parseInt(document.getElementById('DCD').textContent) || 0;
  
  // Vérifier s'il y a des victimes pour le SMUR
  if (UA > 0 || UR > 0 || DCD > 0) {
const smurTag = document.getElementById('SMURSuggestion');
smurTag.textContent = 'Suggéré';
smurTag.classList.remove('hidden');
  }

  // Vérifier si c'est une chute de ligne HTB
  const autreTypeIntervention = document.getElementById('autreTypeIntervention').value;
  const typeLigne = document.querySelector('#typeLigneContainer .toggle-btn.selected')?.textContent;
  if (autreTypeIntervention === 'Chute de ligne électrique' && typeLigne === 'HTB') {
const rteTag = document.getElementById('RTESuggestion');
rteTag.textContent = 'Suggéré';
rteTag.classList.remove('hidden');
  }

  // Récupérer les valeurs de tous les moyens pompiers
  const vsavCount = parseInt(document.getElementById('VSAV').textContent) || 0;
  const fptCount = parseInt(document.getElementById('FPT').textContent) || 0;
  const epaCount = parseInt(document.getElementById('EPA').textContent) || 0;
  const vidCount = parseInt(document.getElementById('VID').textContent) || 0;
  const chefGroupeCount = parseInt(document.getElementById('chefGroupe').textContent) || 0;
  const ispCount = parseInt(document.getElementById('ISP').textContent) || 0;
  const vehiculeSpecifiqueCount = parseInt(document.getElementById('vehiculeSpecifique').textContent) || 0;

  // Calculer le nombre de VSAV suggérés
  const vsavTag = document.getElementById('VSAVSuggestion');
  const uaPlusUr = UA + UR; // 1 VSAV par victime UA ou UR
  if (uaPlusUr > 0) {
vsavTag.textContent = `${uaPlusUr} suggéré(s)`;
vsavTag.classList.remove('hidden');
  } else if (UA > 0) {
// Toujours suggérer au moins 1 VSAV si UA > 0
vsavTag.textContent = '1 suggéré';
vsavTag.classList.remove('hidden');
  }

  // Mettre à jour les autres moyens pompiers
  const fptTag = document.getElementById('FPTSuggestion');
  const epaTag = document.getElementById('EPASuggestion');
  const chefGroupeTag = document.getElementById('chefGroupeSuggestion');
  const vehiculeSpecifiqueTag = document.getElementById('vehiculeSpecifiqueSuggestion');

  // Logique pour l'EPA - uniquement pour bâtiment R+2 ou plus
  const selectedBatiment = document.querySelector('#typeBatimentContainer .toggle-btn.selected')?.dataset.value;
  const rPlusCount = parseInt(document.getElementById('RPlus').textContent) || 0;
  if (selectedBatiment === 'R+' && rPlusCount >= 2) {
epaTag.textContent = '1 suggéré';
epaTag.classList.remove('hidden');
  }

  // Logique pour le FPT - uniquement si surface > 200m² et feu
  const surface = parseInt(document.getElementById('surfaceSinistree').value) || 0;
  const natureBtn = document.querySelector('.nature-toggle.selected');
  const nature = natureBtn?.dataset.value || '';
  const autreNature = document.getElementById('autreTypeIntervention').value;
  // Si "Autre" est sélectionné, utiliser la valeur de autreTypeIntervention
  const typeIntervention = (nature === "Autre") ? autreNature : (nature || autreNature);
  
  // Vérifier si c'est un feu et si la surface est > 200m²
  if (surface > 200 && (
typeIntervention === 'Feu de bâtiment' || 
typeIntervention === 'Feu de véhicule' ||
typeIntervention === 'Autre type de feu' ||
typeIntervention === 'Fumée suspecte' ||
typeIntervention === 'Odeur de brulé'
  )) {
if (fptCount > 0) {
  fptTag.textContent = `${fptCount} suggéré(s)`;
} else {
  fptTag.textContent = 'Suggéré';
}
fptTag.classList.remove('hidden');
  }

  // Ne suggérer le chef de groupe que s'il y a plus de 2 véhicules pompiers
  const totalVehiculesPompiers = fptCount + epaCount + vsavCount + vidCount + chefGroupeCount + ispCount;
  if (totalVehiculesPompiers > 2) {
if (chefGroupeCount > 0) {
  chefGroupeTag.textContent = `${chefGroupeCount} suggéré(s)`;
} else {
  chefGroupeTag.textContent = 'Suggéré';
}
chefGroupeTag.classList.remove('hidden');
  }

  // Ne plus mettre de suggestion par défaut sur renfort spécifique
  if (vehiculeSpecifiqueCount > 0) {
vehiculeSpecifiqueTag.textContent = `${vehiculeSpecifiqueCount} suggéré(s)`;
vehiculeSpecifiqueTag.classList.remove('hidden');
  }

  // Afficher les tags "déjà engagé" pour les moyens au départ
  const moyensEngages = {
'VSAV': 'VSAVDepart',
'FPT': 'FPTDepart',
'FPTSR': 'FPTSRDepart',
'VSR': 'VSRDepart',
'EPA': 'EPADepart',
'VID': 'VIDDepart',
'chefGroupe': 'chefGroupeDepart',
'SMUR': 'SMURDepart',
'ISP': 'ISPDepart',
'vehiculeSpecifique': 'vehiculeSpecifiqueDepart'
  };

  Object.entries(moyensEngages).forEach(([moyen, idDepart]) => {
const countDepart = parseInt(document.getElementById(idDepart)?.textContent || '0');
if (countDepart > 0) {
  const engagedTag = document.getElementById(`${moyen}Engaged`);
  if (engagedTag) {
    engagedTag.textContent = `${countDepart} déjà engagé${countDepart > 1 ? 's' : ''}`;
    engagedTag.classList.remove('hidden');
  }
}
  });
}

function generateMessage() {
  let msg = "[ CODIS, PRENEZ MESSAGE ]\n";
  let getVal = id => document.getElementById(id)?.value || "";
  
  // Intervention info
  if (getVal("groupeHoraireAuto")) msg += `Groupe horaire: ${getVal("groupeHoraireAuto")}\n`;
  if (getVal("interventionNumber")) msg += `Intervention numéro: ${getVal("interventionNumber")}\n`;
  // Suppression de l'affichage de la fonction (CATE ou CDG)
  // if (getVal("fonction")) msg += `Fonction: ${getVal("fonction")}\n`;
  msg += "\n";

  // Location info
  msg += "[ JE SUIS ]\n";
  if (getVal("adresse")) msg += `Adresse: ${getVal("adresse")}\n`;
  if (getVal("adresseConfirmee")) msg += `Adresse confirmée/modifiée: ${getVal("adresseConfirmee")}\n`;
  if (getVal("commune")) msg += `Commune: ${getVal("commune")}\n`;
  if (getVal("typeRoute")) msg += `Type de route: ${getVal("typeRoute")}\n`;
  if (getVal("numeroRoute")) msg += `Numéro de route: ${getVal("numeroRoute")}\n`;
  if (getVal("nomEchangeur")) msg += `Nom de l'échangeur: ${getVal("nomEchangeur")}\n`;
  if (getVal("pk")) msg += `PK: ${getVal("pk")}\n`;
  if (getVal("sens")) msg += `Sens: ${getVal("sens")}\n`;
  msg += "\n";

  // Situation info
  msg += "[ JE VOIS ]\n";
  
  // Get selected nature
  let natureBtn = document.querySelector(".nature-toggle.selected");
  let autreNature = normalizeInterventionValue(getVal("autreTypeIntervention"));
  // Si "Autre" est sélectionné, utiliser la valeur de autreTypeIntervention
  let nature = normalizeInterventionValue((natureBtn && natureBtn.dataset.value === "Autre") ? autreNature : (natureBtn ? natureBtn.dataset.value : autreNature));
  
  if (nature) {
msg += `${formatNatureLine(nature)}\n`;

// AVP specific fields
if (nature === "AVP") {
  msg += "Impliquant:\n";
  let vehicules = ["vehiculeLeger", "poidsLourd", "deuxRoues", "bus"];
  vehicules.forEach(v => {
    let count = document.getElementById(v)?.textContent || "0";
    if (count !== "0") {
      msg += `- ${count} ${v.replace(/([A-Z])/g, ' $1').toLowerCase()}\n`;
      let precisions = getVal(v + "Precisions");
      if (precisions) msg += `  Précisions: ${precisions}\n`;
    }
  });

  let autreVehicule = getVal("autreVehicule");
  if (autreVehicule) msg += `- Autre véhicule: ${autreVehicule}\n`;

  // Détails supplémentaires
  if (!document.getElementById("detailsSupplementaires").classList.contains("hidden")) {
    msg += "\n";
    let typePhase = getVal("typePhase");
    if (typePhase) msg += `Fuite en phase: ${typePhase}\n`;
    if (getVal("localisationFuite")) msg += `Localisation fuite: ${getVal("localisationFuite")}\n`;
    if (getVal("presenceFeu")) msg += `Présence feu sur: ${getVal("presenceFeu")}\n`;
    if (getVal("localisationFeu")) msg += `Localisation feu: ${getVal("localisationFeu")}\n`;
    if (getVal("circonstances")) msg += `Circonstances particulières: ${getVal("circonstances")}\n`;
  }

  // État circulation
  msg += "\n";
  if (getVal("etatCirculation")) msg += `État circulation: ${getVal("etatCirculation")}\n`;
  if (getVal("voiesImpactees")) msg += `Voies impactées: ${getVal("voiesImpactees")}\n`;
  if (getVal("sensCirculation")) msg += `Sens circulation: ${getVal("sensCirculation")}\n`;
}

// Feu de véhicule specific fields
else if (nature === "Feu de véhicule") {
  if (getVal("typeVehicule")) msg += `Type de véhicule: ${getVal("typeVehicule")}\n`;
  if (getVal("energieVehicule")) msg += `Énergie: ${getVal("energieVehicule")}\n`;
      
  let propagation = getVal("propagationVehicule");
  if (propagation) {
    msg += `Risque de propagation: ${propagation}\n`;
    if (propagation === "Oui" && getVal("precisionsPropagationVehicule")) {
      msg += `Précisions propagation: ${getVal("precisionsPropagationVehicule")}\n`;
    }
  }

  let isole = getVal("isoleVehicule");
  if (isole) {
    msg += `Véhicule isolé: ${isole}\n`;
    if (isole === "Oui" && getVal("precisionsIsoleVehicule")) {
      msg += `Précisions environnement: ${getVal("precisionsIsoleVehicule")}\n`;
    }
  }

  if (getVal("risqueSpecifiqueVehicule")) msg += `Risque spécifique: ${getVal("risqueSpecifiqueVehicule")}\n`;
  if (getVal("evolutionFeuVehicule")) msg += `Évolution du feu: ${getVal("evolutionFeuVehicule")}\n`;
  if (getVal("typeVehicule") === "Véhicule poids lourd TMD" && getVal("codeMatiereTMD")) {
    msg += `Code matière TMD: ${getVal("codeMatiereTMD")}\n`;
  }
}

// Building related fields reused by fire, gas, alarm, CO and elevator scenarios
else if (isBuildingContextIntervention(nature)) {
  const includeFireSpecificFields = isFireBuildingIntervention(nature);
  const levelLabel = nature === "Personne bloquée dans un ascenseur" ? "Étage concerné" : (includeFireSpecificFields ? "Niveau sinistré" : "Niveau concerné");
      
  let batimentType = document.querySelector("#typeBatimentContainer .toggle-btn.selected");
  if (batimentType) {
    msg += "Type de bâtiment:\n";
    let typeValue = batimentType.dataset.value;
    msg += typeValue === "R+" ? `Bâtiment : R+\n` : `Bâtiment de : Plain pied\n`;
    if (typeValue === "R+") {
      const rPlus = document.getElementById("RPlus").textContent;
      const rMoins = document.getElementById("RMoins").textContent;
      const niveauSinistre = document.getElementById("niveauSinistre").textContent;
      if (rPlus !== "0") msg += `Nombre d'étages R+: ${rPlus}\n`;
      if (rMoins !== "0") msg += `Nombre d'étages R-: ${rMoins}\n`;
      if (niveauSinistre !== "0") {
        const prefix = parseInt(niveauSinistre) >= 0 ? "R+" : "R";
        msg += `${levelLabel}: ${prefix}${niveauSinistre}\n`;
      }
    }
  }

  if (getVal("usageBatiment")) msg += `Bâtiment à usage de: ${getVal("usageBatiment")}\n`;
  if (getVal("typeBatimentSelect")) msg += `De type: ${getVal("typeBatimentSelect")}\n`;
  if (getVal("structure")) msg += `Structure: ${getVal("structure")}\n`;
  if (getVal("surfaceTotale")) msg += `Surface totale: ${getVal("surfaceTotale")} m²\n`;
  if (includeFireSpecificFields && getVal("surfaceSinistree")) msg += `Surface sinistrée: ${getVal("surfaceSinistree")} m²\n`;

  let isole = getVal("isoleBatiment");
  if (isole) {
msg += `Bâtiment isolé: ${isole}\n`;
    if (isole === "Oui" && getVal("precisionsIsoleBatiment")) {
      msg += `Précisions environnement: ${getVal("precisionsIsoleBatiment")}\n`;
    }
  }

  if (getVal("risqueSpecifiqueBatiment")) msg += `Risque spécifique: ${getVal("risqueSpecifiqueBatiment")}\n`;

  if (includeFireSpecificFields) {
    let propagation = getVal("propagationBatiment");
    if (propagation) {
msg += `Risque de propagation: ${propagation}\n`;
      if (propagation === "Oui" && getVal("precisionsPropagationBatiment")) {
        msg += `Précisions propagation: ${getVal("precisionsPropagationBatiment")}\n`;
      }
    }

    if (getVal("evolutionFeuBatiment")) msg += `Évolution du feu: ${getVal("evolutionFeuBatiment")}\n`;
  }
}

// Chute de ligne électrique specific fields
else if (nature === "Chute de ligne électrique") {
  if (getVal("localisationChute")) msg += `Localisation de la chute: ${getVal("localisationChute")}\n`;
  let typeLigne = document.querySelector("#typeLigneContainer .toggle-btn.selected");
  if (typeLigne) {
    msg += `Type de ligne: ${typeLigne.textContent}\n`;
  }
      
  // Ajouter les détails supplémentaires s'ils sont présents
  if (!document.getElementById("ligneDetailsFields").classList.contains("hidden")) {
    msg += "\n";
    if (getVal("presenceFeuLigne")) msg += `Présence d'un feu sur: ${getVal("presenceFeuLigne")}\n`;
    if (getVal("localisationFeuLigne")) msg += `Localisation du feu: ${getVal("localisationFeuLigne")}\n`;
    if (getVal("circonstancesLigne")) msg += `Circonstances particulières: ${getVal("circonstancesLigne")}\n`;
  }
}
  }
  msg += "\n";

  // Ajouter les prévisions du chef de groupe si présentes
  const fonction = getVal("fonction");
  const prevoisSection = document.getElementById('prevoisSection');
  if (fonction === 'CDG' && prevoisSection && !prevoisSection.classList.contains('hidden')) {
msg += "[ JE PREVOIS ]\n";
document.querySelectorAll('#prevoisActions .toggle-btn.selected').forEach(btn => {
  // Nettoyer le texte de l'action pour supprimer les tags "suggéré"
  const action = btn.textContent.replace(/Suggéré/g, '').trim();
  const target = btn.getAttribute('data-target');
  if (target) {
    const details = document.getElementById(target);
    if (details) {
      msg += `${action}\n`;
      const precisionInput = details.querySelector('input[type="text"]');
      if (precisionInput && precisionInput.value) {
        msg += `Précisions: ${precisionInput.value}\n`;
      }
    }
  } else {
    msg += `${action}\n`;
  }
});
    
// Ajouter les précisions générales si présentes
const precisionsPrevois = getVal("precisionsPrevois");
if (precisionsPrevois) {
  msg += `Précisions supplémentaires: ${precisionsPrevois}\n`;
}
    
msg += "\n";
  }

  // Victimes info
  msg += "[ VICTIMES ]\n";
  const { totalVictimes, detailMessages, countMessages } = collectVictimeSummaryData();

  // Générer le message pour les victimes
  if (totalVictimes > 0) {
// Cas spécial : une seule victime
if (totalVictimes === 1) {
  // Si la victime a des détails, afficher directement les détails
  if (detailMessages.length > 0) {
    msg += detailMessages[0] + "\n";
  } else {
    // Sinon, afficher le type de victime
    if (countMessages.length > 0) {
      msg += countMessages[0] + "\n";
    } else {
      msg += `1 Victime\n`;
    }
  }
} else {
  // Plusieurs victimes : afficher le total avec "au total, dont"
  msg += `${totalVictimes} Victimes au total`;

  // Combiner les détails individuels et les compteurs groupés
  const allMessages = [...countMessages, ...detailMessages];
  if (allMessages.length > 0) {
    msg += `, dont ${allMessages.join(", ")}`;
  }
      
  msg += "\n";
}
  }

  // Ajouter les précisions sur les victimes si présentes
  let precisionVictimes = getVal("precisionVictimes");
  if (precisionVictimes) {
msg += `Précisions sur les victimes: ${precisionVictimes}\n`;
  }
  
  // Toujours ajouter un saut de ligne avant "[ JE FAIS ]" pour l'espacement
  msg += "\n";

  // Actions info
  msg += "[ JE FAIS ]\n";
  
  // Récupérer toutes les actions sélectionnées de tous les conteneurs
  const actionContainers = ['actionsContainer', 'incendieContainer', 'secoursRoutierContainer'];
  actionContainers.forEach(containerId => {
document.querySelectorAll(`#${containerId} .toggle-btn.selected`).forEach(btn => {
  // Nettoyer le texte de l'action pour supprimer les tags "suggéré"
  const action = btn.textContent.replace(/Suggéré/g, '').trim();
  const target = btn.getAttribute('data-target');
      
  // Si l'action a des détails
  if (target) {
    const details = document.getElementById(target);
    if (details) {
      msg += `${action}\n`;
          
      // Pour l'extinction, inclure tous les détails spécifiques
      if (target === 'extinction') {
        const precisions = getVal('preciserExtinction');
        if (precisions) msg += `Précisions: ${precisions}\n`;
        const nbLDV = getVal('nombreLDV');
        if (nbLDV) msg += `${nbLDV} LDV\n`;
        if (getVal('debit')) msg += `Débit: ${getVal('debit')}\n`;
        if (getVal('fourgonAlimente')) msg += `Fourgon alimenté: ${getVal('fourgonAlimente')}\n`;
      }
      // Pour la mise en sécurité
      else if (target === 'miseEnSecurite') {
        const precisions = getVal('preciserMiseEnSecurite');
        if (precisions) msg += `Précisions: ${precisions}\n`;
        const nbPersonnes = getVal('nombrePersonnesMiseEnSecurite');
        if (nbPersonnes) msg += `${nbPersonnes} personnes\n`;
        const pointRassemblement = getVal('pointRassemblement');
        if (pointRassemblement) msg += `Point de rassemblement: ${pointRassemblement}\n`;
      }
      // Pour la prise en charge des victimes
      else if (target === 'priseEnCharge') {
        const precisions = getVal('preciserPriseEnCharge');
        if (precisions) msg += `Précisions: ${precisions}\n`;
        const nbVictimes = getVal('nombreVictimesPriseEnCharge');
        if (nbVictimes) msg += `${nbVictimes} victimes\n`;
        const parEquipage = getVal('parEquipage');
        if (parEquipage) msg += `Par équipage: ${parEquipage}\n`;
      }
      // Pour les autres actions avec précisions
      else {
        const precisionInput = details.querySelector('input[type="text"]');
        if (precisionInput && precisionInput.value) {
          msg += `Précisions: ${precisionInput.value}\n`;
        }
      }
    }
  } else {
    // Actions sans détails (comme Désenfumage, Ventilation, etc.)
    msg += `${action}\n`;
  }
});
  });

  // Ajouter les moyens demandés
  msg += "\n[ JE DEMANDE ]\n";
  const moyensTypes = {
"VSAV": "VSAV",
"FPT": "FPT",
"FPTSR": "FPTSR",
"VSR": "VSR",
"EPA": "EPA",
"CCF": "CCF",
"CCFS": "CCFS",
"CCGC": "CCGC",
"chefGroupe": "Chef de groupe",
"ISP": "ISP",
"vehiculeSpecifique": "Véhicule spécifique"
  };

  Object.entries(moyensTypes).forEach(([id, label]) => {
const count = parseInt(document.getElementById(id)?.textContent || "0");
if (count > 0) {
  if (id === "vehiculeSpecifique") {
    const details = document.getElementById("vehiculeSpecifiqueText");
    if (details && details.value) {
      msg += `${count} ${details.value}\n`;
    } else {
      msg += `${count} ${label}\n`;
    }
  } else {
    msg += `${count} ${label}\n`;
  }
}
  });

  // Ajouter les autres services demandés
  document.querySelectorAll('#autresServices .toggle-btn.selected').forEach(btn => {
// Extraire uniquement le texte principal du bouton, sans les tags de suggestion
const buttonText = btn.textContent.replace(/Suggéré/g, '').trim();
msg += `${buttonText}\n`;
  });

  msg += "\n[ FIN DE MESSAGE, COMMENT REÇU PARLEZ. ]";
  
  // Retourner le message au lieu d'aller directement à l'étape 6
  return msg;
}

function copyMessage() {
  let msg = document.getElementById("message").value;
  // Convertir le texte brut en texte brut
  msg = msg.replace(/\n/g, '\n')
       .replace(/<br>/g, '\n')
       .replace(/<b>/g, '')
       .replace(/<\/b>/g, '')
       .replace(/<i>/g, '')
       .replace(/<\/i>/g, '');
  navigator.clipboard.writeText(msg);
  alert("Message copié !");
}

function shareApplication() {
  const url = 'https://firetechdev.github.io/';
  const title = 'MRP - Message Radio Pompier';
  const text = 'Découvrez MRP, l\'application pour générer rapidement des messages radio pour les pompiers.';

  // Utiliser l'API Web Share si disponible (iOS/Android)
  if (navigator.share) {
navigator.share({
  title: title,
  text: text,
  url: url
}).then(() => {
  console.log('Partage réussi');
}).catch((error) => {
  console.log('Erreur lors du partage:', error);
  // Fallback : copier l'URL dans le presse-papier
  copyToClipboard(url);
});
  } else {
// Fallback : copier l'URL dans le presse-papier
copyToClipboard(url);
  }
}

function copyShareUrl() {
  const url = 'https://firetechdev.github.io/';
  const copyStatus = document.getElementById('copyStatus');
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      if (copyStatus) {
        copyStatus.textContent = 'Lien copié dans le presse-papier !';
        copyStatus.style.display = 'block';
        setTimeout(() => {
          copyStatus.style.display = 'none';
        }, 3000);
      }
    }).catch((error) => {
      console.error('Erreur lors de la copie:', error);
      fallbackCopyToClipboardForShare(url, copyStatus);
    });
  } else {
    fallbackCopyToClipboardForShare(url, copyStatus);
  }
}

function fallbackCopyToClipboardForShare(text, statusElement) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();
  
  try {
    document.execCommand('copy');
    if (statusElement) {
      statusElement.textContent = 'Lien copié dans le presse-papier !';
      statusElement.style.display = 'block';
      setTimeout(() => {
        statusElement.style.display = 'none';
      }, 3000);
    }
  } catch (error) {
    console.error('Erreur lors de la copie:', error);
    if (statusElement) {
      statusElement.textContent = 'Erreur lors de la copie';
      statusElement.style.color = '#f44336';
      statusElement.style.display = 'block';
      setTimeout(() => {
        statusElement.style.display = 'none';
        statusElement.style.color = '#4caf50';
      }, 3000);
    }
  } finally {
    document.body.removeChild(textArea);
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(text).then(() => {
  alert('Lien copié dans le presse-papier : ' + text);
}).catch((error) => {
  console.error('Erreur lors de la copie:', error);
  // Fallback pour les navigateurs plus anciens
  fallbackCopyToClipboard(text);
});
  } else {
fallbackCopyToClipboard(text);
  }
}

function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
document.execCommand('copy');
alert('Message copié dans le presse papier');
  } catch (error) {
console.error('Erreur lors de la copie:', error);
alert('Impossible de copier le message. Voici le contenu : ' + text);
  }
  document.body.removeChild(textArea);
}

function shareMessage() {
  let msg = document.getElementById("message").value;
  // Ajouter les informations supplémentaires si présentes
  const additionalInfo = document.getElementById("additionalInfo")?.value || "";
  if (additionalInfo.trim()) {
msg += "\n\n" + additionalInfo;
  }
  
  // Convertir le texte brut en texte brut
  msg = msg.replace(/\n/g, '\n')
       .replace(/<br>/g, '\n')
       .replace(/<b>/g, '')
       .replace(/<\/b>/g, '')
       .replace(/<i>/g, '')
       .replace(/<\/i>/g, '');
  
  const title = 'Message Radio Pompier';
  const numeroIntervention = document.getElementById('interventionNumber')?.value || '';
  const text = numeroIntervention ? `Intervention #${numeroIntervention}\n\n${msg}` : msg;

  // Utiliser l'API Web Share si disponible (iOS/Android)
  if (navigator.share) {
navigator.share({
  title: title,
  text: text
}).then(() => {
  console.log('Message partagé avec succès');
}).catch((error) => {
  console.log('Erreur lors du partage:', error);
  // Fallback : copier dans le presse-papier
  copyMessageToClipboard(msg);
});
  } else {
// Fallback : copier dans le presse-papier
copyMessageToClipboard(msg);
  }
}

function copyMessageToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(text).then(() => {
  alert('Message copié dans le presse-papier');
}).catch((error) => {
  console.error('Erreur lors de la copie:', error);
  fallbackCopyToClipboard(text);
});
  } else {
fallbackCopyToClipboard(text);
  }
}

function confirmResetForm() {
  if (confirm('Êtes-vous sûr de vouloir recommencer le message ? Toutes les données saisies seront perdues.')) {
resetForm();
  }
}

function resetForm() {
  // Réinitialiser tous les champs de saisie
  document.querySelectorAll("input,select,textarea").forEach(el => {
el.value = "";
  });

  // Réinitialiser tous les boutons toggle
  document.querySelectorAll('.toggle-btn').forEach(btn => {
btn.classList.remove('selected');
  });

  // Réinitialiser les compteurs de véhicules
  ['vehiculeLeger', 'poidsLourd', 'deuxRoues', 'bus'].forEach(id => {
let counter = document.getElementById(id);
if (counter) counter.textContent = '0';
  });

  // Réinitialiser les compteurs de victimes
  VICTIME_TYPES.forEach(id => {
let counter = document.getElementById(id);
if (counter) counter.textContent = '0';
  });

  Object.keys(victimCardState).forEach(key => {
    delete victimCardState[key];
  });
  document.querySelectorAll('.victime-info-container').forEach(container => {
    container.remove();
  });

  // Réinitialiser les compteurs de moyens pompiers
  MOYENS_POMPIERS_IDS.forEach(id => {
let counter = document.getElementById(id);
if (counter) counter.textContent = '0';
updateVehicleDetails(id);
  });

  ['vehiculeLeger', 'poidsLourd', 'deuxRoues', 'bus'].forEach(id => updateMinusButtonState(id));
  VICTIME_TYPES.forEach(id => updateMinusButtonState(id));
  MOYENS_POMPIERS_IDS.forEach(id => updateMinusButtonState(id));
  MOYENS_DEPART_IDS.forEach(id => {
    updateVehicleDetails(id);
    updateMinusButtonState(id);
  });
  updateVictimesTotalCounter();

  // Réinitialiser les champs de précisions des véhicules
  ['vehiculeLegerPrecisions', 'poidsLourdPrecisions', 'deuxRouesPrecisions', 'busPrecisions', 'vehiculeSpecifiqueText'].forEach(id => {
let input = document.getElementById(id);
if (input) input.value = '';
  });

  // Cacher les sections dépliables
  document.querySelectorAll('.sub-container, .hidden').forEach(el => {
el.classList.add('hidden');
  });

  // Réinitialiser les icônes de dépliage
  document.querySelectorAll('.toggle-icon').forEach(icon => {
icon.classList.remove('rotated');
  });

  // Réinitialiser les boutons d'expansion
  document.querySelectorAll('.toggle-btn').forEach(btn => {
btn.classList.remove('active');
  });

  // Hide the nature title
  document.getElementById("selectedNatureTitle").classList.add("hidden");

  // Réinitialiser les variables globales
  selectedNature = "";
  selectedBatiment = "";
  victimsSelected = false;

  // Retourner à l'étape 0
  currentStep = 0;
  document.querySelectorAll(".step").forEach(e => e.classList.add("hidden"));
  document.getElementById("step0").classList.replace("hidden", "active");
  updateProgress();
  
  // Réinitialiser la fonction à CATE par défaut
  const fonctionInput = document.getElementById('fonction');
  if (fonctionInput) {
    fonctionInput.value = 'CATE';
  }
  localStorage.setItem('mrp-fonction', 'CATE');
  
  // Mettre à jour l'état visuel des boutons
  document.querySelectorAll('.function-btn').forEach(btn => {
    btn.classList.remove('selected');
    const onclickAttr = btn.getAttribute('onclick') || '';
    if (onclickAttr.includes('CATE')) {
      btn.classList.add('selected');
    }
  });
  
  // Masquer la section "Je prévois"
  const prevoisSection = document.getElementById("prevoisSection");
  if (prevoisSection) {
    prevoisSection.classList.add("hidden");
  }
}

function toggleRouteInfo() {
  const routeInfo = document.getElementById('routeInfo');
  const btn = document.getElementById('toggleRouteBtn');
  const icon = btn.querySelector('.toggle-icon');
  
  // Toggle la visibilité de la section
  routeInfo.classList.toggle('hidden');
  
  // Toggle l'état du bouton et de l'icône
  btn.classList.toggle('active');
  icon.classList.toggle('rotated');
  
  // Forcer l'affichage de la section si elle est ouverte
  if (!routeInfo.classList.contains('hidden')) {
routeInfo.style.display = 'block';
  }
}

function updateRouteFields() {
  const typeRoute = document.getElementById('typeRoute').value;
  const pkField = document.getElementById('pk').parentElement;
  const sensField = document.getElementById('sens').parentElement;
  const nomEchangeurField = document.getElementById('nomEchangeur').parentElement;
  const numeroRouteField = document.getElementById('numeroRouteContainer');
  
  // Réinitialiser l'affichage de tous les champs
  // Ne plus masquer PK et numeroRoute
  sensField.style.display = 'none';
  nomEchangeurField.style.display = 'none';
  
  // Afficher les champs appropriés selon le type de route
  switch(typeRoute) {
case 'Autoroute':
  sensField.style.display = 'block';
  nomEchangeurField.style.display = 'block';
  break;
case 'Route nationale':
case 'Route départementale':
  sensField.style.display = 'block';
  break;
case 'Rocade intérieure':
case 'Rocade extérieure':
  sensField.style.display = 'block';
  break;
  }
}

// Modifier l'écouteur d'événements pour le type de route
document.getElementById('typeRoute').addEventListener('change', function(e) {
  updateRouteFields();
});

// Ajouter un écouteur pour le changement de type de véhicule
document.getElementById('typeVehicule').addEventListener('change', function(e) {
  const codeMatiereContainer = document.getElementById('codeMatiereTMDContainer');
  if (e.target.value === 'Véhicule poids lourd TMD') {
codeMatiereContainer.classList.remove('hidden');
  } else {
codeMatiereContainer.classList.add('hidden');
document.getElementById('codeMatiereTMD').value = '';
  }
});

// Ajouter un écouteur pour le changement de motif de départ
document.getElementById('motifDepart').addEventListener('change', function(e) {
  // Si on est déjà sur l'étape "Je vois", mettre à jour la sélection
  if (currentStep === 2) {
goToStep(2);
  }
});

// Initialiser les écouteurs d'événements
function initializeRouteEventListeners() {
  const typeRoute = document.getElementById('typeRoute');
  if (typeRoute) {
typeRoute.addEventListener('change', function(e) {
  updateRouteFields();
});
  }
  
  const motifDepart = document.getElementById('motifDepart');
  if (motifDepart) {
motifDepart.addEventListener('change', function(e) {
  if (currentStep === 2) {
    goToStep(2);
  }
});
  }
}

// Modifier window.onload pour inclure l'initialisation des écouteurs de route
window.onload = function() {
  setCurrentTime(); // Collect time zone at app launch
  setupGPSInfoReset();
  updateRouteFields();
  initializeRouteEventListeners();
  initializeMinusButtons();
  
  // Masquer le bouton Précédent sur l'étape INTER au chargement
  const prevButton = document.querySelector('#step0 .prev-btn');
  if (prevButton) {
prevButton.style.display = 'none';
  }
  
  // Restaurer ou sélectionner CATE par défaut au chargement
  try {
    const savedFonction = localStorage.getItem('mrp-fonction') || 'CATE';
    const fonctionInput = document.getElementById('fonction');
    if (fonctionInput) {
      fonctionInput.value = savedFonction;
    }
    
    // Mettre à jour l'état visuel des boutons (même s'ils sont dans une page cachée)
    const functionButtons = document.querySelectorAll('.function-btn');
    functionButtons.forEach(btn => {
      btn.classList.remove('selected');
      const onclickAttr = btn.getAttribute('onclick') || '';
      if (onclickAttr.includes(savedFonction)) {
        btn.classList.add('selected');
      }
    });
    
    // Gérer l'affichage de la section "Je prévois"
    const prevoisSection = document.getElementById("prevoisSection");
    if (prevoisSection) {
      if (savedFonction === 'CDG') {
        prevoisSection.classList.remove("hidden");
      } else {
        prevoisSection.classList.add("hidden");
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la fonction:', error);
  }
}

function toggleLigneDetails() {
  const detailsFields = document.getElementById('ligneDetailsFields');
  const btn = document.getElementById('toggleLigneDetailsBtn');
  const icon = btn.querySelector('.toggle-icon');
  
  detailsFields.classList.toggle('hidden');
  btn.classList.toggle('active');
  icon.classList.toggle('rotated');
}

function resetFields() {
  // Réinitialiser tous les champs de saisie
  document.querySelectorAll('input[type="text"], input[type="number"], select, textarea').forEach(el => {
el.value = '';
  });

  // Réinitialiser tous les boutons toggle
  document.querySelectorAll('.toggle-btn').forEach(btn => {
btn.classList.remove('selected');
  });

  // Réinitialiser les compteurs de véhicules
  ['vehiculeLeger', 'poidsLourd', 'deuxRoues', 'bus'].forEach(id => {
let input = document.getElementById(id);
if (input) input.value = '0';
  });

  // Cacher les sections dépliables
  document.querySelectorAll('.sub-container, .hidden').forEach(el => {
el.classList.add('hidden');
  });

  // Réinitialiser les icônes de dépliage
  document.querySelectorAll('.toggle-icon').forEach(icon => {
icon.classList.remove('rotated');
  });

  // Réinitialiser les boutons d'expansion
  document.querySelectorAll('.toggle-btn').forEach(btn => {
btn.classList.remove('active');
  });

  // Hide the nature title
  document.getElementById("selectedNatureTitle").classList.add("hidden");
}

// Nouvelle fonction pour basculer entre les sections "Je prévois" et "Je fais"
function togglePrevois() {
  // Cette fonction n'est plus utilisée, mais elle est conservée pour compatibilité
  // avec d'éventuels appels existants ailleurs dans le code
  console.log("La fonction togglePrevois n'est plus nécessaire.");
}

// Nouvelle fonction pour basculer les détails des actions
function toggleActionDetails(el) {
  // Toggle la sélection du bouton
  el.classList.toggle("selected");
  
  const target = el.getAttribute("data-target");
  if (target) {
const details = document.getElementById(target);
if (details) {
  details.classList.toggle("hidden");
}
  }
}

function toggleMoyensDepart() {
  const container = document.getElementById('moyensDepartContainer');
  const button = document.querySelector('button[onclick="toggleMoyensDepart()"]');
  if (container && button) {
    container.classList.toggle("hidden");
    button.classList.toggle("selected");
    
    // Gérer la rotation du chevron
    const icon = button.querySelector('.toggle-icon');
    if (icon) {
      if (container.classList.contains("hidden")) {
        icon.classList.remove("rotated");
      } else {
        icon.classList.add("rotated");
      }
    }
  }
}

// Version de l'application
const APP_VERSION = '1.0.22';
const APP_BUILD = '06/03/2026 - 21h56';
const PWA_VERSION_ENDPOINT = './version.json';
const PWA_SW_URL = `./sw.js?v=${encodeURIComponent(`${APP_VERSION}-${APP_BUILD}`)}`;
const PWA_VERSION_CHECK_INTERVAL_MS = 10 * 60 * 1000;
const PWA_SW_UPDATE_INTERVAL_MS = 60 * 60 * 1000;

let mrpSwReloading = false;
let mrpSwActivationInProgress = false;

function versionSignature(version, build) {
  const normalizedVersion = String(version || '').trim();
  const normalizedBuild = String(build || '').trim();
  return `${normalizedVersion}::${normalizedBuild}`;
}

function getUpdateStatusElement() {
  return document.getElementById('updateStatus');
}

function hideUpdateStatus() {
  const updateStatus = getUpdateStatusElement();
  if (!updateStatus) return;
  updateStatus.style.display = 'none';
}

function showUpdateStatus(message, color, autoHideMs = 0) {
  const updateStatus = getUpdateStatusElement();
  if (!updateStatus) return;

  updateStatus.textContent = message;
  updateStatus.style.color = color;
  updateStatus.style.display = 'block';

  if (autoHideMs > 0) {
    window.setTimeout(() => {
      if (updateStatus.textContent === message) {
        updateStatus.style.display = 'none';
      }
    }, autoHideMs);
  }
}

function syncDisplayedAppVersion() {
  const versionInfo = document.getElementById('appVersionInfo');
  if (versionInfo) {
    versionInfo.textContent = `Version ${APP_VERSION} • Build ${APP_BUILD}`;
  }
}

function isLikelyNetworkError(error) {
  const message = String(error?.message || '');
  return !navigator.onLine ||
    error?.name === 'TypeError' ||
    error?.name === 'NetworkError' ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('load failed');
}

async function fetchRemoteVersionMeta(signal) {
  try {
    const response = await fetch(`${PWA_VERSION_ENDPOINT}?t=${Date.now()}`, {
      cache: 'no-store',
      signal,
    });

    if (!response.ok) return null;

    const remote = await response.json();
    const remoteSignature = versionSignature(remote?.version, remote?.build);
    const localSignature = versionSignature(APP_VERSION, APP_BUILD);

    if (!remoteSignature || remoteSignature === localSignature) {
      return null;
    }

    return remote;
  } catch (_) {
    return null;
  }
}

function waitForWaitingServiceWorker(registration, timeoutMs = 8000) {
  if (!registration) {
    return Promise.resolve(null);
  }

  if (registration.waiting) {
    return Promise.resolve(registration.waiting);
  }

  return new Promise((resolve) => {
    let installingWorker = null;
    let settled = false;

    const finish = (worker = null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      registration.removeEventListener('updatefound', onUpdateFound);
      if (installingWorker) {
        installingWorker.removeEventListener('statechange', onStateChange);
      }
      resolve(worker);
    };

    const onStateChange = () => {
      if (!installingWorker) return;

      if (installingWorker.state === 'installed') {
        window.setTimeout(() => finish(registration.waiting || null), 0);
      } else if (installingWorker.state === 'redundant') {
        finish(null);
      }
    };

    const attachInstallingWorker = (worker) => {
      if (!worker || worker === installingWorker) return;

      if (installingWorker) {
        installingWorker.removeEventListener('statechange', onStateChange);
      }

      installingWorker = worker;
      installingWorker.addEventListener('statechange', onStateChange);

      if (installingWorker.state === 'installed') {
        window.setTimeout(() => finish(registration.waiting || null), 0);
      }
    };

    const onUpdateFound = () => {
      attachInstallingWorker(registration.installing);
    };

    const timeoutId = window.setTimeout(() => {
      finish(registration.waiting || null);
    }, timeoutMs);

    registration.addEventListener('updatefound', onUpdateFound);
    attachInstallingWorker(registration.installing);
  });
}

async function activateWaitingServiceWorker(registration = window.__mrpSwRegistration) {
  if (!registration) return false;

  try {
    await registration.update();
  } catch (_) {
    // Ignore update errors and use the currently waiting worker if present.
  }

  const waitingWorker = registration.waiting;
  if (!waitingWorker) {
    mrpSwActivationInProgress = false;
    return false;
  }

  mrpSwActivationInProgress = true;
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  return true;
}

function handleServiceWorkerUpdateReady({ registration }) {
  window.__mrpSwRegistration = registration;

  if (mrpSwActivationInProgress) return;

  showUpdateStatus('Mise à jour disponible. Rechargement de l\'application...', '#ffc107');
  activateWaitingServiceWorker(registration).catch(() => {
    mrpSwActivationInProgress = false;
  });
}

async function initServiceWorkerRuntime({ onUpdateReady, onOfflineReady }) {
  if (!('serviceWorker' in navigator)) {
    return { registration: null, dispose: () => {} };
  }

  const onControllerChange = () => {
    if (mrpSwReloading) return;
    mrpSwReloading = true;
    window.location.reload();
  };

  const onMessage = (event) => {
    if (event?.data?.type === 'MRP_SW_OFFLINE_READY') {
      onOfflineReady?.({
        source: 'message',
        registration: window.__mrpSwRegistration || null,
      });
    }
  };

  navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
  navigator.serviceWorker.addEventListener('message', onMessage);

  try {
    const registration = await navigator.serviceWorker.register(PWA_SW_URL, { scope: './' });
    window.__mrpSwRegistration = registration;

    const markUpdateReady = (source) => onUpdateReady?.({ source, registration });
    const markOfflineReady = (source) => onOfflineReady?.({ source, registration });

    if (registration.waiting) {
      markUpdateReady('waiting');
    }

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;

      installing.addEventListener('statechange', () => {
        if (installing.state !== 'installed') return;

        if (navigator.serviceWorker.controller) {
          markUpdateReady('updatefound');
        } else {
          markOfflineReady('installed');
        }
      });
    });

    registration.update().catch(() => {});

    const versionCheckTimer = window.setInterval(() => {
      checkForUpdates(true);
    }, PWA_VERSION_CHECK_INTERVAL_MS);

    const swUpdateTimer = window.setInterval(() => {
      registration.update().catch(() => {});
    }, PWA_SW_UPDATE_INTERVAL_MS);

    return {
      registration,
      dispose: () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        navigator.serviceWorker.removeEventListener('message', onMessage);
        window.clearInterval(versionCheckTimer);
        window.clearInterval(swUpdateTimer);
      },
    };
  } catch (error) {
    console.log('ServiceWorker registration failed:', error);

    return {
      registration: null,
      dispose: () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        navigator.serviceWorker.removeEventListener('message', onMessage);
      },
    };
  }
}

// Fonction pour vérifier les mises à jour
async function checkForUpdates(isAutoCheck = false) {
  hideUpdateStatus();

  if (window.location.protocol === 'file:') {
    if (!isAutoCheck) {
      showUpdateStatus('Vérification des mises à jour non disponible en mode local (file://)', '#ffc107', 5000);
    }
    return;
  }

  if (!('serviceWorker' in navigator)) {
    if (!isAutoCheck) {
      showUpdateStatus('Vérification des mises à jour non prise en charge par ce navigateur', '#ffc107', 5000);
    }
    return;
  }

  if (!navigator.onLine) {
    if (!isAutoCheck) {
      showUpdateStatus('Mise à jour impossible : pas de réseau. Réessayez plus tard.', '#ffc107', 5000);
    }
    return;
  }

  const registration = window.__mrpSwRegistration || await navigator.serviceWorker.getRegistration();

  if (!registration) {
    showUpdateStatus('Service worker non enregistré. Veuillez recharger la page.', '#dc3545', isAutoCheck ? 3000 : 5000);
    return;
  }

  window.__mrpSwRegistration = registration;

  if (!isAutoCheck) {
    showUpdateStatus('Vérification de la mise à jour...', '#007BFF');
  }

  if (registration.waiting) {
    showUpdateStatus('Mise à jour disponible. Rechargement de l\'application...', '#ffc107');
    await activateWaitingServiceWorker(registration);
    return;
  }

  let remoteMeta = null;
  try {
    remoteMeta = await fetchRemoteVersionMeta();
  } catch (_) {
    remoteMeta = null;
  }

  let updateError = null;
  try {
    await registration.update();
  } catch (error) {
    updateError = error;
  }

  const waitingWorker = registration.waiting || (remoteMeta ? await waitForWaitingServiceWorker(registration) : null);
  if (waitingWorker) {
    showUpdateStatus('Mise à jour disponible. Rechargement de l\'application...', '#ffc107');
    await activateWaitingServiceWorker(registration);
    return;
  }

  if (updateError && isLikelyNetworkError(updateError)) {
    if (!isAutoCheck) {
      showUpdateStatus('Mise à jour impossible : pas de réseau. Réessayez plus tard.', '#ffc107', 5000);
    }
    return;
  }

  if (remoteMeta) {
    const remoteVersion = remoteMeta.version || 'n/a';
    const remoteBuild = remoteMeta.build || 'n/a';
    showUpdateStatus(`Nouvelle version détectée : Version ${remoteVersion} • Build ${remoteBuild}`, '#ffc107', isAutoCheck ? 5000 : 6000);
    return;
  }

  showUpdateStatus('Application à jour et disponible hors-ligne', '#28a745', isAutoCheck ? 3000 : 5000);
}

function selectAddressToggle(btn, value) {
  const container = btn.parentElement;
  container.querySelectorAll('.secondary-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('adresseConfirmee').value = value;
  updateMessage();
}

function getVal(id) {
  const el = document.getElementById(id);
  if (!el) return "";
  if (el.tagName === "SELECT") {
return el.options[el.selectedIndex].text;
  }
  return el.value;
}

function handleEtatCirculation(value) {
  const circulationDetails = document.getElementById('circulationDetails');
  if (value === 'Non altérée') {
circulationDetails.classList.add('hidden');
  } else {
circulationDetails.classList.remove('hidden');
  }
}

function toggleAutreVehicule() {
  const autreVehiculeDetails = document.getElementById('autreVehiculeDetails');
  const btn = document.getElementById('toggleAutreVehiculeBtn');
  const icon = btn.querySelector('.toggle-icon');
  
  autreVehiculeDetails.classList.toggle('hidden');
  btn.classList.toggle('active');
  icon.classList.toggle('rotated');
}

function togglePrecisionVictimes() {
  const container = document.getElementById("precisionVictimesContainer");
  const btn = document.getElementById("togglePrecisionVictimesBtn");
  const icon = btn.querySelector('.toggle-icon');
  
  container.classList.toggle("hidden");
  btn.classList.toggle("active");
  icon.classList.toggle("rotated");
}

function toggleButtonWithField(button, field, value) {
  const buttons = document.querySelectorAll(`[onclick*="${field}"]`);
  buttons.forEach(btn => {
if (btn === button) {
  btn.classList.add('selected');
  document.getElementById(field).value = value;
  // Afficher/masquer les détails en fonction de la valeur sélectionnée
  const detailsContainer = document.getElementById(`${field}Details`);
  if (detailsContainer) {
    if (value === 'non') {
      detailsContainer.classList.remove('hidden');
    } else {
      detailsContainer.classList.add('hidden');
    }
  }
} else {
  btn.classList.remove('selected');
}
  });
}

function selectSurface(value) {
  // Désélectionner tous les boutons de la première section de surface
  const firstSurfaceSection = document.querySelector('label[for="surfaceTotale"]').nextElementSibling;
  firstSurfaceSection.querySelectorAll('.surface-btn').forEach(btn => {
btn.classList.remove('selected');
  });
  
  // Sélectionner le bouton cliqué
  event.target.classList.add('selected');
  
  // Mettre à jour la valeur cachée
  document.getElementById('surfaceTotale').value = value;

  // Cacher le champ personnalisé s'il est visible
  document.getElementById('customSurfaceInput').classList.add('hidden');
  document.getElementById('toggleCustomSurfaceBtn').classList.remove('active');
  document.getElementById('toggleCustomSurfaceBtn').querySelector('.toggle-icon').classList.remove('rotated');
}

function toggleCustomSurface() {
  const input = document.getElementById('customSurfaceInput');
  const btn = document.getElementById('toggleCustomSurfaceBtn');
  const icon = btn.querySelector('.toggle-icon');
  
  input.classList.toggle('hidden');
  btn.classList.toggle('active');
  icon.classList.toggle('rotated');

  // Si on ouvre le champ personnalisé, désélectionner tous les boutons de la première section
  if (!input.classList.contains('hidden')) {
const firstSurfaceSection = document.querySelector('label[for="surfaceTotale"]').nextElementSibling;
firstSurfaceSection.querySelectorAll('.surface-btn').forEach(btn => {
  btn.classList.remove('selected');
});
document.getElementById('surfaceTotale').value = '';
  }
}

function updateCustomSurface() {
  const value = document.getElementById('customSurface').value;
  if (value) {
document.getElementById('surfaceTotale').value = value;
  }
}

function selectSurfaceSinistree(value) {
  // Désélectionner tous les boutons de la deuxième section de surface
  const secondSurfaceSection = document.querySelector('label[for="surfaceSinistree"]').nextElementSibling;
  secondSurfaceSection.querySelectorAll('.surface-btn').forEach(btn => {
btn.classList.remove('selected');
  });
  
  // Sélectionner le bouton cliqué
  event.target.classList.add('selected');
  
  // Mettre à jour la valeur cachée
  document.getElementById('surfaceSinistree').value = value;

  // Cacher le champ personnalisé s'il est visible
  document.getElementById('customSurfaceSinistreeInput').classList.add('hidden');
  document.getElementById('toggleCustomSurfaceSinistreeBtn').classList.remove('active');
  document.getElementById('toggleCustomSurfaceSinistreeBtn').querySelector('.toggle-icon').classList.remove('rotated');
}

function toggleCustomSurfaceSinistree() {
  const input = document.getElementById('customSurfaceSinistreeInput');
  const btn = document.getElementById('toggleCustomSurfaceSinistreeBtn');
  const icon = btn.querySelector('.toggle-icon');
  
  input.classList.toggle('hidden');
  btn.classList.toggle('active');
  icon.classList.toggle('rotated');

  // Si on ouvre le champ personnalisé, désélectionner tous les boutons de la deuxième section
  if (!input.classList.contains('hidden')) {
const secondSurfaceSection = document.querySelector('label[for="surfaceSinistree"]').nextElementSibling;
secondSurfaceSection.querySelectorAll('.surface-btn').forEach(btn => {
  btn.classList.remove('selected');
});
document.getElementById('surfaceSinistree').value = '';
  }
}

function updateCustomSurfaceSinistree() {
  const value = document.getElementById('customSurfaceSinistree').value;
  if (value) {
document.getElementById('surfaceSinistree').value = value;
  }
}

function selectFonction(btn, value) {
  // Réinitialiser tous les boutons
  document.querySelectorAll('.function-btn').forEach(b => b.classList.remove('selected'));
  
  // Sélectionner le bouton cliqué
  btn.classList.add('selected');
  
  // Mettre à jour la valeur cachée
  const fonctionInput = document.getElementById('fonction');
  if (fonctionInput) {
    fonctionInput.value = value;
  }
  
  // Sauvegarder dans localStorage
  localStorage.setItem('mrp-fonction', value);
  
  // Gérer l'affichage de la section "Je prévois"
  const prevoisSection = document.getElementById("prevoisSection");
  
  if (value === 'CDG') {
    // Si CDG est sélectionné, afficher la section
    if (prevoisSection) prevoisSection.classList.remove("hidden");
  } else {
    // Sinon, masquer la section
    if (prevoisSection) prevoisSection.classList.add("hidden");
  }
  
  // Mettre à jour le message seulement si on est sur une page qui l'utilise
  // Vérifier que le container principal est visible avant d'appeler updateMessage
  const container = document.querySelector('.container');
  if (container && container.style.display !== 'none' && typeof updateMessage === 'function') {
    try {
      updateMessage();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du message:', error);
    }
  }
}

function handleIsolation(value) {
  const detailsContainer = document.getElementById('isolationDetails');
  if (value === 'Non') {
detailsContainer.classList.remove('hidden');
  } else {
detailsContainer.classList.add('hidden');
document.getElementById('isolationPrecision').value = '';
  }
  updateMessage();
}

function initializeMinusButtons() {
  const vehicleTypes = ['voiture', 'moto', 'velo', 'pieton', 'camion', 'bus', 'autre', 'vsr', 'vlsm'];
  vehicleTypes.forEach(type => {
const counter = document.getElementById(type);
const minusButton = document.getElementById(type + 'Minus');
if (counter && minusButton) {
  minusButton.disabled = parseInt(counter.textContent) === 0;
}
  });
}

// Appeler la fonction d'initialisation au chargement de la page
/* window.onload = function() {
  initializeMinusButtons();
}; */

function updateMessage() {
  const messageTextarea = document.getElementById('message');
  if (messageTextarea) {
const msg = generateMessage();
messageTextarea.value = msg;
// Ajuster la hauteur du textarea
setTimeout(() => {
  messageTextarea.style.height = "auto";
  messageTextarea.style.height = messageTextarea.scrollHeight + "px";
}, 0);
  }
}

function updateMinusButtonState(type) {
  const counter = document.getElementById(type);
  const minusButton = document.getElementById(type + 'Minus');
  if (counter && minusButton) {
try {
  const value = parseInt(counter.textContent || '0');
  minusButton.disabled = value === 0;
} catch (error) {
  console.error('Error updating minus button state:', error);
  minusButton.disabled = true;
}
  }
}

function initializeButtons() {
  try {
// Trouver tous les boutons moins dans la page sauf ceux avec la classe always-active
const minusButtons = document.querySelectorAll('button.counter-btn.minus:not(.always-active)');
minusButtons.forEach(button => {
  const id = button.id;
  if (id && id.endsWith('Minus')) {
    const type = id.replace('Minus', '');
    const counter = document.getElementById(type);
    if (counter) {
      const value = parseInt(counter.textContent || '0');
      button.disabled = value === 0;
    } else {
      button.disabled = true;
    }
  }
});
  } catch (error) {
console.error('Error initializing buttons:', error);
  }
}

// Attendre que le DOM soit complètement chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeButtons);
} else {
  initializeButtons();
}

function incrementEtage(type) {
  const counter = document.getElementById(type);
  const currentValue = parseInt(counter.textContent);
  counter.textContent = currentValue + 1;
  updateMinusButtonState(type);
  updateMessage();
}

function decrementEtage(type) {
  const counter = document.getElementById(type);
  const currentValue = parseInt(counter.textContent);
  if (currentValue > 0) {
counter.textContent = currentValue - 1;
updateMinusButtonState(type);
updateMessage();
  }
}

function incrementNiveauSinistre() {
  const counter = document.getElementById("niveauSinistre");
  const currentValue = parseInt(counter.textContent);
  counter.textContent = currentValue + 1;
  updateMessage();
}

function decrementNiveauSinistre() {
  const counter = document.getElementById("niveauSinistre");
  const currentValue = parseInt(counter.textContent);
  counter.textContent = currentValue - 1;
  updateMessage();
}

function updateMinusButtonState(type) {
  const counter = document.getElementById(type);
  const minusButton = document.getElementById(type + 'Minus');
  if (counter && minusButton) {
try {
  const value = parseInt(counter.textContent || '0');
  minusButton.disabled = value === 0;
} catch (error) {
  console.error('Error updating minus button state:', error);
  minusButton.disabled = true;
}
  }
}

function initializeButtons() {
  try {
// Trouver tous les boutons moins dans la page sauf ceux avec la classe always-active
const minusButtons = document.querySelectorAll('button.counter-btn.minus:not(.always-active)');
minusButtons.forEach(button => {
  const id = button.id;
  if (id && id.endsWith('Minus')) {
    const type = id.replace('Minus', '');
    const counter = document.getElementById(type);
    if (counter) {
      const value = parseInt(counter.textContent || '0');
      button.disabled = value === 0;
    } else {
      button.disabled = true;
    }
  }
});
  } catch (error) {
console.error('Error initializing buttons:', error);
  }
}

// Fonction pour créer ou mettre à jour les champs de sexe et âge pour les victimes
function updateVictimeInfoFields(id, count) {
  // Trouver le conteneur parent de cette victime
  const victimeContainer = document.getElementById(id).closest('.vehicle-count');
  if (victimeContainer) {
    victimeContainer.classList.toggle('victime-type-active', count > 0);
  }
  
  // Identifier ou créer le conteneur pour les infos supplémentaires
  let infoContainer = document.getElementById(`${id}InfoContainer`);
  if (!infoContainer) {
infoContainer = document.createElement('div');
infoContainer.id = `${id}InfoContainer`;
infoContainer.className = 'victime-info-container';
    
// Ajouter le conteneur après les boutons de compteur
victimeContainer.appendChild(infoContainer);
  }
  
  // Si le compteur est à 0, cacher le conteneur
  if (count <= 0) {
infoContainer.style.display = 'none';
infoContainer.innerHTML = '';
return;
  }
  
  infoContainer.style.display = '';
  
  // Sauvegarder les valeurs existantes
const existingValues = {};
for (let i = 1; i <= Math.max(count, infoContainer.querySelectorAll('.victime-info').length); i++) {
const sexeInput = document.getElementById(`${id}-${i}-sexe`);
const ageInput = document.getElementById(`${id}-${i}-age`);
const ageUnitInput = document.getElementById(`${id}-${i}-age-unit`);
existingValues[i] = {
  sexe: sexeInput ? sexeInput.value : '',
  age: ageInput ? ageInput.value : '',
  ageUnit: ageUnitInput ? ageUnitInput.value : 'ans'
};
  }
  
  // Mettre à jour le HTML du conteneur pour qu'il corresponde au nombre de victimes
  infoContainer.innerHTML = '';
  
  // Créer les champs pour chaque victime
  for (let i = 1; i <= count; i++) {
const victimeId = `${id}-${i}`;
const victimeInfo = document.createElement('div');
victimeInfo.className = 'victime-info';
victimeInfo.dataset.victimeId = victimeId;
    
const victimeHeader = document.createElement('button');
victimeHeader.type = 'button';
victimeHeader.className = 'victime-card-header';
victimeHeader.addEventListener('click', () => toggleVictimeCard(victimeId));

const victimeTitle = document.createElement('span');
victimeTitle.className = 'victime-card-title';
victimeTitle.textContent = `${getVictimeTypeLabel(id)} ${i}`;

victimeHeader.appendChild(victimeTitle);
    
const victimeDetails = document.createElement('div');
victimeDetails.className = 'victime-card-details';
    
// Boutons pour le sexe
const buttonContainer = document.createElement('div');
buttonContainer.className = 'victime-sexe-buttons';
    
const maleBtn = document.createElement('button');
maleBtn.type = 'button';
maleBtn.className = 'secondary-btn sexe-btn sexe-masculin';
maleBtn.textContent = 'VSM';
maleBtn.setAttribute('aria-label', 'Victime sexe masculin');
maleBtn.addEventListener('click', () => selectSexe(maleBtn, victimeId, 'M'));
    
const femaleBtn = document.createElement('button');
femaleBtn.type = 'button';
femaleBtn.className = 'secondary-btn sexe-btn sexe-feminin';
femaleBtn.textContent = 'VSF';
femaleBtn.setAttribute('aria-label', 'Victime sexe féminin');
femaleBtn.addEventListener('click', () => selectSexe(femaleBtn, victimeId, 'F'));
    
buttonContainer.appendChild(maleBtn);
buttonContainer.appendChild(femaleBtn);
    
const hiddenSexe = document.createElement('input');
hiddenSexe.type = 'hidden';
hiddenSexe.id = `${victimeId}-sexe`;
hiddenSexe.value = existingValues[i]?.sexe || '';
    
// Input pour l'âge
const ageInput = document.createElement('input');
ageInput.type = 'number';
ageInput.id = `${victimeId}-age`;
ageInput.className = 'victime-age-input';
ageInput.min = '0';
ageInput.max = '120';
ageInput.placeholder = 'Âge si connu';
ageInput.inputMode = 'numeric';  // Affichera un clavier numérique sur mobile
ageInput.pattern = '[0-9]*';     // Force les valeurs numériques
ageInput.step = '1';             // Incréments de 1
ageInput.addEventListener('change', () => {
  updateVictimeCardUI(victimeId);
  updateMessage();
});
    
// Ajouter une validation pour n'accepter que des nombres
ageInput.addEventListener('input', function() {
  // Remplace tout ce qui n'est pas un nombre par une chaîne vide
  this.value = this.value.replace(/[^0-9]/g, '');
  updateVictimeCardUI(victimeId);
  updateMessage();
});

const ageUnitSelect = document.createElement('select');
ageUnitSelect.id = `${victimeId}-age-unit`;
ageUnitSelect.className = 'victime-age-unit';

const ageUnitYearsOption = document.createElement('option');
ageUnitYearsOption.value = 'ans';
ageUnitYearsOption.textContent = 'ans';

const ageUnitMonthsOption = document.createElement('option');
ageUnitMonthsOption.value = 'mois';
ageUnitMonthsOption.textContent = 'mois';

ageUnitSelect.appendChild(ageUnitYearsOption);
ageUnitSelect.appendChild(ageUnitMonthsOption);
ageUnitSelect.addEventListener('change', () => {
  updateVictimeCardUI(victimeId);
  updateMessage();
});
    
// Restaurer les valeurs existantes
if (existingValues[i]) {
  if (existingValues[i].sexe) {
    if (existingValues[i].sexe === 'M') {
      maleBtn.classList.add('selected');
    } else {
      femaleBtn.classList.add('selected');
    }
  }
      
  // Restaurer la valeur de l'âge
  ageInput.value = existingValues[i].age;
  ageUnitSelect.value = existingValues[i].ageUnit || 'ans';
}

const ageRow = document.createElement('div');
ageRow.className = 'victime-age-row';
ageRow.appendChild(ageInput);
ageRow.appendChild(ageUnitSelect);

victimeDetails.appendChild(buttonContainer);
victimeDetails.appendChild(ageRow);
victimeInfo.appendChild(victimeHeader);
victimeInfo.appendChild(victimeDetails);
victimeInfo.appendChild(hiddenSexe);
    
// Ajouter cette victime au conteneur
infoContainer.appendChild(victimeInfo);
updateVictimeCardUI(victimeId);
  }
}

// Fonction pour sélectionner le sexe d'une victime
function selectSexe(button, victimeId, sexe) {
  // Trouver le conteneur parent
  const container = button.closest('.victime-info');
  // Désélectionner tous les boutons de sexe dans ce conteneur
  container.querySelectorAll('.sexe-btn').forEach(btn => {
btn.classList.remove('selected');
  });
  
  // Sélectionner le bouton cliqué
  button.classList.add('selected');
  
  // Stocker la valeur dans un champ caché pour pouvoir la récupérer plus tard
  let hiddenInput = document.getElementById(`${victimeId}-sexe`);
  if (!hiddenInput) {
hiddenInput = document.createElement('input');
hiddenInput.type = 'hidden';
hiddenInput.id = `${victimeId}-sexe`;
container.appendChild(hiddenInput);
  }
  hiddenInput.value = sexe;

  updateVictimeCardUI(victimeId);
  
  // Mettre à jour le message
  updateMessage();
}

function displayGeneratedMessage() {
  // Générer le message
  const msg = generateMessage();
  
  // Naviguer vers l'étape 6
  document.querySelector(`.step.active`).classList.replace("active", "hidden");
  document.querySelector(`#step6`).classList.replace("hidden", "active");
  
  // Mettre à jour la classe active des éléments de progression
  document.querySelectorAll('.progress-step').forEach((el, index) => {
if (index === 6) {
  el.classList.add('active');
} else {
  el.classList.remove('active');
}
  });
  
  currentStep = 6;
  updateProgress();
  
  // Mettre à jour le textarea avec le message
  const messageTextarea = document.getElementById("message");
  if (messageTextarea) {
messageTextarea.value = msg;
// Ajuster la hauteur du textarea
setTimeout(() => {
  messageTextarea.style.height = "auto";
  messageTextarea.style.height = messageTextarea.scrollHeight + "px";
}, 0);
  }
  
  // Faire défiler vers le haut de la page
  window.scrollTo({
top: 0,
behavior: 'smooth'
  });
}

// Enregistrement du Service Worker
window.addEventListener('load', () => {
  syncDisplayedAppVersion();

  if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') {
    console.log('Service Worker non disponible en mode local - Version actuelle:', APP_VERSION, APP_BUILD);
    showUpdateStatus('Vérification des mises à jour non disponible en mode local (file://)', '#ffc107', 5000);
    return;
  }

  initServiceWorkerRuntime({
    onUpdateReady: handleServiceWorkerUpdateReady,
    onOfflineReady: () => {
      if (!navigator.serviceWorker.controller) {
        showUpdateStatus('Application prête pour le mode hors-ligne', '#28a745', 3000);
      }
    },
  }).then(({ registration }) => {
    if (!registration) {
      showUpdateStatus('Service worker non enregistré. Veuillez recharger la page.', '#dc3545', 5000);
      return;
    }

    checkForUpdates(true);
  });
});

// Initialisation des gestes de swipe
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSwipe);
} else {
  initSwipe();
}

// Appliquer le thème sauvegardé au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applySavedTheme);
} else {
  applySavedTheme();
}

function initSwipe() {
  const container = document.querySelector('.container');
  if (container && typeof Hammer !== 'undefined') {
    const hammer = new Hammer(container);

    // Configuration des gestes
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });

    // Gestion des événements de swipe
    hammer.on('swipeleft', function() {
      // Swipe vers la gauche = aller à l'étape suivante
      if (currentStep < 6) { // 6 est le nombre maximum d'étapes
        goToStep(currentStep + 1);
      }
    });

    hammer.on('swiperight', function() {
      // Swipe vers la droite = aller à l'étape précédente
      if (currentStep > 0) {
        goToStep(currentStep - 1);
      }
    });
  }
}

// Fonctions pour gérer le menu burger
function toggleMenu() {
  const sideMenu = document.getElementById('sideMenu');
  const burgerMenu = document.getElementById('burgerMenu');
  
  if (sideMenu && burgerMenu) {
    const isActive = sideMenu.classList.contains('active');
    
    if (isActive) {
      closeMenu();
    } else {
      openMenu();
    }
  }
}

function openMenu() {
  const sideMenu = document.getElementById('sideMenu');
  const burgerMenu = document.getElementById('burgerMenu');
  
  if (sideMenu && burgerMenu) {
    sideMenu.classList.add('active');
    burgerMenu.classList.add('active');
    document.body.style.overflow = 'hidden'; // Empêcher le scroll du body
  }
}

function closeMenu() {
  const sideMenu = document.getElementById('sideMenu');
  const burgerMenu = document.getElementById('burgerMenu');
  
  if (sideMenu && burgerMenu) {
    sideMenu.classList.remove('active');
    burgerMenu.classList.remove('active');
    document.body.style.overflow = ''; // Restaurer le scroll du body
  }
}

// Fermer le menu en appuyant sur Escape
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeMenu();
  }
});

// Navigation entre les pages
function showHomePage() {
  const termsPage = document.getElementById('termsPage');
  const settingsPage = document.getElementById('settingsPage');
  const sharePage = document.getElementById('sharePage');
  const container = document.querySelector('.container');
  
  if (container) {
    // Cacher toutes les pages
    if (termsPage) termsPage.classList.add('hidden');
    if (settingsPage) settingsPage.classList.add('hidden');
    if (sharePage) sharePage.classList.add('hidden');
    // Afficher le container principal
    container.style.display = 'block';
    // Fermer le menu
    closeMenu();
  }
}

function showTermsPage() {
  const termsPage = document.getElementById('termsPage');
  const settingsPage = document.getElementById('settingsPage');
  const sharePage = document.getElementById('sharePage');
  const container = document.querySelector('.container');
  
  if (termsPage && container) {
    // Cacher le container principal et les autres pages
    container.style.display = 'none';
    if (settingsPage) settingsPage.classList.add('hidden');
    if (sharePage) sharePage.classList.add('hidden');
    // Afficher la page Conditions d'utilisation
    termsPage.classList.remove('hidden');
    // Fermer le menu
    closeMenu();
  }
}

function showSettingsPage() {
  const settingsPage = document.getElementById('settingsPage');
  const termsPage = document.getElementById('termsPage');
  const sharePage = document.getElementById('sharePage');
  const container = document.querySelector('.container');
  
  if (settingsPage && container) {
    // Cacher le container principal et les autres pages
    container.style.display = 'none';
    if (termsPage) termsPage.classList.add('hidden');
    if (sharePage) sharePage.classList.add('hidden');
    // Afficher la page Réglages
    settingsPage.classList.remove('hidden');
    // Mettre à jour le sélecteur avec la valeur sauvegardée
    const savedTheme = localStorage.getItem('mrp-theme') || 'light';
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      themeSelect.value = savedTheme;
    }
    // Restaurer la fonction sélectionnée
    const savedFonction = localStorage.getItem('mrp-fonction') || 'CATE';
    const fonctionInput = document.getElementById('fonction');
    if (fonctionInput) {
      fonctionInput.value = savedFonction;
    }
    // Mettre à jour l'état visuel des boutons
    const functionButtons = settingsPage.querySelectorAll('.function-btn');
    functionButtons.forEach(btn => {
      btn.classList.remove('selected');
      const onclickAttr = btn.getAttribute('onclick') || '';
      if (onclickAttr.includes(savedFonction)) {
        btn.classList.add('selected');
      }
    });
    // Fermer le menu
    closeMenu();
  }
}

function showSharePage() {
  const sharePage = document.getElementById('sharePage');
  const termsPage = document.getElementById('termsPage');
  const settingsPage = document.getElementById('settingsPage');
  const container = document.querySelector('.container');
  
  if (sharePage && container) {
    // Cacher le container principal et les autres pages
    container.style.display = 'none';
    if (termsPage) termsPage.classList.add('hidden');
    if (settingsPage) settingsPage.classList.add('hidden');
    // Afficher la page Partager l'application
    sharePage.classList.remove('hidden');
    // Réinitialiser le message de statut
    const copyStatus = document.getElementById('copyStatus');
    if (copyStatus) {
      copyStatus.style.display = 'none';
    }
    // Fermer le menu
    closeMenu();
  }
}

function goBack() {
  showHomePage();
}

// Fonction pour changer le thème
function changeTheme(theme) {
  const body = document.body;
  const html = document.documentElement;
  
  if (theme === 'dark') {
    body.classList.add('dark-mode');
    html.classList.add('dark-mode');
  } else {
    body.classList.remove('dark-mode');
    html.classList.remove('dark-mode');
  }
  
  // Sauvegarder la préférence
  localStorage.setItem('mrp-theme', theme);
}

// Appliquer le thème sauvegardé au chargement
function applySavedTheme() {
  const savedTheme = localStorage.getItem('mrp-theme') || 'light';
  changeTheme(savedTheme);
}
