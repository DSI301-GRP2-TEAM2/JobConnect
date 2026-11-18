const app = angular.module("jobConnectApp", []);

app.constant("ENV", {
  apiUrl: (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:8080"
    : "https://jobconnect-team2-api.azurewebsites.net"
});

app.controller("JobConnectController", function($http, $scope, $window, ENV) {
  const vm = this;

  vm.apiUrl = ENV.apiUrl;
  vm.currentUser = null;
  vm.currentToken = null;

  vm.allOffres = [];
  vm.pagedOffres = [];
  vm.currentPage = 1;
  vm.itemsPerPage = 5;
  vm.totalPages = 1;
  vm.pages = [];
  vm.loading = false;

  vm.showLoginModal = false;
  vm.loginEmail = "";
  vm.loginMdp = "";

  vm.init = function() {
    vm.loadSavedAuth();
    if (vm.currentToken) {
      vm.loadOffresPubliees();
    }
  };

  vm.loadSavedAuth = function() {
    vm.currentToken = localStorage.getItem("jobconnect_token");
    const storedUser = localStorage.getItem("jobconnect_user");
    if (vm.currentToken && storedUser) {
      try {
        vm.currentUser = JSON.parse(storedUser);
      } catch {
        vm.logout();
      }
    }
  };

  vm.openLoginModal = function() {
    vm.loginEmail = "";
    vm.loginMdp = "";
    vm.showLoginModal = true;
  };

  vm.closeLoginModal = function() {
    vm.showLoginModal = false;
  };

  vm.submitLogin = function() {
    const payload = {
      email: vm.loginEmail ? vm.loginEmail.trim() : "",
      mdp: vm.loginMdp || "",
    };

    $http.post(vm.apiUrl + "/api/auth/login", payload)
      .then(function(res) {
        vm.currentToken = res.data.token;
        vm.currentUser = res.data.user;
        localStorage.setItem("jobconnect_token", vm.currentToken);
        localStorage.setItem("jobconnect_user", JSON.stringify(vm.currentUser));
        vm.closeLoginModal();
        vm.showToast("Connecté avec succès en tant que " + vm.currentUser.role, "success");
        vm.loadOffresPubliees();
      })
      .catch(function(err) {
        const msg = err.data && err.data.error ? err.data.error : "Identifiants incorrects";
        vm.showToast(msg, "error");
      });
  };

  vm.logout = function() {
    vm.currentToken = null;
    vm.currentUser = null;
    localStorage.removeItem("jobconnect_token");
    localStorage.removeItem("jobconnect_user");
    vm.allOffres = [];
    vm.pagedOffres = [];
    vm.showToast("Vous avez été déconnecté.", "info");
  };

  vm.loadOffresPubliees = function() {
    vm.loading = true;
    const config = {
      headers: {
        "Authorization": "Bearer " + vm.currentToken
      }
    };

    $http.get(vm.apiUrl + "/api/offres", config)
      .then(function(res) {
        vm.loading = false;
        vm.allOffres = Array.isArray(res.data) ? res.data : [];
        vm.currentPage = 1;
        vm.updatePagination();
      })
      .catch(function(err) {
        vm.loading = false;
        if (err.status === 401 || err.status === 403) {
          vm.showToast("Accès réservé aux candidats", "error");
        } else {
          vm.showToast("Impossible de charger les offres", "error");
        }
      });
  };

  vm.updatePagination = function() {
    vm.totalPages = Math.ceil(vm.allOffres.length / vm.itemsPerPage) || 1;
    if (vm.currentPage > vm.totalPages) vm.currentPage = vm.totalPages;
    const start = (vm.currentPage - 1) * vm.itemsPerPage;
    vm.pagedOffres = vm.allOffres.slice(start, start + vm.itemsPerPage);

    vm.pages = [];
    for (let i = 1; i <= vm.totalPages; i++) {
      vm.pages.push(i);
    }
  };

  vm.goToPage = function(page) {
    if (page < 1 || page > vm.totalPages) return;
    vm.currentPage = page;
    vm.updatePagination();
    $window.scrollTo({ top: 0, behavior: "smooth" });
  };

  vm.formatSalary = function(salaire) {
    if (!salaire) return "Salaire non précisé";
    return Number(salaire).toLocaleString("fr-FR") + " €/an";
  };

  vm.formatDate = function(d) {
    if (!d) return "";
    return new Date(d).toLocaleDateString("fr-FR");
  };

  vm.showToast = function(message, type) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast toast-" + (type || "info");
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s";
      setTimeout(function() { toast.remove(); }, 300);
    }, 3500);
  };

  vm.init();
});