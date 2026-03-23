const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(cors());

// ✅ Health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});

let orders = [];

// ✅ Root (optional)
app.get("/", (req, res) => {
    res.send("Order Service Running");
});

// 🔥 PREFIXED WITH /api/orders
app.get("/api/orders", (req, res) => {
    res.json(orders);
});

// 🔥 PREFIXED WITH /api/orders
app.post("/api/orders", (req, res) => {
    const order = req.body;
    orders.push(order);
    res.json({ message: "Order created", order });
});

app.listen(3003, () => {
    console.log("Order Service running on port 3003");
});