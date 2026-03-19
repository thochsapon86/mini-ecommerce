/**
 * OwnerDashboard.jsx
 * ─────────────────────────────────────────────────────────────────
 * หน้า Dashboard สำหรับเจ้าของร้าน (Owner)
 *
 * Features:
 *   - สรุปยอดขาย (ออเดอร์ทั้งหมด, ยอดเงิน, รอดำเนินการ)
 *   - ดูคำสั่งซื้อทั้งหมดของร้าน
 *   - อัปเดตสถานะ Order (pending → confirmed → shipping → delivered)
 *   - ดูสถานะการชำระเงิน พร้อมรูปสลิป
 *   - กรองดู Tab: Orders / Payments
 */

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/apiFetch";
import LoadingSpinner from "../components/LoadingSpinner";

const API_BASE = "http://localhost:5000";

// สถานะ Order พร้อมสี
const ORDER_STATUS = {
  pending:   { label: "รอดำเนินการ", color: "bg-amber-100 text-amber-700",   icon: "⏳" },
  confirmed: { label: "ยืนยันแล้ว",  color: "bg-blue-100 text-blue-700",    icon: "✓"  },
  shipping:  { label: "กำลังจัดส่ง", color: "bg-purple-100 text-purple-700", icon: "🚚" },
  delivered: { label: "ส่งแล้ว",     color: "bg-green-100 text-green-700",   icon: "📦" },
  cancelled: { label: "ยกเลิก",      color: "bg-red-100 text-red-700",       icon: "✕"  },
};

// สถานะ Payment
const PAYMENT_STATUS = {
  pending: { label: "รอชำระ",   color: "bg-amber-100 text-amber-700"  },
  paid:    { label: "ชำระแล้ว", color: "bg-green-100 text-green-700"  },
  failed:  { label: "ล้มเหลว",  color: "bg-red-100 text-red-700"      },
};

