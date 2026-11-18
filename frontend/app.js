let API_BASE_URL = localStorage.getItem("jobconnect_api_url") || "http://localhost:8080";
let currentUser = null;
let currentToken = null;
let currentOfferDetail = null;
document.addEventListener("DOMContentLoaded", () => {
  initApiUrl();
  loadSavedAuth();
  setupEventListeners();
  switchTab("catalogue");
});

function initApiUrl() {
  const urlInput = document.getElementById("api-url-input");
  if (urlInput) {
    urlInput.value = API_BASE_URL;
    urlInput.addEventListener("change", (e) => {
      API_BASE_URL = e.target.value.trim().replace(/\/$/, "");
      localStorage.setItem("jobconnect_api_url", API_BASE_URL);
      showToast("URL API mise à jour : " + API_BASE_URL, "info");
    });
  }
}

function loadSavedAuth() {
  currentToken = localStorage.getItem("jobconnect_token");
  const storedUser = localStorage.getItem("jobconnect_user");
  if (currentToken && storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
      updateAuthUI();
    } catch {
      logout();
    }
  } else {
    updateAuthUI();
  }
}

function updateAuthUI() {
  const userInfo = document.getElementById("user-info");
  const authBtns = document.getElementById("auth-buttons");
  const userNameEl = document.getElementById("user-name");
  const userRoleEl = document.getElementById("user-role-pill");
  const agentNavTab = document.getElementById("nav-agent");

  if (currentUser && currentToken) {
    userInfo.style.display = "flex";
    authBtns.style.display = "none";
    userNameEl.textContent = `${currentUser.prenom || ""} ${currentUser.nom || ""}`.trim() || currentUser.email;
    userRoleEl.textContent = currentUser.role;
    userRoleEl.className = `role-pill role-${currentUser.role}`;
    if (agentNavTab) {
      agentNavTab.style.display = currentUser.role === "agent" ? "inline-block" : "none";
    }
  } else {
    userInfo.style.display = "none";
    authBtns.style.display = "flex";
    if (agentNavTab) agentNavTab.style.display = "none";
  }
}

function setupEventListeners() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;
      if (tabName) switchTab(tabName);
    });
  });
  const profileForm = document.getElementById("profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", handleProfileUpdate);
  }
  const cvInput = document.getElementById("cv-file-input");
  const cvDropzone = document.getElementById("cv-dropzone");
  if (cvDropzone && cvInput) {
    cvDropzone.addEventListener("click", () => cvInput.click());
    cvInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleCvUpload(e.target.files[0]);
      }
    });

    cvDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      cvDropzone.classList.add("dragover");
    });
    cvDropzone.addEventListener("dragleave", () => cvDropzone.classList.remove("dragover"));
    cvDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      cvDropzone.classList.remove("dragover");
      if (e.dataTransfer.files.length > 0) {
        handleCvUpload(e.dataTransfer.files[0]);
      }
    });
  }
  const candForm = document.getElementById("candidature-form");
  if (candForm) {
    candForm.addEventListener("submit", handlePostuler);
  }
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
}

