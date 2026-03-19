/**
 * AdminPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * หน้า Admin Panel จัดการทุกอย่างในระบบ
 *
 * Tabs:
 *   - ผู้ใช้: ดู/เปลี่ยน role/ลบ user
 *   - คำสั่งซื้อ: ดูทุก order + อัปเดตสถานะ
 *   - การชำระเงิน: ดูทุก payment + ดูสลิป
 */

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/apiFetch";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";

const API_BASE = "http://localhost:5000";

const ORDER_STATUS = {
  pending:   { label: "รอดำเนินการ", color: "bg-amber-100 text-amber-700",   icon: "⏳" },
  confirmed: { label: "ยืนยันแล้ว",  color: "bg-blue-100 text-blue-700",    icon: "✓"  },
  shipping:  { label: "กำลังจัดส่ง", color: "bg-purple-100 text-purple-700", icon: "🚚" },
  delivered: { label: "ส่งแล้ว",     color: "bg-green-100 text-green-700",   icon: "📦" },
  cancelled: { label: "ยกเลิก",      color: "bg-red-100 text-red-700",       icon: "✕"  },
};

const PAYMENT_STATUS = {
  pending: { label: "รอชำระ",   color: "bg-amber-100 text-amber-700" },
  paid:    { label: "ชำระแล้ว", color: "bg-green-100 text-green-700" },
  failed:  { label: "ล้มเหลว",  color: "bg-red-100 text-red-700"    },
};

