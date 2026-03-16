import { useState, useEffect, createContext, useContext } from "react";

const API = "http://localhost:5000/api";

// ─── AUTH CONTEXT ────────────────────────────────────────────────
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  const decodeToken = (t) => {
    try { return JSON.parse(atob(t.split(".")[1])); } catch { return null; }
  };

  useEffect(() => {
    if (token) setUser(decodeToken(token));
    else setUser(null);
  }, [token]);

  const login = (t) => { localStorage.setItem("token", t); setToken(t); };
  const logout = () => { localStorage.removeItem("token"); setToken(null); };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── API HELPER ───────────────────────────────────────────────────
async function apiFetch(path, options = {}, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error");
  return data;
}

// ─── TOAST ────────────────────────────────────────────────────────
let toastCounter = 0; // ← ประกาศนอก function

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (message, type = "info") => {
    const id = `${Date.now()}-${Math.random()}`; // ← เพิ่ม Math.random()
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  };
  const remove = (id) => setToasts((p) => p.filter((t) => t.id !== id));
  return { toasts, remove, success: (m) => add(m, "success"), error: (m) => add(m, "error"), info: (m) => add(m, "info") };
}

function ToastContainer({ toasts, remove }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl cursor-pointer text-sm font-semibold transition-all
            ${t.type === "error" ? "bg-red-600 text-white" : t.type === "success" ? "bg-emerald-500 text-white" : "bg-gray-800 text-white"}`}
          style={{ animation: "slideIn 0.3s ease", minWidth: 260 }}
        >
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "•"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "popIn 0.25s ease" }}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-lg font-bold">✕</button>
        </div>
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>
  );
}

// ─── LOADING ──────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
    </div>
  );
}

// ─── INPUT / BUTTON COMPONENTS ────────────────────────────────────
function Input({ label, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">{label}</label>}
      <input
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 outline-none text-sm text-gray-800 font-medium transition-colors bg-gray-50 focus:bg-white placeholder-gray-400"
        {...props}
      />
    </div>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────
function Nav({ page, setPage, cartCount }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { key: "products", label: "สินค้า", icon: "🖥️" },
    { key: "cart", label: "ตะกร้า", icon: "🛒", badge: cartCount },
    { key: "orders", label: "คำสั่งซื้อ", icon: "📦" },
    { key: "payments", label: "ชำระเงิน", icon: "💳" },
    { key: "coupons", label: "คูปอง", icon: "🎫" },
    { key: "profile", label: "โปรไฟล์", icon: "👤" },
    ...(user?.role === "admin" ? [{ key: "admin", label: "Admin", icon: "⚙️" }] : []),
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white border-b-2 border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage("products")}>
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white text-lg font-black">T</span>
            </div>
            <div>
              <span className="text-gray-900 font-black text-lg tracking-tight">TECH</span>
              <span className="text-red-600 font-black text-lg tracking-tight">ZONE</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
                  ${page === item.key
                    ? "bg-red-600 text-white shadow-md shadow-red-200"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-black rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* User + Logout */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-black text-gray-900">{user?.role?.toUpperCase()}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg text-sm font-bold border-2 border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              ออกจากระบบ
            </button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)}>
            <div className="w-5 h-0.5 bg-gray-700 mb-1" />
            <div className="w-5 h-0.5 bg-gray-700 mb-1" />
            <div className="w-5 h-0.5 bg-gray-700" />
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <button key={item.key} onClick={() => { setPage(item.key); setMobileOpen(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-left transition-all
                ${page === item.key ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              {item.icon} {item.label}
              {item.badge > 0 && <span className="ml-auto bg-white text-red-600 text-xs font-black px-1.5 py-0.5 rounded-full">{item.badge}</span>}
            </button>
          ))}
          <button onClick={logout} className="mt-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 border-2 border-red-100 hover:bg-red-50 transition-all">ออกจากระบบ</button>
        </div>
      )}
    </nav>
  );
}

// ─── AUTH PAGES ───────────────────────────────────────────────────
function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-50 rounded-full opacity-60 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md" style={{ animation: "popIn 0.3s ease" }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl shadow-xl shadow-red-200 mb-4">
            <span className="text-white text-3xl font-black">T</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            TECH<span className="text-red-600">ZONE</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">{subtitle}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 border border-gray-100 p-8">
          <h2 className="text-2xl font-black text-gray-900 mb-6">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}

function LoginPage({ setPage, toast }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify(form) });
      login(data.token);
      toast.success("เข้าสู่ระบบสำเร็จ!");
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="เข้าสู่ระบบ" subtitle="ร้านค้าอุปกรณ์คอมพิวเตอร์ครบวงจร">
      <Input label="อีเมล" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
      <Input label="รหัสผ่าน" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />

      <button
        onClick={submit} disabled={loading}
        className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all text-sm disabled:opacity-60 mt-2"
      >
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ →"}
      </button>

      <div className="mt-5 flex items-center justify-between text-sm">
        <button onClick={() => setPage("register")} className="text-red-600 font-bold hover:underline">สมัครสมาชิก</button>
        <button onClick={() => setPage("forgot")} className="text-gray-400 hover:text-gray-600 font-medium">ลืมรหัสผ่าน?</button>
      </div>
    </AuthLayout>
  );
}

function RegisterPage({ setPage, toast }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await apiFetch("/auth/register", { method: "POST", body: JSON.stringify(form) });
      toast.success("สมัครสำเร็จ! กรุณาเข้าสู่ระบบ");
      setPage("login");
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="สมัครสมาชิก" subtitle="สร้างบัญชีเพื่อเริ่มช้อปปิ้ง">
      <Input label="ชื่อ" type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="ชื่อของคุณ" />
      <Input label="อีเมล" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
      <Input label="รหัสผ่าน" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
      <button onClick={submit} disabled={loading}
        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all text-sm disabled:opacity-60 mt-2">
        {loading ? "กำลังสมัคร..." : "สมัครสมาชิก →"}
      </button>
      <div className="mt-4 text-center text-sm">
        <button onClick={() => setPage("login")} className="text-red-600 font-bold hover:underline">มีบัญชีแล้ว? เข้าสู่ระบบ</button>
      </div>
    </AuthLayout>
  );
}

function ForgotPage({ setPage, toast }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      toast.success("ส่งลิงก์รีเซ็ตแล้ว (ดูใน Console)");
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="ลืมรหัสผ่าน" subtitle="กรอกอีเมลเพื่อรับลิงก์รีเซ็ต">
      <Input label="อีเมล" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
      <button onClick={submit} disabled={loading}
        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all text-sm disabled:opacity-60 mt-2">
        {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ต →"}
      </button>
      <div className="mt-4 text-center text-sm">
        <button onClick={() => setPage("login")} className="text-gray-400 hover:text-gray-600 font-medium">← กลับไปหน้าเข้าสู่ระบบ</button>
      </div>
    </AuthLayout>
  );
}

// ─── PRODUCTS PAGE ────────────────────────────────────────────────
const CATEGORY_ICONS = {
  CPU: "🔲", GPU: "🎮", RAM: "📊", SSD: "💾", Monitor: "🖥️",
  Keyboard: "⌨️", Mouse: "🖱️", Case: "🗂️", PSU: "⚡", Cooling: "❄️",
};

function ProductCard({ p, onAddCart, onEdit, onDelete, canManage }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden group
        ${hover ? "border-red-300 shadow-xl shadow-red-100 -translate-y-1" : "border-gray-100 shadow-sm"}`}
    >
      {/* Image / Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        {p.image ? (
          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-30">
            <span className="text-6xl">🖥️</span>
          </div>
        )}
        {p.stock === 0 && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="bg-red-100 text-red-600 font-black text-sm px-3 py-1 rounded-full">หมดสต็อก</span>
          </div>
        )}
        {p.stock > 0 && p.stock <= 5 && (
          <div className="absolute top-3 right-3">
            <span className="bg-orange-100 text-orange-600 font-bold text-xs px-2 py-1 rounded-full">เหลือน้อย</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-black text-gray-900 text-base mb-1 truncate">{p.name}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed">{p.description || "ไม่มีคำอธิบาย"}</p>

        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-black text-red-600">฿{p.price?.toLocaleString()}</span>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full
            ${p.stock > 5 ? "bg-green-100 text-green-600" : p.stock > 0 ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"}`}>
            {p.stock > 0 ? `${p.stock} ชิ้น` : "หมด"}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onAddCart(p._id)}
            disabled={p.stock === 0}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-red-200 flex items-center justify-center gap-1.5"
          >
            <span>🛒</span> เพิ่มลงตะกร้า
          </button>
          {canManage && (
            <button onClick={() => onEdit(p)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 transition-colors">✏️</button>
          )}
          {canManage && (
            <button onClick={() => onDelete(p._id)} className="w-10 h-10 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-center text-red-500 transition-colors">🗑️</button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductsPage({ toast }) {
  const { token, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "", image: "" });
  const [search, setSearch] = useState("");

  const canManage = user?.role === "admin" || user?.role === "owner";

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const d = await apiFetch("/products"); setProducts(d); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setForm({ name: "", description: "", price: "", stock: "", image: "" }); setEditProduct(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ name: p.name, description: p.description || "", price: p.price, stock: p.stock, image: p.image || "" }); setEditProduct(p); setShowModal(true); };

  const save = async () => {
    try {
      if (editProduct) await apiFetch(`/products/${editProduct._id}`, { method: "PUT", body: JSON.stringify(form) }, token);
      else await apiFetch("/products", { method: "POST", body: JSON.stringify(form) }, token);
      toast.success(editProduct ? "อัปเดตสำเร็จ!" : "เพิ่มสินค้าสำเร็จ!");
      setShowModal(false); load();
    } catch (e) { toast.error(e.message); }
  };

  const del = async (id) => {
    if (!confirm("ต้องการลบสินค้านี้?")) return;
    try { await apiFetch(`/products/${id}`, { method: "DELETE" }, token); toast.success("ลบสำเร็จ"); load(); }
    catch (e) { toast.error(e.message); }
  };

  const addToCart = async (productId) => {
    try { await apiFetch("/cart/add", { method: "POST", body: JSON.stringify({ productId, quantity: 1 }) }, token); toast.success("เพิ่มลงตะกร้าแล้ว! 🛒"); }
    catch (e) { toast.error(e.message); }
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="h-8 bg-gray-100 rounded-xl w-48 mb-8 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-red-600 via-red-500 to-rose-500 rounded-3xl p-8 mb-8 overflow-hidden shadow-2xl shadow-red-200">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 text-9xl">🖥️</div>
          <div className="absolute bottom-4 right-48 text-7xl">⌨️</div>
        </div>
        <div className="relative">
          <p className="text-red-200 text-sm font-bold uppercase tracking-widest mb-2">TECHZONE STORE</p>
          <h1 className="text-white text-4xl font-black mb-2 tracking-tight">อุปกรณ์คอมพิวเตอร์<br />ครบวงจร</h1>
          <p className="text-red-100 text-sm font-medium">CPU · GPU · RAM · SSD · Monitor · Peripherals</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm font-medium bg-white"
            placeholder="ค้นหาสินค้า... (CPU, GPU, RAM, ...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
          <span>{filtered.length} รายการ</span>
        </div>
        {canManage && (
          <button onClick={openAdd}
            className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-red-200 flex items-center gap-2">
            <span className="text-base">+</span> เพิ่มสินค้า
          </button>
        )}
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <div className="text-6xl mb-4">🔍</div>
          <p className="font-semibold text-lg">ไม่พบสินค้าที่ค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(p => (
            <ProductCard key={p._id} p={p} onAddCart={addToCart} onEdit={openEdit} onDelete={del} canManage={canManage} />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editProduct ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}>
        <Input label="ชื่อสินค้า" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="เช่น Intel Core i9-14900K" />
        <Input label="รายละเอียด" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="รายละเอียดสินค้า..." />
        <div className="grid grid-cols-2 gap-3">
          <Input label="ราคา (฿)" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0" />
          <Input label="จำนวนสต็อก" type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} placeholder="0" />
        </div>
        <Input label="URL รูปภาพ" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} placeholder="https://..." />
        <div className="flex gap-3 mt-2">
          <button onClick={save} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all">
            {editProduct ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มสินค้า"}
          </button>
          <button onClick={() => setShowModal(false)} className="px-5 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-all">ยกเลิก</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── CART PAGE ────────────────────────────────────────────────────
function CartPage({ setPage, setCartCount, toast }) {
  const { token } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const d = await apiFetch("/cart", {}, token);
      setCart(d); setCartCount(d?.items?.length || 0);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const remove = async (productId) => {
    try { await apiFetch("/cart/remove", { method: "POST", body: JSON.stringify({ productId }) }, token); toast.success("ลบออกแล้ว"); load(); }
    catch (e) { toast.error(e.message); }
  };

  const clear = async () => {
    if (!confirm("ล้างตะกร้าทั้งหมด?")) return;
    try { await apiFetch("/cart/clear", { method: "POST" }, token); toast.success("ล้างตะกร้าแล้ว"); load(); }
    catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-6 py-8"><LoadingSpinner /></div>;

  const items = cart?.items || [];
  const total = items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">ตะกร้าสินค้า</h1>
          <p className="text-gray-400 text-sm mt-1">{items.length} รายการ</p>
        </div>
        {items.length > 0 && (
          <button onClick={clear} className="text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-all">
            ล้างตะกร้า
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-8xl mb-6">🛒</div>
          <p className="text-gray-400 text-lg font-semibold mb-6">ตะกร้าว่างเปล่า</p>
          <button onClick={() => setPage("products")}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all">
            เริ่มช้อปปิ้ง →
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 mb-6">
            {items.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl border-2 border-gray-100 p-4 flex items-center gap-4 hover:border-red-100 transition-colors">
                <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.product?.image
                    ? <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                    : <span className="text-3xl">🖥️</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 truncate">{item.product?.name || "สินค้า"}</p>
                  <p className="text-sm text-gray-400 font-medium">
                    ฿{item.product?.price?.toLocaleString()} × {item.quantity} ชิ้น
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-black text-red-600 text-lg">฿{((item.product?.price || 0) * item.quantity).toLocaleString()}</span>
                  <button onClick={() => remove(item.product?._id)}
                    className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg flex items-center justify-center text-sm transition-colors font-bold">✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-400 text-sm font-medium">ยอดรวมทั้งหมด</p>
                <p className="text-4xl font-black text-gray-900">฿{total.toLocaleString()}</p>
              </div>
              <div className="text-right text-sm text-gray-400">
                <p>{items.length} รายการ</p>
              </div>
            </div>
            <button onClick={() => setPage("orders")}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-200 transition-all text-base flex items-center justify-center gap-2">
              ดำเนินการสั่งซื้อ <span>→</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ORDERS PAGE ──────────────────────────────────────────────────
function OrdersPage({ toast, setPage, setPaymentAmount }) {
  const { token } = useAuth();
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);

  const checkout = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/orders/checkout", { method: "POST", body: JSON.stringify({ couponCode: coupon || undefined }) }, token);
      const order = data.order || data;
      toast.success("สั่งซื้อสำเร็จ! 🎉");
      
      // ส่งราคาสุทธิไปหน้า payment แล้วเด้งไปเลย
      setPaymentAmount(order.finalPrice || order.totalPrice);
      setPage("payments");
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  // ... โค้ดส่วน return เหมือนเดิม แค่ลบส่วน order result card ออกได้เลย

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Checkout</h1>
      <p className="text-gray-400 text-sm mb-8">ยืนยันคำสั่งซื้อและชำระเงิน</p>

      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-4">
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">โค้ดส่วนลด (ไม่บังคับ)</label>
        <div className="flex gap-3">
          <input
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm font-medium bg-gray-50 placeholder-gray-400"
            placeholder="กรอกโค้ดคูปอง..."
            value={coupon}
            onChange={e => setCoupon(e.target.value.toUpperCase())}
          />
        </div>
        {coupon && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600 font-semibold">
            <span>🎫</span> ใช้โค้ด: <span className="font-black bg-green-50 px-2 py-0.5 rounded-lg">{coupon}</span>
          </div>
        )}
      </div>

      <button
        onClick={checkout} disabled={loading}
        className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-black rounded-xl shadow-lg shadow-red-200 transition-all text-base"
      >
        {loading ? "กำลังดำเนินการ..." : "✓ ยืนยันการสั่งซื้อ"}
      </button>
    </div>
  );
}

// ─── PAYMENTS PAGE ────────────────────────────────────────────────
function PaymentsPage({ toast, initialAmount , setCartCount}) {
  const { token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(initialAmount || "");  // ← ใส่ค่าเริ่มต้นเลย
  const [creating, setCreating] = useState(false);

  // ... โค้ดส่วนอื่นเหมือนเดิม

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const d = await apiFetch("/payments/my", {}, token); setPayments(d); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const create = async () => {
    setCreating(true);
    try { await apiFetch("/payments", { method: "POST", body: JSON.stringify({ amount: Number(amount) }) }, token); toast.success("สร้าง payment สำเร็จ"); setAmount(""); load(); }
    catch (e) { toast.error(e.message); }
    finally { setCreating(false); }
  };

  const pay = async (id) => {
    try { 
      await apiFetch(`/payments/${id}/pay`, { method: "POST" }, token); 
      toast.success("ชำระเงินสำเร็จ! ✅");
      setCartCount(0);  // ← เพิ่มบรรทัดนี้
      load(); 
    }
    catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="max-w-2xl mx-auto px-6 py-8"><LoadingSpinner /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-8">การชำระเงิน</h1>

      {/* Create Payment */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-6">
        <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2"><span>💳</span> สร้าง Payment ใหม่</h2>
        <div className="flex gap-3">
          <input
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm font-medium bg-gray-50"
            type="number" placeholder="จำนวนเงิน (฿)" value={amount} onChange={e => setAmount(e.target.value)}
          />
          <button onClick={create} disabled={creating || !amount}
            className="px-5 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-200 text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-red-200">
            {creating ? "..." : "สร้าง"}
          </button>
        </div>
      </div>

      {/* Payment List */}
      {payments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-6xl mb-4">💳</div>
          <p className="font-semibold">ยังไม่มีประวัติการชำระเงิน</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {payments.map((p) => (
            <div key={p._id} className="bg-white rounded-2xl border-2 border-gray-100 p-5 flex items-center justify-between hover:border-red-100 transition-colors">
              <div>
                <p className="font-black text-gray-900 text-xl">฿{p.amount?.toLocaleString()}</p>
                <p className="text-gray-400 text-xs mt-1 font-mono">{p._id}</p>
                {p.transactionId && <p className="text-green-600 text-xs font-bold mt-1">✓ {p.transactionId}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-black px-3 py-1.5 rounded-full
                  ${p.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {p.status === "paid" ? "✓ ชำระแล้ว" : "⏳ รอชำระ"}
                </span>
                {p.status === "pending" && (
                  <button onClick={() => pay(p._id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-all">
                    ชำระเงิน
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── COUPONS PAGE ─────────────────────────────────────────────────
function CouponsPage({ toast }) {
  const { token, user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: "", discountPercent: "", expiresAt: "" });

  const canCreate = user?.role === "admin" || user?.role === "owner";

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const d = await apiFetch("/coupons"); setCoupons(d); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const create = async () => {
    try { await apiFetch("/coupons", { method: "POST", body: JSON.stringify(form) }, token); toast.success("สร้างคูปองสำเร็จ!"); setShowModal(false); load(); }
    catch (e) { toast.error(e.message); }
  };

  const claim = async (id) => {
    try { await apiFetch(`/coupons/${id}/claim`, { method: "POST" }, token); toast.success("รับคูปองสำเร็จ! 🎫"); load(); }
    catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-8"><LoadingSpinner /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">คูปองส่วนลด</h1>
          <p className="text-gray-400 text-sm mt-1">รับคูปองเพื่อประหยัดค่าใช้จ่าย</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowModal(true)}
            className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-red-200 flex items-center gap-2">
            + สร้างคูปอง
          </button>
        )}
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <div className="text-6xl mb-4">🎫</div>
          <p className="font-semibold text-lg">ยังไม่มีคูปอง</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => {
            const claimed = c.claimedUsers?.includes(user?.id);
            const expired = c.expiresAt && new Date() > new Date(c.expiresAt);
            return (
              <div key={c._id} className={`relative rounded-2xl border-2 p-5 overflow-hidden transition-all
                ${expired ? "border-gray-200 bg-gray-50 opacity-60" : "border-red-100 bg-gradient-to-br from-white to-red-50 hover:border-red-300 hover:shadow-lg hover:shadow-red-100"}`}>
                {/* Dashed left edge decoration */}
                <div className="absolute left-0 top-4 bottom-4 w-1 border-l-2 border-dashed border-red-200" />

                <div className="pl-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-red-600 text-white font-black text-xl px-3 py-1 rounded-xl tracking-widest shadow-md shadow-red-200">
                      {c.code}
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-black text-red-600 leading-none">{c.discountPercent}</span>
                      <span className="text-red-400 font-bold text-lg">%</span>
                    </div>
                  </div>

                  <p className="text-gray-400 text-xs font-medium mb-4">
                    {expired ? "หมดอายุ" : c.expiresAt ? `หมดอายุ: ${new Date(c.expiresAt).toLocaleDateString("th-TH")}` : "ไม่มีวันหมดอายุ"}
                  </p>

                  {expired ? (
                    <span className="text-sm text-gray-400 font-bold">หมดอายุแล้ว</span>
                  ) : claimed ? (
                    <span className="flex items-center gap-1 text-sm text-green-600 font-bold"><span>✓</span> รับแล้ว</span>
                  ) : (
                    <button onClick={() => claim(c._id)}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-red-200">
                      รับคูปอง
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="สร้างคูปองใหม่">
        <Input label="โค้ดคูปอง" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="เช่น SAVE20" />
        <Input label="ส่วนลด (%)" type="number" value={form.discountPercent} onChange={e => setForm(p => ({ ...p, discountPercent: e.target.value }))} placeholder="20" />
        <Input label="วันหมดอายุ" type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} />
        <div className="flex gap-3 mt-2">
          <button onClick={create} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all">สร้างคูปอง</button>
          <button onClick={() => setShowModal(false)} className="px-5 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50">ยกเลิก</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────
function ProfilePage({ toast }) {
  const { token, user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const d = await apiFetch("/users/profile", {}, token); setProfile(d); setForm({ name: d.name, password: "" }); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const update = async () => {
    setSaving(true);
    try {
      const body = { name: form.name };
      if (form.password) body.password = form.password;
      await apiFetch("/users/profile", { method: "PUT", body: JSON.stringify(body) }, token);
      toast.success("อัปเดตโปรไฟล์สำเร็จ!");
      setForm(p => ({ ...p, password: "" }));
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="max-w-lg mx-auto px-6 py-8"><LoadingSpinner /></div>;

  const roleColor = { admin: "bg-red-100 text-red-700", owner: "bg-orange-100 text-orange-700", user: "bg-blue-100 text-blue-700" };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-8">โปรไฟล์ของฉัน</h1>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-red-600 to-rose-600 rounded-3xl p-6 mb-6 text-white shadow-2xl shadow-red-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-black text-white shadow-inner">
            {profile?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-black text-xl">{profile?.name}</p>
            <p className="text-red-200 text-sm font-medium">{profile?.email}</p>
            <span className="inline-block mt-1 bg-white/20 text-white text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              {profile?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
        <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2">
          <span>✏️</span> แก้ไขข้อมูล
        </h2>
        <Input label="ชื่อ" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <Input label="รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
        <button onClick={update} disabled={saving}
          className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-red-200 mt-2">
          {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
        </button>
      </div>
    </div>
  );
}

// ─── ADMIN PAGE ───────────────────────────────────────────────────
function AdminPage({ toast }) {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [newRole, setNewRole] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const d = await apiFetch("/admin/users", {}, token); setUsers(d); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const updateRole = async () => {
    try {
      await apiFetch(`/admin/users/${editUser._id}`, { method: "PUT", body: JSON.stringify({ role: newRole }) }, token);
      toast.success("อัปเดต role สำเร็จ!"); setEditUser(null); load();
    } catch (e) { toast.error(e.message); }
  };

  const del = async (id) => {
    if (!confirm("ต้องการลบผู้ใช้นี้?")) return;
    try { await apiFetch(`/admin/users/${id}`, { method: "DELETE" }, token); toast.success("ลบผู้ใช้สำเร็จ"); load(); }
    catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-8"><LoadingSpinner /></div>;

  const roleStyle = { admin: "bg-red-100 text-red-700", owner: "bg-orange-100 text-orange-700", user: "bg-blue-100 text-blue-700" };
  const stats = [
    { label: "ผู้ใช้ทั้งหมด", value: users.length, icon: "👥", color: "bg-blue-50 border-blue-200" },
    { label: "Admin", value: users.filter(u => u.role === "admin").length, icon: "⚙️", color: "bg-red-50 border-red-200" },
    { label: "Owner", value: users.filter(u => u.role === "owner").length, icon: "👑", color: "bg-orange-50 border-orange-200" },
    { label: "User", value: users.filter(u => u.role === "user").length, icon: "👤", color: "bg-gray-50 border-gray-200" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">จัดการผู้ใช้และสิทธิ์การเข้าถึง</p>
        </div>
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white text-xl">⚙️</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`${s.color} border-2 rounded-2xl p-4`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 font-semibold">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-gray-900">รายชื่อผู้ใช้ทั้งหมด</h2>
          <span className="text-sm text-gray-400 font-medium">{users.length} บัญชี</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {["ผู้ใช้", "อีเมล", "Role", "จัดการ"].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-900 text-sm">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm font-medium">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${roleStyle[u.role] || "bg-gray-100 text-gray-600"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditUser(u); setNewRole(u.role); }}
                        className="px-3 py-1.5 text-xs font-bold border-2 border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        เปลี่ยน Role
                      </button>
                      <button onClick={() => del(u._id)}
                        className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all">
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`เปลี่ยน Role: ${editUser?.name}`}>
        <div className="mb-4 p-4 bg-gray-50 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black">
            {editUser?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900">{editUser?.name}</p>
            <p className="text-gray-400 text-sm">{editUser?.email}</p>
          </div>
        </div>
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Role ใหม่</label>
        <select
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm font-bold bg-gray-50 mb-5"
          value={newRole} onChange={e => setNewRole(e.target.value)}
        >
          {["user", "owner", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="flex gap-3">
          <button onClick={updateRole} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all">บันทึก</button>
          <button onClick={() => setEditUser(null)} className="px-5 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50">ยกเลิก</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────
function AppInner() {
  const { token } = useAuth();
  const [page, setPage] = useState("products");
  const [cartCount, setCartCount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState("");
  const toast = useToast();

  const renderPage = () => {
    switch(page) {
      case "products":  return <ProductsPage toast={toast} />;
      case "cart":      return <CartPage setPage={setPage} setCartCount={setCartCount} toast={toast} />;
      case "orders":    return <OrdersPage toast={toast} setPage={setPage} setPaymentAmount={setPaymentAmount} />;
      case "payments":  return <PaymentsPage toast={toast} initialAmount={paymentAmount} setCartCount={setCartCount} />;
      case "coupons":   return <CouponsPage toast={toast} />;
      case "profile":   return <ProfilePage toast={toast} />;
      case "admin":     return <AdminPage toast={toast} />;
      default:          return <ProductsPage toast={toast} />;
    }
  };

  if (!token) {
    if (page === "register") return <><RegisterPage setPage={setPage} toast={toast} /><ToastContainer toasts={toast.toasts} remove={toast.remove} /></>;
    if (page === "forgot") return <><ForgotPage setPage={setPage} toast={toast} /><ToastContainer toasts={toast.toasts} remove={toast.remove} /></>;
    return <><LoginPage setPage={setPage} toast={toast} /><ToastContainer toasts={toast.toasts} remove={toast.remove} /></>;
  }

  // ═══ เข้าสู่ระบบแล้ว → Main App ═══
  return (
    <div className="min-h-screen bg-gray-50">
      <Nav page={page} setPage={setPage} cartCount={cartCount} />
      <main>{renderPage()}</main>
      <ToastContainer toasts={toast.toasts} remove={toast.remove} />
      {/* Footer เหมือนเดิม */}
    </div>
  );
}

export default function App() {
  return (
    <>
      {/* ═══ Global Styles ═══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,600;0,700;0,800;0,900;1,800&display=swap');
        * { font-family: 'Barlow', sans-serif; }
        @keyframes slideIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="light"
            toastStyle={{
              fontFamily: "Barlow, sans-serif",
              fontWeight: 600,
              fontSize: 14,
              borderRadius: 12,
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}