function switchTab(tabName) {
  document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));

  const targetTab = document.getElementById(`tab-${tabName}`);
  const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);

  if (targetTab) targetTab.classList.add("active");
  if (targetBtn) targetBtn.classList.add("active");

  if (tabName === "catalogue") {
    loadOffresPubliees();
  } else if (tabName === "profil") {
    loadProfilCandidat();
  } else if (tabName === "agent") {
    loadOffresEnAttente();
  } else if (tabName === "candidatures") {
    loadMesCandidatures();
  }
}
async function loadOffresPubliees() {
  const container = document.getElementById("offres-grid");
  if (!container) return;

  container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Chargement des offres...</p>`;

  try {
    const headers = { "Content-Type": "application/json" };
    if (currentToken) headers["Authorization"] = `Bearer ${currentToken}`;

    const res = await fetch(`${API_BASE_URL}/api/offres`, { headers });
    
    if (res.status === 401 || res.status === 403) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2.5rem; background: #ffffff; border-radius: 10px; border: 1px solid var(--border);">
          <p style="margin-bottom: 1rem; color: var(--text-muted);">Vous devez être connecté en tant que <strong>Candidat</strong> pour consulter les offres.</p>
          <button class="btn btn-primary" onclick="openLoginModal('candidat')">Se connecter comme Candidat</button>
        </div>`;
      return;
    }

    if (!res.ok) throw new Error("Erreur de chargement des offres");

    const offres = await res.json();
    if (!Array.isArray(offres) || offres.length === 0) {
      container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">Aucune offre d'emploi publiée pour le moment.</p>`;
      return;
    }

    container.innerHTML = offres
      .map(
        (o) => `
        <div class="card">
          <div>
            <div class="card-header">
              <h3 class="card-title">${escapeHtml(o.titre)}</h3>
              <span class="badge badge-success">Publiée</span>
            </div>
            <div class="card-company">🏢 ${escapeHtml(o.entreprise?.nomEntreprise || "Entreprise")}</div>
            <p class="card-desc">${escapeHtml(o.description)}</p>
          </div>
          <div class="card-footer">
            <span class="card-salary">${o.salaire ? o.salaire.toLocaleString("fr-FR") + " €/an" : "Salaire non précisé"}</span>
            <button class="btn btn-outline btn-sm" onclick="openOffreDetail('${o._id}')">Voir le détail</button>
          </div>
        </div>
      `
      )
      .join("");
  } catch (err) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--danger);">Impossible de contacter l'API (${escapeHtml(err.message)}).</p>`;
  }
}
async function openOffreDetail(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/offres/${id}`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });

    if (!res.ok) {
      showToast("Impossible de charger les détails de l'offre", "error");
      return;
    }

    currentOfferDetail = await res.json();

    document.getElementById("detail-titre").textContent = currentOfferDetail.titre;
    document.getElementById("detail-entreprise").textContent = currentOfferDetail.entreprise?.nomEntreprise || "Entreprise";
    document.getElementById("detail-salaire").textContent = currentOfferDetail.salaire
      ? `${currentOfferDetail.salaire.toLocaleString("fr-FR")} €/an`
      : "Non précisé";
    document.getElementById("detail-categorie").textContent = currentOfferDetail.categorie?.libelle || "Général";
    document.getElementById("detail-description").textContent = currentOfferDetail.description;
    document.getElementById("candidature-offre-id").value = currentOfferDetail._id;

    openModal("detail-modal");
  } catch (err) {
    showToast("Erreur de connexion", "error");
  }
}
async function loadProfilCandidat() {
  if (!currentToken || currentUser?.role !== "candidat") {
    showToast("Connectez-vous en tant que Candidat pour voir votre profil", "warning");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/candidats/me`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });

    if (res.ok) {
      const data = await res.json();
      document.getElementById("profil-nom").value = data.nom || "";
      document.getElementById("profil-prenom").value = data.prenom || "";
      document.getElementById("profil-email").value = data.email || "";
      document.getElementById("profil-tel").value = data.telephone || "";
      document.getElementById("profil-adresse").value = data.adresse || "";
      const cvStatusEl = document.getElementById("profil-cv-status");
      if (cvStatusEl) {
        if (data.cv) {
          cvStatusEl.innerHTML = `📄 CV enregistré : <a href="${API_BASE_URL}${data.cv}" target="_blank" style="color: var(--primary);">${escapeHtml(data.cv.split("/").pop())}</a>`;
        } else {
          cvStatusEl.innerHTML = `<span style="color: var(--text-muted);">Aucun CV téléversé pour le moment.</span>`;
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  if (!currentToken) return;

  const payload = {
    nom: document.getElementById("profil-nom").value.trim(),
    prenom: document.getElementById("profil-prenom").value.trim(),
    telephone: document.getElementById("profil-tel").value.trim(),
    adresse: document.getElementById("profil-adresse").value.trim(),
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/candidats/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      showToast("Profil mis à jour avec succès !", "success");
      currentUser.nom = data.user.nom;
      currentUser.prenom = data.user.prenom;
      localStorage.setItem("jobconnect_user", JSON.stringify(currentUser));
      updateAuthUI();
    } else {
      const msg = data.errors ? data.errors.join(", ") : data.error;
      showToast(msg || "Erreur de mise à jour", "error");
    }
  } catch (err) {
    showToast("Erreur de connexion", "error");
  }
}
async function handleCvUpload(file) {
  if (!currentToken || currentUser?.role !== "candidat") {
    showToast("Veuillez vous connecter en tant que Candidat", "error");
    return;
  }
  const allowed = [".pdf", ".docx", ".doc"];
  const isAllowed = allowed.some((ext) => file.name.toLowerCase().endsWith(ext));
  if (!isAllowed) {
    showToast("Format interdit : seuls PDF et DOCX sont autorisés", "error");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("Le fichier dépasse 5 Mo", "error");
    return;
  }

  const formData = new FormData();
  formData.append("cv", file);

  try {
    showToast("Téléversement en cours...", "info");
    const res = await fetch(`${API_BASE_URL}/api/candidats/me/cv`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      showToast("CV téléversé avec succès !", "success");
      loadProfilCandidat();
    } else {
      const msg = data.errors ? data.errors.join(", ") : data.error;
      showToast(msg || "Erreur lors du téléversement", "error");
    }
  } catch (err) {
    showToast("Erreur lors de l'envoi du CV", "error");
  }
}
async function handlePostuler(e) {
  e.preventDefault();
  if (!currentToken || currentUser?.role !== "candidat") {
    showToast("Connectez-vous en tant que Candidat pour postuler", "warning");
    return;
  }

  const offreId = document.getElementById("candidature-offre-id").value;
  const lettre = document.getElementById("candidature-lettre").value.trim();

  try {
    const res = await fetch(`${API_BASE_URL}/api/candidatures`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({
        offreId,
        lettreMotivation: lettre,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      showToast("Candidature envoyée avec succès !", "success");
      closeModal("detail-modal");
      document.getElementById("candidature-lettre").value = "";
    } else {
      showToast(data.error || "Impossible d'envoyer la candidature", "error");
    }
  } catch (err) {
    showToast("Erreur de connexion", "error");
  }
}
async function loadOffresEnAttente() {
  const container = document.getElementById("agent-offres-grid");
  if (!container) return;

  if (!currentToken || currentUser?.role !== "agent") {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2.5rem; background: #ffffff; border-radius: 10px; border: 1px solid var(--border);">
        <p style="margin-bottom: 1rem; color: var(--text-muted);">Espace réservé aux <strong>Agents</strong>.</p>
        <button class="btn btn-primary" onclick="openLoginModal('agent')">Se connecter comme Agent</button>
      </div>`;
    return;
  }

  container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Chargement des offres en attente...</p>`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/offres/en-attente`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });

    if (!res.ok) throw new Error("Erreur de récupération");

    const offres = await res.json();
    if (!Array.isArray(offres) || offres.length === 0) {
      container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">Aucune offre en attente de modération.</p>`;
      return;
    }

    container.innerHTML = offres
      .map(
        (o) => `
        <div class="card" id="card-agent-${o._id}">
          <div>
            <div class="card-header">
              <h3 class="card-title">${escapeHtml(o.titre)}</h3>
              <span class="badge badge-warning">En attente</span>
            </div>
            <div class="card-company">🏢 ${escapeHtml(o.entreprise?.nomEntreprise || "Entreprise")}</div>
            <p class="card-desc">${escapeHtml(o.description)}</p>
          </div>
          <div class="card-footer">
            <span class="card-salary">${o.salaire ? o.salaire.toLocaleString("fr-FR") + " €/an" : "N/C"}</span>
            <button class="btn btn-danger btn-sm" onclick="refuserOffre('${o._id}')">
              ❌ Refuser l'offre (US-13)
            </button>
          </div>
        </div>
      `
      )
      .join("");
  } catch (err) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--danger);">Erreur : ${escapeHtml(err.message)}</p>`;
  }
}

