const API_URL = "http://localhost:3000";

// 🔄 Changer entre formulaire d'inscription et connexion
function toggleAuthForms() {
    document.getElementById("registerContainer").style.display =
        document.getElementById("registerContainer").style.display === "none" ? "block" : "none";

    document.getElementById("loginContainer").style.display =
        document.getElementById("loginContainer").style.display === "none" ? "block" : "none";
}

// 🔑 Inscription utilisateur
document.getElementById("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
        alert("Inscription réussie, veuillez vous connecter.");
        toggleAuthForms();
    } else {
        alert("Erreur d'inscription : " + data.error);
    }
});

// 🔑 Connexion utilisateur
document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
        localStorage.setItem("token", data.token);
        showApp();
        fetchUsers();
    } else {
        alert("Erreur de connexion : " + data.error);
    }
});

// ✅ Afficher l'application après connexion
function showApp() {
    document.getElementById("registerContainer").style.display = "none";
    document.getElementById("loginContainer").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
}

// ❌ Déconnexion utilisateur
document.getElementById("logoutButton").addEventListener("click", () => {
    localStorage.removeItem("token");
    location.reload();
});

// 🔄 Charger les utilisateurs (avec gestion des boutons d'action)
async function fetchUsers() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const response = await fetch(`${API_URL}/protected/users`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (response.ok) {
        const users = await response.json();
        const usersList = document.getElementById("usersList");
        usersList.innerHTML = "";

        users.forEach(user => {
            usersList.innerHTML += `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.nom}</td>
                    <td>${user.email}</td>
                    <td>
                        <button onclick="editUser(${user.id}, '${user.nom}', '${user.email}')">Modifier</button>
                        <button onclick="deleteUser(${user.id})">Supprimer</button>
                    </td>
                </tr>
            `;
        });
    } else {
        alert("Erreur : Accès refusé. Connectez-vous.");
    }
}

// ✏️ Modifier un utilisateur (Affichage du formulaire avec les infos)
function editUser(id, nom, email) {
    console.log(`Modification utilisateur ID: ${id}, Nom: ${nom}, Email: ${email}`);
    document.getElementById("editId").value = id;
    document.getElementById("editNom").value = nom;
    document.getElementById("editEmail").value = email;
    document.getElementById("editForm").style.display = "block";
}

// 📝 Mettre à jour un utilisateur dans la base de données
document.getElementById("editForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("editId").value;
    const nom = document.getElementById("editNom").value;
    const email = document.getElementById("editEmail").value;
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/users/${id}`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ nom, email })
    });

    if (response.ok) {
        document.getElementById("editForm").reset();
        document.getElementById("editForm").style.display = "none";
        fetchUsers();
    } else {
        alert("Erreur lors de la modification !");
    }
});

// ➕ Ajouter un utilisateur
document.getElementById("userForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const nom = document.getElementById("nom").value;
    const email = document.getElementById("email").value;
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ nom, email })
    });

    if (response.ok) {
        document.getElementById("userForm").reset();
        fetchUsers();
    } else {
        const errorMessage = await response.json();
        alert("Erreur lors de l'ajout : " + errorMessage.error);
    }
});

// ❌ Supprimer un utilisateur
async function deleteUser(id) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: { 
            "Authorization": `Bearer ${token}`
        }
    });

    if (response.ok) {
        fetchUsers();
    } else {
        const errorMessage = await response.json();
        alert("Erreur lors de la suppression : " + errorMessage.error);
    }
}

// 🔄 Vérifier le rôle de l'utilisateur après connexion
async function checkUserRole() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = JSON.parse(atob(token.split(".")[1])); // Décodage du token
    console.log("User role:", payload.role);

    if (payload.role !== "admin") {
        alert("Vous n'avez pas les permissions pour ajouter des utilisateurs.");
        document.getElementById("userForm").style.display = "none";
    }
}

// Vérifier le rôle après connexion
document.addEventListener("DOMContentLoaded", () => {
    console.log("Script chargé !");
    console.log("editUser est défini ?", typeof editUser !== "undefined");
    checkUserRole();
    fetchUsers();
});
