const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

// ✅ Health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});

let users = [
    { id: 1, name: "Manohar" }
];

// ✅ Root (optional)
app.get("/", (req, res) => {
    res.send("User Service Running");
});

// 🔥 PREFIXED WITH /api/users
app.get("/api/users", (req, res) => {
    res.json(users);
});

// 🔥 PREFIXED WITH /api/users
app.post("/api/users", (req, res) => {
    const user = req.body;
    users.push(user);
    res.json({ message: "User added", user });
});

app.listen(3002, () => {
    console.log("User Service running on port 3002");
});