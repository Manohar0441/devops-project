"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface User {
  id: string;
  name: string;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]); 
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const [showMenu, setShowMenu] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [dark, setDark] = useState(true);

  const menu: MenuItem[] = [
    { id: "1", name: "Burger", price: 120 },
    { id: "2", name: "Pizza", price: 250 },
    { id: "3", name: "Pasta", price: 180 },
  ];

  // --- INITIAL LOAD ---
  useEffect(() => {
    setMounted(true);
    fetchUsers(); // 🆕 Call User Service on startup
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // --- API CALLS ---

  // 1. Fetch from User Service
  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users");
      setAllUsers(res.data);
      // Automatically set the first user as the active user for the demo
      if (res.data.length > 0) {
        setCurrentUser(res.data[0]);
      }
    } catch (err) {
      console.error("User Service unreachable via Ingress:", err);
    }
  };

  // 2. Post to Auth Service
  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await axios.post("/api/auth/login", loginData);
      localStorage.setItem("token", res.data.token);
      setIsLoggedIn(true);
      playSound(700, 300);
      setShowLogin(false);
      setToast("Login Successful");
    } catch (err) {
      setToast("Login Failed: Check Auth Service");
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 2000);
    }
  };

  // 3. Post to Order Service
  const placeOrder = async () => {
    if (!cart.length) return;
    setLoading(true);
    try {
      // ✅ Properly hitting the Order Service via Ingress
      await axios.post("/api/orders", {
        id: Date.now().toString(),
        user: currentUser,
        items: cart,
      });
      setToast("Order Placed Successfully!");
      setCart([]);
      playSound(1000, 200);
      setShowCart(false);
    } catch (err) {
      setToast("Order Failed: Check Order Service");
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  // --- UI LOGIC ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setCart([]);
    setToast("Logged Out");
    setTimeout(() => setToast(null), 2000);
  };

  const addToCart = (item: MenuItem) => {
    playSound(900, 80);
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setToast(`${item.name} added`);
    setTimeout(() => setToast(null), 2000);
  };

  const playSound = (freq = 600, duration = 120) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, duration);
    } catch {}
  };

  if (!mounted) return null;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function clearCart(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    throw new Error("Function not implemented.");
  }

  function increaseQty(id: string): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div onDoubleClick={() => !isLoggedIn && setShowLogin(true)} className={`${dark ? "bg-zinc-950 text-white" : "bg-zinc-100 text-black"} min-h-screen transition font-sans`}>
      
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-20 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-6 py-2 rounded-full text-sm shadow-xl z-50">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full backdrop-blur-md border-b border-zinc-800/50 z-50 px-6 py-4 flex justify-between items-center">
        <div>
          {currentUser ? (
            <span className="text-sm font-medium opacity-80 uppercase tracking-widest">
              {currentUser.name}’s Terminal
            </span>
          ) : (
            <span className="text-sm opacity-30 animate-pulse">Syncing Services...</span>
          )}
        </div>
        <div className="flex gap-6 items-center">
          <button onClick={() => setDark(!dark)} className="hover:scale-110 transition">{dark ? "☀️" : "🌙"}</button>
          {isLoggedIn && (
            <button onClick={handleLogout} className="text-xs uppercase tracking-tighter opacity-50 hover:opacity-100 transition">Logout</button>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="h-screen flex flex-col justify-center items-center text-center px-4">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-6xl md:text-8xl font-bold tracking-tighter">
          MicroOS.
        </motion.h1>
        <p className="mt-4 opacity-40 max-w-xs text-sm">A fully networked Kubernetes microservice demonstration.</p>
        
        {!isLoggedIn ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-8 text-xs opacity-30 uppercase tracking-[0.2em]">
            Double click to authenticate
          </motion.p>
        ) : (
          <div className="flex gap-4 mt-10">
            <button onClick={() => setShowMenu(true)} className="px-8 py-3 bg-white text-black rounded-full font-medium hover:bg-zinc-200 transition">View Menu</button>
            <button onClick={() => setShowCart(true)} className="px-8 py-3 border border-zinc-700 rounded-full font-medium hover:bg-white/5 transition">
              Cart ({cart.reduce((n, i) => n + i.quantity, 0)})
            </button>
          </div>
        )}
      </section>

      {/* LOGIN MODAL */}
      <AnimatePresence>
        {showLogin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-sm space-y-6 shadow-2xl">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">Security Check</h2>
                <p className="text-sm opacity-40">Identify yourself to MicroOS</p>
              </div>
              <div className="space-y-3">
                <input placeholder="Username" className="w-full p-4 bg-black rounded-xl border border-zinc-800 focus:border-white outline-none transition" onChange={(e) => setLoginData({ ...loginData, username: e.target.value })} />
                <input type="password" placeholder="Password" className="w-full p-4 bg-black rounded-xl border border-zinc-800 focus:border-white outline-none transition" onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowLogin(false)} className="flex-1 py-4 opacity-50">Cancel</button>
                <button onClick={handleLogin} className="flex-1 bg-white text-black rounded-xl font-bold py-4 active:scale-95 transition">
                  {loading ? "..." : "Confirm"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MENU MODAL */}
      <AnimatePresence>
        {showMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex justify-center items-center p-4">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-zinc-900 text-white p-8 rounded-[2.5rem] w-full max-w-lg space-y-6 shadow-2xl border border-zinc-800">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Catalogue</h2>
                <button onClick={() => setShowMenu(false)} className="opacity-40">Close</button>
              </div>
              <div className="space-y-4">
                {menu.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-black/40 p-5 rounded-2xl border border-zinc-800/50">
                    <div>
                      <p className="font-semibold text-lg">{item.name}</p>
                      <p className="text-sm opacity-40">Standard Unit · ₹{item.price}</p>
                    </div>
                    <button onClick={() => addToCart(item)} className="px-6 py-2 bg-white text-black font-bold rounded-full text-sm hover:scale-105 transition">Add</button>
                  </div>
                ))}
              </div>
              <button onClick={() => { setShowMenu(false); setShowCart(true); }} className="w-full bg-zinc-800 py-4 rounded-2xl font-medium">Review Cart →</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CART/ORDER MODAL */}
      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex justify-center items-center p-4">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-zinc-900 text-white p-8 rounded-[2.5rem] w-full max-w-lg space-y-6 shadow-2xl border border-zinc-800">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Checkout</h2>
                <button onClick={() => setShowCart(false)} className="opacity-40">Close</button>
              </div>

              {!cart.length ? (
                <div className="py-20 text-center opacity-30 italic">No assets selected.</div>
              ) : (
                <>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs opacity-40">Unit Price: ₹{item.price}</p>
                        </div>
                        <div className="flex items-center gap-4 bg-black px-3 py-1 rounded-full border border-zinc-800">
                          <button onClick={() => increaseQty(item.id)} className="text-lg">-</button>
                          <span className="font-mono text-sm">{item.quantity}</span>
                          <button onClick={() => increaseQty(item.id)} className="text-lg">+</button>
                        </div>
                        <span className="w-20 text-right font-semibold">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-end pt-4">
                    <span className="text-sm opacity-40 uppercase">Total Payable</span>
                    <span className="text-4xl font-bold tracking-tighter text-white">₹{total}</span>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button onClick={clearCart} className="flex-1 border border-zinc-800 py-4 rounded-2xl opacity-50 hover:opacity-100 transition">Reset</button>
                    <button onClick={placeOrder} className="flex-[2] bg-white text-black py-4 rounded-2xl font-bold hover:bg-zinc-200 active:scale-95 transition">
                      {loading ? "Processing..." : "Place Order"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}