export default function AdminPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState("users");

  // ── Users State ────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [newRole, setNewRole] = useState("");

  // ── Orders State ───────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // ── Payments State ─────────────────────────────────────────────
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [slipModal, setSlipModal] = useState(null);

  // โหลด users ตอนเริ่ม
  useEffect(() => { loadUsers(); }, []);

  // โหลดข้อมูลตาม tab ที่เลือก
  useEffect(() => {
    if (tab === "orders" && orders.length === 0) loadOrders();
    if (tab === "payments" && payments.length === 0) loadPayments();
  }, [tab]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try { const d = await apiFetch("/admin/users", {}, token); setUsers(d); }
    catch (e) { toast.error(e.message); }
    finally { setLoadingUsers(false); }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try { const d = await apiFetch("/admin/orders", {}, token); setOrders(d); }
    catch (e) { toast.error(e.message); }
    finally { setLoadingOrders(false); }
  };

  const loadPayments = async () => {
    setLoadingPayments(true);
    try { const d = await apiFetch("/admin/payments", {}, token); setPayments(d); }
    catch (e) { toast.error(e.message); }
    finally { setLoadingPayments(false); }
  };

  // ── User Actions ───────────────────────────────────────────────
  const updateRole = async () => {
    try {
      await apiFetch(`/admin/users/${editUser._id}`, { method: "PUT", body: JSON.stringify({ role: newRole }) }, token);
      toast.success("อัปเดต role สำเร็จ!");
      setEditUser(null);
      loadUsers();
    } catch (e) { toast.error(e.message); }
  };

  const delUser = async (id) => {
    if (!confirm("ต้องการลบผู้ใช้นี้?")) return;
    try { await apiFetch(`/admin/users/${id}`, { method: "DELETE" }, token); toast.success("ลบผู้ใช้สำเร็จ"); loadUsers(); }
    catch (e) { toast.error(e.message); }
  };

  // ── Order Actions ──────────────────────────────────────────────
  const updateOrderStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await apiFetch(`/admin/orders/${orderId}/status`, { method: "PUT", body: JSON.stringify({ status }) }, token);
      toast.success(`อัปเดตสถานะเป็น "${ORDER_STATUS[status].label}" แล้ว`);
      loadOrders();
    } catch (e) { toast.error(e.message); }
    finally { setUpdatingId(null); }
  };

  // ── Stats ──────────────────────────────────────────────────────
  const stats = [
    { label: "ผู้ใช้ทั้งหมด",   value: users.length,                                      icon: "👥", color: "bg-blue-50 border-blue-200"   },
    { label: "คำสั่งซื้อ",       value: orders.length,                                     icon: "📦", color: "bg-purple-50 border-purple-200" },
    { label: "ชำระแล้ว",         value: payments.filter(p => p.status === "paid").length,  icon: "✅", color: "bg-green-50 border-green-200"  },
    { label: "รอดำเนินการ",      value: orders.filter(o => o.status === "pending").length, icon: "⏳", color: "bg-amber-50 border-amber-200"  },
  ];

  const roleStyle = { admin: "bg-red-100 text-red-700", owner: "bg-orange-100 text-orange-700", user: "bg-blue-100 text-blue-700" };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">บริหารจัดการระบบทั้งหมด</p>
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

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "users",    label: "ผู้ใช้",       icon: "👥", count: users.length    },
          { key: "orders",   label: "คำสั่งซื้อ",   icon: "📦", count: orders.length   },
          { key: "payments", label: "การชำระเงิน",  icon: "💳", count: payments.length },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all
              ${tab === t.key ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-white border-2 border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600"}`}>
            <span>{t.icon}</span>
            {t.label}
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${tab === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tab: Users ─────────────────────────────────────────── */}
      {tab === "users" && (
        loadingUsers ? <LoadingSpinner /> : (
          <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-black text-gray-900">รายชื่อผู้ใช้ทั้งหมด</h2>
              <span className="text-sm text-gray-400">{users.length} บัญชี</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {["ผู้ใช้", "อีเมล", "Role", "สมัครเมื่อ", "จัดการ"].map(h => (
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
                      <td className="px-6 py-4 text-gray-500 text-sm">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full ${roleStyle[u.role] || "bg-gray-100 text-gray-600"}`}>{u.role}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditUser(u); setNewRole(u.role); }}
                            className="px-3 py-1.5 text-xs font-bold border-2 border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                            เปลี่ยน Role
                          </button>
                          <button onClick={() => delUser(u._id)}
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
        )
      )}

      {/* ── Tab: Orders ────────────────────────────────────────── */}
      {tab === "orders" && (
        loadingOrders ? <LoadingSpinner /> : (
          <div className="flex flex-col gap-4">
            {orders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-6xl mb-4">📦</div>
                <p className="font-semibold">ยังไม่มีคำสั่งซื้อ</p>
              </div>
            ) : orders.map((order) => {
              const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
              const isExpanded = expandedOrder === order._id;
              return (
                <div key={order._id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-red-100 transition-colors">
                  <div className="p-5 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedOrder(isExpanded ? null : order._id)}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black flex-shrink-0">
                        {order.user?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{order.user?.name}</p>
                        <p className="text-gray-400 text-xs">{order.user?.email}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-black text-gray-900 text-lg">฿{(order.finalPrice || order.totalPrice)?.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{order.items?.length} รายการ</p>
                      </div>
                      <span className={`text-xs font-black px-3 py-1.5 rounded-full ${status.color}`}>{status.icon} {status.label}</span>
                      <span className="text-gray-400">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-5">
                      {/* รายการสินค้า */}
                      <div className="flex flex-col gap-2 mb-5">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                            <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {item.product?.image ? <img src={item.product.image} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">🖥️</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{item.product?.name}</p>
                              <p className="text-gray-400 text-xs">฿{item.price?.toLocaleString()} × {item.quantity}</p>
                            </div>
                            <p className="font-black text-gray-900 text-sm">฿{(item.price * item.quantity)?.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>

                      {/* สรุปราคา */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-5">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">ราคาสินค้า</span>
                          <span className="font-bold">฿{order.totalPrice?.toLocaleString()}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-green-600">ส่วนลด {order.coupon?.code && `(${order.coupon.code})`}</span>
                            <span className="font-bold text-green-600">-฿{order.discount?.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-black border-t border-gray-200 pt-2 mt-2">
                          <span>ราคาสุทธิ</span>
                          <span className="text-red-600">฿{(order.finalPrice || order.totalPrice)?.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* อัปเดตสถานะ */}
                      <h3 className="font-bold text-gray-700 text-sm mb-3">อัปเดตสถานะ</h3>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(ORDER_STATUS).map(([key, val]) => (
                          <button key={key} onClick={() => updateOrderStatus(order._id, key)}
                            disabled={order.status === key || updatingId === order._id}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2
                              ${order.status === key
                                ? `${val.color} border-transparent cursor-default`
                                : "border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"}`}>
                            {updatingId === order._id && order.status !== key ? "..." : `${val.icon} ${val.label}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Tab: Payments ──────────────────────────────────────── */}
      {tab === "payments" && (
        loadingPayments ? <LoadingSpinner /> : (
          <div className="flex flex-col gap-3">
            {payments.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-6xl mb-4">💳</div>
                <p className="font-semibold">ยังไม่มีข้อมูลการชำระเงิน</p>
              </div>
            ) : payments.map((p) => {
              const status = PAYMENT_STATUS[p.status] || PAYMENT_STATUS.pending;
              return (
                <div key={p._id} className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:border-red-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black flex-shrink-0">
                        {p.user?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{p.user?.name}</p>
                        <p className="text-gray-400 text-xs">{p.user?.email}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {new Date(p.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {p.transactionId && <p className="text-green-600 text-xs font-bold mt-1">✓ {p.transactionId}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="font-black text-gray-900 text-xl">฿{p.amount?.toLocaleString()}</p>
                      <span className={`text-xs font-black px-3 py-1.5 rounded-full ${status.color}`}>{status.label}</span>
                      {p.slipImage && (
                        <button onClick={() => setSlipModal(`${API_BASE}${p.slipImage}`)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-lg text-xs transition-all">
                          📎 ดูสลิป
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Modal เปลี่ยน Role ────────────────────────────────── */}
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
        <select className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm font-bold bg-gray-50 mb-5"
          value={newRole} onChange={e => setNewRole(e.target.value)}>
          {["user", "owner", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="flex gap-3">
          <button onClick={updateRole} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm">บันทึก</button>
          <button onClick={() => setEditUser(null)} className="px-5 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50">ยกเลิก</button>
        </div>
      </Modal>

      {/* ── Slip Preview Modal ────────────────────────────────── */}
      {slipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSlipModal(null)}>
          <div className="relative max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSlipModal(null)}
              className="absolute -top-4 -right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg font-bold text-gray-600 hover:text-gray-900">✕</button>
            <img src={slipModal} alt="slip" className="w-full rounded-2xl shadow-2xl" />
            <a href={slipModal} target="_blank" rel="noreferrer"
              className="mt-3 w-full py-3 bg-white text-gray-800 font-bold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-gray-100 transition-all">
              🔍 เปิดในแท็บใหม่
            </a>
          </div>
        </div>
      )}
    </div>
  );
}