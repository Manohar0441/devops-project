const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// ✅ Root (optional)
app.get("/", (req, res) => {
  res.send("Auth Service Running");
});
  
// 🔥 IMPORTANT — PREFIX WITH /api/auth
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "1234") {
    return res.json({
      message: "Login Successful",
      token: "abc123",
    });
  }

  res.status(401).json({ message: "Invalid Credentials" });
});

app.listen(3001, () => {
  console.log("Auth Service running on port 3001");
});