export default function OwnerDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState("orders"); // "orders" | "payments"
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null); // order ที่กำลัง expand ดูรายละเอียด
  const [slipModal, setSlipModal] = useState(null); // รูป slip ที่กำลัง preview

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ordersData, paymentsData] = await Promise.all([
        apiFetch("/owner/orders", {}, token),
        apiFetch("/owner/payments", {}, token),
      ]);
      setOrders(ordersData);
      setPayments(paymentsData);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // อัปเดตสถานะ Order
  const updateStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await apiFetch(`/owner/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }, token);
      toast.success(`อัปเดตสถานะเป็น "${ORDER_STATUS[status].label}" แล้ว`);
      loadAll();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // คำนวณ stats
  const totalRevenue = orders
    .filter(o => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.finalPrice || o.totalPrice || 0), 0);
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const paidPayments = payments.filter(p => p.status === "paid").length;

  if (loading) return (
    <div className="max-w-6xl mx-auto px-6 py-8"><LoadingSpinner /></div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Owner Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">จัดการคำสั่งซื้อและการชำระเงินของร้าน</p>
      </div>

      {/* ── Stats Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "คำสั่งซื้อทั้งหมด", value: orders.length,   icon: "📦", color: "bg-blue-50 border-blue-200",   text: "text-blue-700"   },
          { label: "รอดำเนินการ",        value: pendingOrders,   icon: "⏳", color: "bg-amber-50 border-amber-200", text: "text-amber-700" },
          { label: "ชำระแล้ว",           value: paidPayments,    icon: "✅", color: "bg-green-50 border-green-200", text: "text-green-700" },
          { label: "ยอดขายรวม",          value: `฿${totalRevenue.toLocaleString()}`, icon: "💰", color: "bg-red-50 border-red-200", text: "text-red-700" },
        ].map((s) => (
          <div key={s.label} className={`${s.color} border-2 rounded-2xl p-4`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
                <p className="text-xs text-gray-500 font-semibold">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "orders",   label: "คำสั่งซื้อ", icon: "📦", count: orders.length   },
          { key: "payments", label: "การชำระเงิน", icon: "💳", count: payments.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all
              ${tab === t.key
                ? "bg-red-600 text-white shadow-md shadow-red-200"
                : "bg-white border-2 border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600"
              }`}
          >
            <span>{t.icon}</span>
            {t.label}
            <span className={`px-2 py-0.5 rounded-full text-xs font-black
              ${tab === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Orders Tab ───────────────────────────────────────── */}
      {tab === "orders" && (
        <div className="flex flex-col gap-4">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-6xl mb-4">📦</div>
              <p className="font-semibold">ยังไม่มีคำสั่งซื้อ</p>
            </div>
          ) : (
            orders.map((order) => {
              const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
              const isExpanded = expandedOrder === order._id;

              return (
                <div key={order._id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-red-100 transition-colors">

                  {/* Order Header */}
                  <div
                    className="p-5 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar ลูกค้า */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black flex-shrink-0">
                        {order.user?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{order.user?.name}</p>
                        <p className="text-gray-400 text-xs font-medium">{order.user?.email}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("th-TH", {
                            year: "numeric", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-black text-gray-900 text-lg">
                          ฿{(order.finalPrice || order.totalPrice)?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">{order.items?.length} รายการ</p>
                      </div>
                      <span className={`text-xs font-black px-3 py-1.5 rounded-full ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                      <span className="text-gray-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {/* Order Detail (Expandable) */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-5">

                      {/* รายการสินค้า */}
                      <h3 className="font-bold text-gray-700 text-sm mb-3">รายการสินค้า</h3>
                      <div className="flex flex-col gap-2 mb-5">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                            <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {item.product?.image
                                ? <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                                : <span className="text-xl">🖥️</span>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{item.product?.name}</p>
                              <p className="text-gray-400 text-xs">฿{item.price?.toLocaleString()} × {item.quantity}</p>
                            </div>
                            <p className="font-black text-gray-900 text-sm flex-shrink-0">
                              ฿{(item.price * item.quantity)?.toLocaleString()}
                            </p>
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
                      <div>
                        <h3 className="font-bold text-gray-700 text-sm mb-3">อัปเดตสถานะคำสั่งซื้อ</h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(ORDER_STATUS).map(([key, val]) => (
                            <button
                              key={key}
                              onClick={() => updateStatus(order._id, key)}
                              disabled={order.status === key || updatingId === order._id}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2
                                ${order.status === key
                                  ? `${val.color} border-transparent cursor-default`
                                  : "border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                                }`}
                            >
                              {updatingId === order._id && order.status !== key ? "..." : `${val.icon} ${val.label}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Payments Tab ─────────────────────────────────────── */}
      {tab === "payments" && (
        <div className="flex flex-col gap-3">
          {payments.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-6xl mb-4">💳</div>
              <p className="font-semibold">ยังไม่มีข้อมูลการชำระเงิน</p>
            </div>
          ) : (
            payments.map((p) => {
              const status = PAYMENT_STATUS[p.status] || PAYMENT_STATUS.pending;
              return (
                <div key={p._id} className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:border-red-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar ลูกค้า */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black flex-shrink-0">
                        {p.user?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{p.user?.name}</p>
                        <p className="text-gray-400 text-xs">{p.user?.email}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {new Date(p.createdAt).toLocaleDateString("th-TH", {
                            year: "numeric", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                        {p.transactionId && (
                          <p className="text-green-600 text-xs font-bold mt-1">✓ {p.transactionId}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-black text-gray-900 text-xl">฿{p.amount?.toLocaleString()}</p>
                      </div>
                      <span className={`text-xs font-black px-3 py-1.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                      {/* ปุ่มดูสลิป */}
                      {p.slipImage && (
                        <button
                          onClick={() => setSlipModal(`${API_BASE}${p.slipImage}`)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-lg text-xs transition-all flex items-center gap-1"
                        >
                          📎 ดูสลิป
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Slip Preview Modal ────────────────────────────────── */}
      {slipModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSlipModal(null)}
        >
          <div className="relative max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSlipModal(null)}
              className="absolute -top-4 -right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg font-bold text-gray-600 hover:text-gray-900"
            >✕</button>
            <img
              src={slipModal}
              alt="slip"
              className="w-full rounded-2xl shadow-2xl"
            />
            <a
              href={slipModal}
              target="_blank"
              rel="noreferrer"
              className="mt-3 w-full py-3 bg-white text-gray-800 font-bold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-gray-100 transition-all"
            >
              🔍 เปิดในแท็บใหม่
            </a>
          </div>
        </div>
      )}
    </div>
  );
}