async function refuserOffre(id) {
  if (!confirm("Voulez-vous vraiment refuser cette offre ? Elle sera marquée comme REJETÉE.")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/offres/${id}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      },
    });

    const data = await res.json();
    if (res.ok) {
      showToast("Offre refusée avec succès !", "success");
      const card = document.getElementById(`card-agent-${id}`);
      if (card) {
        card.style.opacity = "0.4";
        card.querySelector(".card-footer").innerHTML = `<span class="badge badge-danger">Rejetée</span>`;
      }
    } else {
      showToast(data.error || "Impossible de refuser l'offre", "error");
    }
  } catch (err) {
    showToast("Erreur lors du refus de l'offre", "error");
  }
}
async function loadMesCandidatures() {
  const container = document.getElementById("mes-candidatures-list");
  if (!container) return;

  if (!currentToken || currentUser?.role !== "candidat") {
    container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Veuillez vous connecter en tant que Candidat.</p>`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/candidatures/mes-candidatures`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });

    if (!res.ok) throw new Error("Erreur");
    const list = await res.json();

    if (!Array.isArray(list) || list.length === 0) {
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Vous n'avez soumis aucune candidature pour le moment.</p>`;
      return;
    }

    container.innerHTML = list
      .map(
        (c) => `
        <div class="card" style="margin-bottom: 1rem;">
          <div class="card-header">
            <h3 class="card-title">${escapeHtml(c.offre?.titre || "Offre")}</h3>
            <span class="badge badge-warning">${escapeHtml(c.statut)}</span>
          </div>
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">
            Postulé le ${new Date(c.datePostulation).toLocaleDateString("fr-FR")}
          </p>
          ${c.lettreMotivation ? `<p style="font-size: 0.88rem; background: var(--bg-main); padding: 0.75rem; border-radius: 6px;"><em>« ${escapeHtml(c.lettreMotivation)} »</em></p>` : ""}
        </div>
      `
      )
      .join("");
  } catch (err) {
    container.innerHTML = `<p style="text-align: center; color: var(--danger);">Erreur de chargement</p>`;
  }
}
function openLoginModal(prefilledRole = "candidat") {
  document.getElementById("login-email").value =
    prefilledRole === "agent" ? "agent@jobconnect.local" : "candidat@jobconnect.local";
  document.getElementById("login-mdp").value = "Test12345";
  openModal("login-modal");
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const mdp = document.getElementById("login-mdp").value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, mdp }),
    });

    const data = await res.json();
    if (res.ok) {
      currentToken = data.token;
      currentUser = data.user;
      localStorage.setItem("jobconnect_token", currentToken);
      localStorage.setItem("jobconnect_user", JSON.stringify(currentUser));
      updateAuthUI();
      closeModal("login-modal");
      showToast(`Connecté avec succès en tant que ${currentUser.role} !`, "success");
      switchTab("catalogue");
    } else {
      showToast(data.error || "Identifiants incorrects", "error");
    }
  } catch (err) {
    showToast("Impossible de contacter le serveur", "error");
  }
}

function logout() {
  currentToken = null;
  currentUser = null;
  localStorage.removeItem("jobconnect_token");
  localStorage.removeItem("jobconnect_user");
  updateAuthUI();
  showToast("Vous avez été déconnecté.", "info");
  switchTab("catalogue");
}
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add("active");
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove("active");
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

