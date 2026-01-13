let currentStep = 0,
selectedNature = "",
selectedBatiment = "",
victimsSelected = false;

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
  }
  
  // Si on arrive à l'étape "Je vois" (step 2), sélectionner automatiquement le motif de départ
  if (step === 2) {
const motifDepart = document.getElementById('motifDepart').value;
    
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
  case 'Fuite de Gaz procédure classique':
  case 'Fuite de Gaz procédure renforcée':
  case 'Déclenchement alarme':
  case 'Intoxication au monoxyde de carbone (CO)':
  case 'Personne bloquée dans un ascenseur':
  case 'Autre type d\'intervention':
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
  } else if (selectedNature === "Autre") {
document.getElementById("autreTypeBox").classList.remove("hidden");
// Suppression de la ligne suivante
// document.getElementById("selectedNatureTitle").classList.remove("hidden");
  }
}

function handleAutreIntervention(value) {
  if (!value) {
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
  selectedNature = value;
  
  // Hide all fields first
  ["avpFields", "feuVehiculeFields", "batimentFields", "chuteLigneFields"].forEach(id => 
document.getElementById(id).classList.add("hidden")
  );
  document.getElementById("infoFuiteGaz").classList.add("hidden");
  document.getElementById("selectedNatureTitle").classList.add("hidden");

  // Show relevant fields based on selection
  if (value === "Chute de ligne électrique") {
document.getElementById("chuteLigneFields").classList.remove("hidden");
  } else if (value.startsWith("Fuite de gaz")) {
document.getElementById("batimentFields").classList.remove("hidden");
document.getElementById("infoFuiteGaz").classList.remove("hidden");
  } else if (["Fumée suspecte", "Odeur de brulé", "Feu de cheminée", "Autre type de feu"].includes(value)) {
document.getElementById("batimentFields").classList.remove("hidden");
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
  ['victimes', 'indemnes', 'UA', 'UR', 'DCD', 'incarcerees', 'intoxiquees', 'impliques'].forEach(id => {
updateMinusButtonState(id);
  });
  
  // Compteurs de moyens pompiers
  ['VSAV', 'FPT', 'FPTSR', 'VSR', 'EPA', 'chefGroupe', 'SMUR', 'ISP', 'vehiculeSpecifique'].forEach(id => {
updateMinusButtonState(id);
  });
  
  // Compteurs de moyens au départ
  ['VSAVDepart', 'FPTDepart', 'FPTSRDepart', 'VSRDepart', 'EPADepart', 'VIDDepart', 'chefGroupeDepart', 'SMURDepart', 'ISPDepart', 'vehiculeSpecifiqueDepart'].forEach(id => {
updateMinusButtonState(id);
  });
});

function incrementVehicle(id) {
  const span = document.getElementById(id);
  if (span) {
try {
  const value = parseInt(span.textContent || '0') + 1;
  span.textContent = value;
  updateVehicleDetails(id);
  updateMinusButtonState(id);
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
    span.textContent = value - 1;
    updateVehicleDetails(id);
    updateMinusButtonState(id);
  }
} catch (error) {
  console.error('Error decrementing vehicle:', error);
}
  }
}

