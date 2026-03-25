"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// ---- TYPES ----
type MenuItem = {
  id: string;
  name: string;
  price: number;
};

type CartItem = MenuItem & {
  quantity: number;
};

type User = {
  id: string;
  name: string;
};

// ---- HELPERS ----
const safeString = (value: any, fallback: string) => {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

const normalizeUsers = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [showMenu, setShowMenu] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const [services, setServices] = useState({
    auth: "checking",
    users: "checking",
    orders: "checking",
  });

  const menu: MenuItem[] = [
    { id: "1", name: "Burger", price: 120 },
    { id: "2", name: "Pizza", price: 250 },
    { id: "3", name: "Pasta", price: 180 },
  ];

  useEffect(() => {
    setMounted(true);
    fetchUsers();
    checkServices();

    const interval = setInterval(checkServices, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users");
      const rawUsers = normalizeUsers(res.data);

      const sanitizedUsers: User[] = rawUsers.map((u: any, index: number) => ({
        id: safeString(u?.id, `user-${index}`),
        name: safeString(u?.name, "Unknown"),
      }));

      setAllUsers(sanitizedUsers);
      if (sanitizedUsers.length > 0) setCurrentUser(sanitizedUsers[0]);

      setServices((s) => ({ ...s, users: "up" }));
    } catch {
      setServices((s) => ({ ...s, users: "down" }));
    }
  };

  const checkServices = async () => {
    try {
      await axios.get("/api/auth/health");
      setServices((s) => ({ ...s, auth: "up" }));
    } catch {
      setServices((s) => ({ ...s, auth: "down" }));
    }

    try {
      await axios.get("/api/orders");
      setServices((s) => ({ ...s, orders: "up" }));
    } catch {
      setServices((s) => ({ ...s, orders: "down" }));
    }
  };

  const placeOrder = async () => {
    if (!cart.length || !currentUser) return;

    try {
      await axios.post("/api/orders", {
        id: Date.now().toString(),
        user: currentUser,
        items: cart,
      });

      setCart([]);
      setShowCart(false);
    } catch {}
  };

  const clearCart = () => setCart([]);

  const increaseQty = (id: string, type: "inc" | "dec") => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                type === "inc"
                  ? item.quantity + 1
                  : Math.max(1, item.quantity - 1),
            }
          : item
      )
    );
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  if (!mounted) return null;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="bg-zinc-950 text-white min-h-screen font-sans">

      {/* NAV */}
      <nav className="p-6 flex justify-between items-center border-b border-zinc-800">
        <span className="font-bold tracking-wide">MicroOS</span>
        <span className="text-sm opacity-60">
          {currentUser ? currentUser.name : "No User"}
        </span>
      </nav>

      {/* HERO */}
      <section className="text-center py-24">
        <h1 className="text-6xl font-bold tracking-tight">MicroOS</h1>
        <p className="opacity-40 mt-2">Kubernetes Microservices Demo</p>
      </section>

      {/* CLUSTER STATUS */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-3xl font-semibold mb-8">Cluster Status</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(services).map(([key, status]) => (
            <div key={key} className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
              <p className="uppercase text-xs opacity-40 mb-2">{key} service</p>
              <p className={`text-2xl font-bold ${
                status === "up" ? "text-green-400" : status === "down" ? "text-red-400" : "text-yellow-400"
              }`}>
                {status.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* BUTTON */}
      <div className="text-center">
        <button onClick={() => setShowMenu(true)} className="px-6 py-3 bg-white text-black rounded-full">
          Open Menu
        </button>
      </div>

      {/* 🔥 IMPROVED PREMIUM MENU MODAL (STRUCTURED + CLEAN + BLUR FIX) */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[60] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-zinc-900/95 border border-zinc-800 p-8 rounded-3xl w-full max-w-2xl shadow-2xl"
            >

              {/* HEADER */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Menu</h2>
                  <p className="text-sm text-zinc-400">Select items from the system</p>
                </div>
                <button
                  onClick={() => setShowMenu(false)}
                  className="text-sm px-3 py-1 rounded-full border border-zinc-700 hover:bg-white/10 transition"
                >
                  Close
                </button>
              </div>

              {/* MENU GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                {menu.map((item) => (
                  <div
                    key={item.id}
                    className="group flex flex-col justify-between bg-black/40 p-5 rounded-2xl border border-zinc-800 hover:border-white/20 transition"
                  >
                    <div>
                      <p className="font-semibold text-lg">{item.name}</p>
                      <p className="text-sm text-zinc-400">Standard Unit</p>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <span className="text-lg font-bold">₹{item.price}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="px-4 py-2 bg-white text-black rounded-full text-sm font-semibold hover:scale-105 transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-center">
                <p className="text-sm text-zinc-400">
                  {cart.length} items selected
                </p>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowCart(true);
                  }}
                  className="px-6 py-3 bg-white text-black rounded-full font-semibold hover:scale-105 transition"
                >
                  Review Cart →
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔥 IMPROVED CART MODAL (PREMIUM UI) */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[70] flex justify-center items-center p-6"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-zinc-900/95 border border-zinc-800 p-8 rounded-3xl w-full max-w-xl shadow-2xl"
            >

              {/* HEADER */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-bold">Cart</h2>
                  <p className="text-sm text-zinc-400">Review your selected items</p>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-sm px-3 py-1 rounded-full border border-zinc-700 hover:bg-white/10 transition"
                >
                  Close
                </button>
              </div>

              {/* ITEMS */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {cart.length === 0 ? (
                  <p className="text-center text-zinc-500 py-10">Your cart is empty</p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-zinc-800"
                    >
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-zinc-400">₹{item.price} each</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => increaseQty(item.id, "dec")}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-white/10"
                        >
                          -
                        </button>

                        <span className="font-mono">{item.quantity}</span>

                        <button
                          onClick={() => increaseQty(item.id, "inc")}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-white/10"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right font-semibold">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* TOTAL + ACTIONS */}
              <div className="mt-6 pt-4 border-t border-zinc-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400 uppercase">Total</span>
                  <span className="text-2xl font-bold">₹{total}</span>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={clearCart}
                    className="flex-1 border border-zinc-700 py-3 rounded-full hover:bg-white/10 transition"
                  >
                    Clear
                  </button>

                  <button
                    onClick={placeOrder}
                    className="flex-[2] bg-white text-black py-3 rounded-full font-semibold hover:scale-105 transition"
                  >
                    Place Order
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
