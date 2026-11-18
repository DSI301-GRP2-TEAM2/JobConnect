let API_BASE_URL = localStorage.getItem("jobconnect_api_url") || "http://localhost:8080";
let currentUser = null;
let currentToken = null;
let allOffres = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

document.addEventListener("DOMContentLoaded", () => {
  initApiUrl();
  loadSavedAuth();
  setupEventListeners();
  loadOffresPubliees();
});

function initApiUrl() {
  const urlInput = document.getElementById("api-url-input");
  if (urlInput) {
    urlInput.value = API_BASE_URL;
    urlInput.addEventListener("change", (e) => {
      API_BASE_URL = e.target.value.trim().replace(/\/$/, "");
      localStorage.setItem("jobconnect_api_url", API_BASE_URL);
      showToast("URL API mise à jour : " + API_BASE_URL, "info");
      loadOffresPubliees();
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

  if (currentUser && currentToken) {
    userInfo.style.display = "flex";
    authBtns.style.display = "none";
    userNameEl.textContent = `${currentUser.prenom || ""} ${currentUser.nom || ""}`.trim() || currentUser.email;
    userRoleEl.textContent = currentUser.role;
    userRoleEl.className = `role-pill role-${currentUser.role}`;
  } else {
    userInfo.style.display = "none";
    authBtns.style.display = "flex";
  }
}

function setupEventListeners() {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
}

async function loadOffresPubliees() {
  const container = document.getElementById("offres-grid");
  const paginContainer = document.getElementById("pagination-container");
  if (!container) return;

  container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">Chargement des offres...</p>`;
  if (paginContainer) paginContainer.innerHTML = "";

  try {
    const headers = { "Content-Type": "application/json" };
    if (currentToken) {
      headers["Authorization"] = `Bearer ${currentToken}`;
    }

    const res = await fetch(`${API_BASE_URL}/api/offres`, { headers });

    if (res.status === 401 || res.status === 403) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2.5rem; background: #ffffff; border-radius: 10px; border: 1px solid var(--border);">
          <p style="margin-bottom: 1rem; color: var(--text-muted);">Vous devez être connecté en tant que <strong>Candidat</strong> pour consulter les offres d'emploi.</p>
          <button class="btn btn-primary" onclick="openLoginModal()">Se connecter</button>
        </div>`;
      return;
    }

    if (!res.ok) throw new Error("Erreur de chargement des offres");

    allOffres = await res.json();
    if (!Array.isArray(allOffres) || allOffres.length === 0) {
      container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">Aucune offre d'emploi publiée pour le moment.</p>`;
      return;
    }

    currentPage = 1;
    renderOffres();
  } catch (err) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--danger); padding: 2rem;">Impossible de contacter l'API (${escapeHtml(err.message)}).</p>`;
  }
}

function renderOffres() {
  const container = document.getElementById("offres-grid");
  if (!container) return;

  const totalPages = Math.ceil(allOffres.length / ITEMS_PER_PAGE);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentSlice = allOffres.slice(start, start + ITEMS_PER_PAGE);

  container.innerHTML = currentSlice
    .map((o) => {
      const dateStr = o.dateCreation
        ? `Publiée le ${new Date(o.dateCreation).toLocaleDateString("fr-FR")}`
        : "";
      const salaireStr = o.salaire
        ? `${o.salaire.toLocaleString("fr-FR")} €/an`
        : "Salaire non précisé";
      const catLibelle = o.categorie?.libelle || "Général";
      const entNom = o.entreprise?.nomEntreprise || "Entreprise";

      return `
        <div class="card">
          <div>
            <div class="card-header">
              <h3 class="card-title">${escapeHtml(o.titre)}</h3>
              <span class="badge badge-success">${escapeHtml(catLibelle)}</span>
            </div>
            <div class="card-company">🏢 ${escapeHtml(entNom)}</div>
            <p class="card-desc">${escapeHtml(o.description)}</p>
          </div>
          <div class="card-footer">
            <span class="card-salary">${escapeHtml(salaireStr)}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(dateStr)}</span>
          </div>
        </div>
      `;
    })
    .join("");

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const container = document.getElementById("pagination-container");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  html += `<button class="page-btn" ${currentPage === 1 ? "disabled" : ""} onclick="goToPage(${currentPage - 1})">&lt;</button>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? "active" : ""}" onclick="goToPage(${i})">${i}</button>`;
  }

  html += `<button class="page-btn" ${currentPage === totalPages ? "disabled" : ""} onclick="goToPage(${currentPage + 1})">&gt;</button>`;

  container.innerHTML = html;
}

function goToPage(page) {
  const totalPages = Math.ceil(allOffres.length / ITEMS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderOffres();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openLoginModal() {
  const emailInput = document.getElementById("login-email");
  const mdpInput = document.getElementById("login-mdp");
  if (emailInput) emailInput.value = "";
  if (mdpInput) mdpInput.value = "";
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
      loadOffresPubliees();
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
  loadOffresPubliees();
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