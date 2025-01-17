require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";


const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestion_utilisateurs'
});

db.connect(err => {
    if (err) {
        console.error('❌ Erreur de connexion à MySQL :', err);
        return;
    }
    console.log('✅ Connecté à MySQL avec succès');
});


const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).json({ error: "Accès refusé, token manquant." });

    jwt.verify(token.split(" ")[1], SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Token invalide" });
        req.user = user;
        next();
    });
};


const verifyAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Accès refusé, admin requis." });
    }
    next();
};


app.post('/register', async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === "admin" ? "admin" : "user"; // Si non précisé, user par défaut

    db.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, userRole], (err, result) => {
        if (err) return res.status(500).json({ error: "Erreur lors de l'inscription" });
        res.json({ message: "Utilisateur inscrit !" });
    });
});


app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" });

    db.query('SELECT id, email, password, role FROM users WHERE email = ?', [email], async (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ error: "Utilisateur non trouvé" });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(400).json({ error: "Mot de passe incorrect" });

        console.log(`✅ Utilisateur connecté : ${user.email}, rôle : ${user.role}`);

        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.json({ message: "Connexion réussie", token, role: user.role });
    });
});


app.get('/protected/users', verifyToken, verifyAdmin, (req, res) => {
    db.query('SELECT * FROM utilisateurs', (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

app.post('/users', verifyToken, verifyAdmin, (req, res) => {
    const { nom, email } = req.body;
    db.query('INSERT INTO utilisateurs (nom, email) VALUES (?, ?)', [nom, email], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Utilisateur ajouté !', id: result.insertId });
    });
});

app.put('/users/:id', verifyToken, verifyAdmin, (req, res) => {
    const { nom, email } = req.body;
    db.query('UPDATE utilisateurs SET nom=?, email=? WHERE id=?', [nom, email, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Utilisateur modifié !' });
    });
});

app.delete('/users/:id', verifyToken, verifyAdmin, (req, res) => {
    db.query('DELETE FROM utilisateurs WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Utilisateur supprimé !' });
    });
});


app.use(express.static(path.join(__dirname, "frontend")));


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));