function updateVehicleDetails(id) {
  let details = document.getElementById(id + "Details");
  let value = parseInt(document.getElementById(id).textContent);
  if (details) {
if (value > 0) {
  details.classList.remove("hidden");
} else {
  details.classList.add("hidden");
}
  }
  
  // Ajouter/mettre à jour les champs de sexe et âge pour les victimes
  const victimeTypes = ["UA", "UR", "DCD", "incarcerees", "intoxiquees", "indemnes", "impliques"];
  if (victimeTypes.includes(id)) {
updateVictimeInfoFields(id, value);
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
  let autreNature = getVal("autreTypeIntervention");
  // Si "Autre" est sélectionné, utiliser la valeur de autreTypeIntervention
  let nature = (natureBtn && natureBtn.dataset.value === "Autre") ? autreNature : (natureBtn ? natureBtn.dataset.value : autreNature);
  
  if (nature) {
msg += `Un ${nature}\n`;

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

// Building related fields (used by multiple types)
else if (nature === "Feu de bâtiment" || nature.includes("Fuite de gaz") || 
         nature === "Fumée suspecte" || nature === "Odeur de brulé" || 
         nature === "Autre type de feu") {
      
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
        msg += `Niveau sinistré: ${prefix}${niveauSinistre}\n`;
      }
    }
  }

  if (getVal("usageBatiment")) msg += `Bâtiment à usage de: ${getVal("usageBatiment")}\n`;
  if (getVal("typeBatimentSelect")) msg += `De type: ${getVal("typeBatimentSelect")}\n`;
  if (getVal("structure")) msg += `Structure: ${getVal("structure")}\n`;
  if (getVal("surfaceTotale")) msg += `Surface totale: ${getVal("surfaceTotale")} m²\n`;
  if (getVal("surfaceSinistree")) msg += `Surface sinistrée: ${getVal("surfaceSinistree")} m²\n`;

  let propagation = getVal("propagationBatiment");
  if (propagation) {
    msg += `Risque de propagation: ${propagation}\n`;
    if (propagation === "Oui" && getVal("precisionsPropagationBatiment")) {
      msg += `Précisions propagation: ${getVal("precisionsPropagationBatiment")}\n`;
    }
  }

  let isole = getVal("isoleBatiment");
  if (isole) {
    msg += `Bâtiment isolé: ${isole}\n`;
    if (isole === "Oui" && getVal("precisionsIsoleBatiment")) {
      msg += `Précisions environnement: ${getVal("precisionsIsoleBatiment")}\n`;
    }
  }

  if (getVal("risqueSpecifiqueBatiment")) msg += `Risque spécifique: ${getVal("risqueSpecifiqueBatiment")}\n`;
  if (getVal("evolutionFeuBatiment")) msg += `Évolution du feu: ${getVal("evolutionFeuBatiment")}\n`;
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
  const victimTypes = {
"UA": "Victime UA",
"UR": "Victime UR",
"DCD": "Victime DCD",
"incarcerees": "Victime Incarcérée",
"intoxiquees": "Victime Intoxiquée",
"indemnes": "Indemne",
"impliques": "Impliqué"
  };

  // Collecter toutes les informations sur les victimes
  let totalVictimes = 0;
  const allVictimDetails = [];
  const victimCountsByType = {}; // Pour regrouper les victimes sans détails
  
  Object.entries(victimTypes).forEach(([id, label]) => {
const count = parseInt(document.getElementById(id)?.textContent || "0");
if (count > 0) {
  totalVictimes += count;
      
  // Extraire le type court (UA, UR, etc.) du label
  const typeLabel = label.startsWith("Victime") ? label.substring(8).trim() : label;
      
  let victimsWithDetails = 0;
      
  // Collecter les détails de chaque victime
  for (let i = 1; i <= count; i++) {
    // Récupérer les informations de sexe et d'âge
    const sexeInput = document.getElementById(`${id}-${i}-sexe`);
    const ageInput = document.getElementById(`${id}-${i}-age`);
    const sexe = sexeInput ? sexeInput.value : '';
    const age = ageInput ? ageInput.value : '';
        
    // Si la victime a des détails (sexe ou âge), afficher les détails individuels
    if (sexe || age) {
      let detail = "";
      // Construire la description de la victime
      if (sexe === 'M') {
        detail += "1 VSM";
      } else if (sexe === 'F') {
        detail += "1 VSF";
      } else {
        detail += "1 Victime";
      }
          
      // Ajouter l'âge si disponible
      if (age) {
        detail += ` ${age} ans`;
      }
          
      // Ajouter le type de victime à la fin
      detail += ` ${typeLabel}`;
          
      allVictimDetails.push(detail);
      victimsWithDetails++;
    }
  }
      
  // Si certaines victimes n'ont pas de détails, les regrouper
  const victimsWithoutDetails = count - victimsWithDetails;
  if (victimsWithoutDetails > 0) {
    if (!victimCountsByType[typeLabel]) {
      victimCountsByType[typeLabel] = 0;
    }
    victimCountsByType[typeLabel] += victimsWithoutDetails;
  }
}
  });

  // Générer le message pour les victimes
  if (totalVictimes > 0) {
// Cas spécial : une seule victime
if (totalVictimes === 1) {
  // Si la victime a des détails, afficher directement les détails
  if (allVictimDetails.length > 0) {
    msg += allVictimDetails[0] + "\n";
  } else {
    // Sinon, afficher le type de victime
    const typeKeys = Object.keys(victimCountsByType);
    if (typeKeys.length > 0) {
      msg += `1 Victime ${typeKeys[0]}\n`;
    } else {
      msg += `1 Victime\n`;
    }
  }
} else {
  // Plusieurs victimes : afficher le total avec "au total, dont"
  msg += `${totalVictimes} Victimes au total, dont`;
      
  // Ajouter les compteurs groupés pour les victimes sans détails
  const countMessages = [];
  Object.entries(victimCountsByType).forEach(([type, count]) => {
    if (count === 1) {
      countMessages.push(`1 Victime ${type}`);
    } else {
      countMessages.push(`${count} Victimes ${type}`);
    }
  });
      
  // Combiner les détails individuels et les compteurs groupés
  const allMessages = [...countMessages, ...allVictimDetails];
  if (allMessages.length > 0) {
    msg += ", " + allMessages.join(", ");
  }
      
  msg += "\n";
}
  }

  // Ajouter les précisions sur les victimes si présentes
  let precisionVictimes = getVal("precisionVictimes");
  if (precisionVictimes) {
msg += `Précisions sur les victimes: ${precisionVictimes}\n`;
  }
  
  if (totalVictimes > 0) {
msg += "\n";
  }

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
  ['victimes', 'indemnes', 'UA', 'UR', 'DCD', 'incarcerees', 'intoxiquees', 'impliques'].forEach(id => {
let counter = document.getElementById(id);
if (counter) counter.textContent = '0';
  });

  // Réinitialiser les compteurs de moyens pompiers
  ['VSAV', 'FPT', 'FPTSR', 'VSR', 'EPA', 'chefGroupe', 'SMUR', 'ISP', 'vehiculeSpecifique'].forEach(id => {
let counter = document.getElementById(id);
if (counter) counter.textContent = '0';
  });

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
const APP_VERSION = '1.0.20';

// Fonction pour vérifier les mises à jour
function checkForUpdates(isAutoCheck = false) {
  console.log('checkForUpdates appelé, isAutoCheck =', isAutoCheck);
  
  const updateStatus = document.getElementById('updateStatus');
  if (!updateStatus) {
console.error('Élément updateStatus non trouvé');
return;
  }
  updateStatus.style.display = 'none';
  
  // Vérifier d'abord si on est en mode local (file://)
  if (window.location.protocol === 'file:') {
updateStatus.textContent = 'Vérification des mises à jour non disponible en mode local (file://)';
updateStatus.style.color = '#ffc107';
updateStatus.style.display = 'block';
if (!isAutoCheck) {
  setTimeout(() => {
    updateStatus.style.display = 'none';
  }, 5000);
}
return;
  }
  
  if ('serviceWorker' in navigator) {
console.log('ServiceWorker disponible, vérification des mises à jour...');
navigator.serviceWorker.getRegistration().then(registration => {
  if (registration) {
    console.log('ServiceWorker enregistré:', registration.scope);
        
    // Vider le cache avant de vérifier les mises à jour
    caches.keys().then(cacheNames => {
      console.log('Suppression des caches:', cacheNames);
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      // Créer un timestamp unique pour le cache-busting
      const timestamp = new Date().getTime();
          
      // Obtenir le chemin de base à partir du scope du service worker
      const swScope = registration.scope;
      const basePath = swScope.endsWith('/') ? swScope : swScope + '/';
      console.log('Chemin de base pour le service worker:', basePath);
          
      // Construire l'URL du service worker en utilisant le chemin relatif
      const swUrl = new URL('sw.js', registration.scope).href;
      console.log('URL du service worker:', swUrl);
          
      // Vérifier la version actuelle du service worker
      fetch(`${swUrl}?v=${timestamp}`)
        .then(response => {
          console.log('Réponse de la requête sw.js:', response.status, response.ok);
          if (response.ok) {
            return response.text().then(swContent => {
              console.log('Contenu du service worker récupéré', swContent.substring(0, 100) + '...');
              const versionMatch = swContent.match(/const APP_VERSION = ['"]([^'"]+)['"]/);
              const swVersion = versionMatch ? versionMatch[1] : null;
              console.log('Version du service worker:', swVersion, 'Version actuelle:', APP_VERSION);
                  
              if (swVersion && swVersion === APP_VERSION) {
                // Version à jour
                updateStatus.textContent = 'Application à jour et disponible hors-ligne';
                updateStatus.style.color = '#28a745';
                updateStatus.style.display = 'block';
                    
                // Si c'est une vérification automatique, masquer le message après quelques secondes
                if (isAutoCheck) {
                  setTimeout(() => {
                    updateStatus.style.display = 'none';
                  }, 3000);
                }
              } else {
                // Nouvelle version disponible
                updateStatus.textContent = 'Une mise à jour est disponible. Mise à jour en cours...';
                updateStatus.style.color = '#ffc107';
                updateStatus.style.display = 'block';
                    
                // Forcer la mise à jour du service worker
                registration.update().then(() => {
                  // Envoyer un message au service worker pour forcer l'activation
                  registration.active.postMessage({ type: 'SKIP_WAITING' });
                      
                  if (isIOS) {
                    // Sur iOS, forcer le rechargement de la page
                    updateStatus.textContent = 'Mise à jour terminée. Rechargement de l\'application...';
                    console.log('iOS: Rechargement de la page pour appliquer les mises à jour');
                    setTimeout(() => {
                      window.location.reload(true);
                    }, 2000);
                  } else {
                    // Sur les autres plateformes, forcer le rechargement après un court délai
                    updateStatus.textContent = 'Mise à jour terminée. Rechargement de l\'application...';
                    setTimeout(() => {
                      window.location.reload(true);
                    }, 2000);
                  }
                });
              }
            });
          } else {
            console.error('Erreur lors de la récupération du service worker:', response.status, response.statusText);
            throw new Error('Service worker non disponible');
          }
        })
        .catch(error => {
          console.error('Erreur lors de la vérification:', error);
          
          // Détecter si l'erreur est due à l'absence de réseau
          const isNetworkError = !navigator.onLine || 
                                 error.message.includes('Failed to fetch') || 
                                 error.message.includes('NetworkError') ||
                                 error.message.includes('load failed') ||
                                 error.name === 'TypeError' ||
                                 error.name === 'NetworkError';
          
          if (isNetworkError) {
            updateStatus.textContent = 'Mise à jour impossible : pas de réseau. Réessayez plus tard.';
            updateStatus.style.color = '#ffc107';
          } else {
            updateStatus.textContent = 'Erreur lors de la vérification des mises à jour';
            updateStatus.style.color = '#dc3545';
          }
          
          updateStatus.style.display = 'block';
          if (!isAutoCheck) {
            setTimeout(() => {
              updateStatus.style.display = 'none';
            }, 5000);
          }
        });
    });
  } else {
    console.error('Aucun service worker enregistré');
    // Gérer le cas où il n'y a pas de service worker (mode local/file://)
    if (window.location.protocol === 'file:' || !('serviceWorker' in navigator)) {
      updateStatus.textContent = 'Vérification des mises à jour non disponible en mode local (file://)';
      updateStatus.style.color = '#ffc107';
      updateStatus.style.display = 'block';
      if (!isAutoCheck) {
        setTimeout(() => {
          updateStatus.style.display = 'none';
        }, 5000);
      }
    } else {
      updateStatus.textContent = 'Service worker non enregistré. Veuillez recharger la page.';
      updateStatus.style.color = '#dc3545';
      updateStatus.style.display = 'block';
      setTimeout(() => {
        updateStatus.style.display = 'none';
      }, 3000);
    }
  }
});
  } else {
console.error('ServiceWorker non pris en charge par ce navigateur');
// Gérer le cas où le service worker n'est pas supporté
updateStatus.textContent = 'Vérification des mises à jour non disponible en mode local (file://)';
updateStatus.style.color = '#ffc107';
updateStatus.style.display = 'block';
if (!isAutoCheck) {
  setTimeout(() => {
    updateStatus.style.display = 'none';
  }, 5000);
}
  }
}

// Vérifier automatiquement les mises à jour au chargement de la page
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
navigator.serviceWorker.getRegistration().then(registration => {
  if (registration) {
    // Vérification unique au démarrage
    checkForUpdates(true);
  }
});
  }
});

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
  try {
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
    try {
      if (typeof updateMessage === 'function') {
        updateMessage();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du message:', error);
    }
  } catch (error) {
    console.error('Erreur dans selectFonction:', error);
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
  
  // Identifier ou créer le conteneur pour les infos supplémentaires
  let infoContainer = document.getElementById(`${id}InfoContainer`);
  if (!infoContainer) {
infoContainer = document.createElement('div');
infoContainer.id = `${id}InfoContainer`;
infoContainer.className = 'victime-info-container';
infoContainer.style.marginTop = '10px';
infoContainer.style.padding = '5px';
infoContainer.style.border = '1px solid #eee';
infoContainer.style.borderRadius = '5px';
    
// Ajouter le conteneur après les boutons de compteur
victimeContainer.appendChild(infoContainer);
  }
  
  // Si le compteur est à 0, cacher le conteneur
  if (count <= 0) {
infoContainer.style.display = 'none';
infoContainer.innerHTML = '';
return;
  }
  
  infoContainer.style.display = 'block';
  
  // Sauvegarder les valeurs existantes
  const existingValues = {};
  for (let i = 1; i <= Math.max(count, infoContainer.querySelectorAll('.victime-info').length); i++) {
const sexeInput = document.getElementById(`${id}-${i}-sexe`);
const ageInput = document.getElementById(`${id}-${i}-age`);
existingValues[i] = {
  sexe: sexeInput ? sexeInput.value : '',
  age: ageInput ? ageInput.value : ''
};
  }
  
  // Mettre à jour le HTML du conteneur pour qu'il corresponde au nombre de victimes
  infoContainer.innerHTML = '';
  
  // Créer les champs pour chaque victime
  for (let i = 1; i <= count; i++) {
const victimeInfo = document.createElement('div');
victimeInfo.className = 'victime-info';
victimeInfo.style.marginBottom = '10px';
victimeInfo.style.padding = '5px';
// Le fond sera géré par CSS selon le thème
    
// Titre de la victime
const victimeTitle = document.createElement('div');
// Modification du titre de la victime pour afficher "Victime n°X" 
victimeTitle.textContent = `Victime n°${i}`;
// Suppression du style gras
victimeTitle.style.marginBottom = '5px';
// victimeTitle.style.fontWeight = 'bold'; // Suppression du style gras
    
// Conteneur pour les boutons de sexe
const sexeContainer = document.createElement('div');
sexeContainer.style.display = 'flex';
sexeContainer.style.flexDirection = 'column';
sexeContainer.style.marginBottom = '12px';
sexeContainer.style.width = '100%';
    
// Boutons pour le sexe
const buttonContainer = document.createElement('div');
buttonContainer.style.display = 'flex';
buttonContainer.style.flexDirection = 'column';
buttonContainer.style.gap = '5px';
buttonContainer.style.width = '100%';
    
const maleBtn = document.createElement('button');
maleBtn.type = 'button';
maleBtn.className = 'secondary-btn sexe-btn sexe-masculin';
maleBtn.textContent = 'Masculin';
maleBtn.onclick = function() { selectSexe(this, `${id}-${i}`, 'M'); };
maleBtn.style.width = '100%';
maleBtn.style.height = '40px';
maleBtn.style.backgroundColor = '#d4e6f6';
maleBtn.style.color = '#0066cc';
maleBtn.style.border = '1px solid #ccc';
maleBtn.style.borderRadius = '5px';
maleBtn.style.fontSize = '16px';
maleBtn.style.textAlign = 'center';
    
const femaleBtn = document.createElement('button');
femaleBtn.type = 'button';
femaleBtn.className = 'secondary-btn sexe-btn sexe-feminin';
femaleBtn.textContent = 'Féminin';
femaleBtn.onclick = function() { selectSexe(this, `${id}-${i}`, 'F'); };
femaleBtn.style.width = '100%';
femaleBtn.style.height = '40px';
femaleBtn.style.backgroundColor = '#fce4ec';
femaleBtn.style.color = '#e91e63';
femaleBtn.style.border = '1px solid #ccc';
femaleBtn.style.borderRadius = '5px';
femaleBtn.style.fontSize = '16px';
femaleBtn.style.textAlign = 'center';
    
buttonContainer.appendChild(maleBtn);
buttonContainer.appendChild(femaleBtn);
sexeContainer.appendChild(buttonContainer);
    
// Conteneur pour l'âge
const ageContainer = document.createElement('div');
ageContainer.style.display = 'flex';
ageContainer.style.flexDirection = 'column';
ageContainer.style.width = '100%';
    
// Input pour l'âge
const ageInput = document.createElement('input');
ageInput.type = 'number';
ageInput.id = `${id}-${i}-age`;
ageInput.min = '0';
ageInput.max = '120';
ageInput.placeholder = 'Âge en années';
ageInput.inputMode = 'numeric';  // Affichera un clavier numérique sur mobile
ageInput.pattern = '[0-9]*';     // Force les valeurs numériques
ageInput.step = '1';             // Incréments de 1
ageInput.style.width = '100%';
ageInput.style.height = '40px';
ageInput.style.textAlign = 'center';
ageInput.style.fontSize = '16px';
ageInput.style.padding = '5px';
ageInput.style.border = '1px solid #ccc';
ageInput.style.borderRadius = '5px';
ageInput.style.boxSizing = 'border-box';
ageInput.onchange = function() { updateMessage(); };
    
// Ajouter une validation pour n'accepter que des nombres
ageInput.oninput = function() {
  // Remplace tout ce qui n'est pas un nombre par une chaîne vide
  this.value = this.value.replace(/[^0-9]/g, '');
  updateMessage();
};
    
// Restaurer les valeurs existantes
if (existingValues[i]) {
  // Créer un champ caché pour le sexe s'il y a une valeur
  if (existingValues[i].sexe) {
    const hiddenSexe = document.createElement('input');
    hiddenSexe.type = 'hidden';
    hiddenSexe.id = `${id}-${i}-sexe`;
    hiddenSexe.value = existingValues[i].sexe;
    victimeInfo.appendChild(hiddenSexe);
        
    // Mettre à jour le style du bouton correspondant
    if (existingValues[i].sexe === 'M') {
      maleBtn.classList.add('selected');
      if (!document.body.classList.contains('dark-mode')) {
        maleBtn.style.backgroundColor = '#0066cc';
        maleBtn.style.color = 'white';
        maleBtn.style.border = '1px solid #0066cc';
      }
      maleBtn.style.fontWeight = 'bold';
    } else {
      femaleBtn.classList.add('selected');
      if (!document.body.classList.contains('dark-mode')) {
        femaleBtn.style.backgroundColor = '#FF80AB';
        femaleBtn.style.color = 'white';
        femaleBtn.style.border = '1px solid #FF80AB';
      }
      femaleBtn.style.fontWeight = 'bold';
    }
  }
      
  // Restaurer la valeur de l'âge
  ageInput.value = existingValues[i].age;
}
    
ageContainer.appendChild(ageInput);
    
// Assembler tous les éléments
victimeInfo.appendChild(victimeTitle);
victimeInfo.appendChild(sexeContainer);
victimeInfo.appendChild(ageContainer);
    
// Ajouter cette victime au conteneur
infoContainer.appendChild(victimeInfo);
    
// Ajouter un séparateur sauf pour la dernière victime
if (i < count) {
  const separator = document.createElement('hr');
  separator.style.margin = '10px 0';
  separator.style.border = '0';
  separator.style.borderTop = '1px solid #eee';
  infoContainer.appendChild(separator);
}
  }
}

// Fonction pour sélectionner le sexe d'une victime
function selectSexe(button, victimeId, sexe) {
  // Trouver le conteneur parent
  const container = button.closest('.victime-info');
  // Désélectionner tous les boutons de sexe dans ce conteneur
  container.querySelectorAll('button').forEach(btn => {
if (btn.textContent === 'Masculin' || btn.textContent === 'Féminin') {
  btn.classList.remove('selected');
  // Les styles seront gérés par CSS selon le thème
  if (!document.body.classList.contains('dark-mode')) {
    if (btn.textContent === 'Masculin') {
      btn.style.backgroundColor = '#d4e6f6';
      btn.style.color = '#0066cc';
      btn.style.fontWeight = 'normal';
      btn.style.border = '1px solid #ccc';
    } else {
      btn.style.backgroundColor = '#fce4ec';
      btn.style.color = '#e91e63';
      btn.style.fontWeight = 'normal';
      btn.style.border = '1px solid #ccc';
    }
  }
}
  });
  
  // Sélectionner le bouton cliqué
  button.classList.add('selected');
  // Les styles seront gérés par CSS selon le thème
  if (!document.body.classList.contains('dark-mode')) {
    if (sexe === 'M') {
      button.style.backgroundColor = '#0066cc';
      button.style.color = 'white';
      button.style.fontWeight = 'bold';
      button.style.border = '1px solid #0066cc';
    } else {
      button.style.backgroundColor = '#FF80AB';
      button.style.color = 'white';
      button.style.fontWeight = 'bold';
      button.style.border = '1px solid #FF80AB';
    }
  } else {
    // En dark mode, les styles CSS gèrent les couleurs
    button.style.fontWeight = 'bold';
  }
  
  // Stocker la valeur dans un champ caché pour pouvoir la récupérer plus tard
  let hiddenInput = document.getElementById(`${victimeId}-sexe`);
  if (!hiddenInput) {
hiddenInput = document.createElement('input');
hiddenInput.type = 'hidden';
hiddenInput.id = `${victimeId}-sexe`;
container.appendChild(hiddenInput);
  }
  hiddenInput.value = sexe;
  
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
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.protocol === 'http:')) {
  window.addEventListener('load', () => {
navigator.serviceWorker.register('/MRP/sw.js')
  .then(registration => {
    console.log('ServiceWorker registration successful');
        
    // Vérification automatique des mises à jour lors du lancement de l'application
    // Fonctionne en mode PWA, HTTP et local
    console.log('Vérification des mises à jour au lancement...');
    checkForUpdates(true); // true = vérification automatique
  })
  .catch(err => {
    console.log('ServiceWorker registration failed: ', err);
  });
  });
} else {
  // En cas d'ouverture via file:// ou protocole non pris en charge
  window.addEventListener('load', () => {
console.log('Service Worker non disponible en mode file:// - Version actuelle: ' + APP_VERSION);
    
// Mise à jour du statut pour indiquer qu'on est en mode local
const updateStatus = document.getElementById('updateStatus');
if (updateStatus) {
  updateStatus.textContent = 'Vérification des mises à jour non disponible en mode local (file://)';
  updateStatus.style.color = '#ffc107';
  updateStatus.style.display = 'block';
  setTimeout(() => {
    updateStatus.style.display = 'none';
  }, 5000);
}
  });
}

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
