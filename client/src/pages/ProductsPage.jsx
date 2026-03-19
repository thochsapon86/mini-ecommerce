/**
 * ProductsPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * หน้าแสดงสินค้าทั้งหมด
 * Features เพิ่มเติม:
 *   - เลือกสินค้าหลายรายการด้วย checkbox
 *   - ลบสินค้าที่เลือกทั้งหมดพร้อมกัน
 *   - เลือกทั้งหมด / ยกเลิกทั้งหมด
 *   - แสดง action bar เมื่อมีรายการที่เลือก
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/apiFetch";
import Modal from "../components/Modal";
import Input from "../components/Input";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductModal from "../components/ProductModal";
// เพิ่ม useNavigate เข้าไป
// ── ProductCard ────────────────────────────────────────────────────
function ProductCard({ p, onAddCart, onEdit, onDelete, canManage, onClick, selectable, selected, onSelect, currentUser }) {
  const [hover, setHover] = useState(false);

  // owner ลบ/แก้ไขได้เฉพาะสินค้าของตัวเอง
  // admin ลบ/แก้ไขได้ทุกชิ้น
  const isOwnerOfProduct = currentUser?.role === "owner" &&
    (p.createdBy?._id?.toString() === currentUser?.id?.toString() ||
      p.createdBy?.toString() === currentUser?.id?.toString());
  console.log("createdBy:", p.createdBy, "currentUser.id:", currentUser?.id, "match:", isOwnerOfProduct);
  const isAdmin = currentUser?.role === "admin";
  const canEditThis = isAdmin || isOwnerOfProduct;  // แก้ไข/ลบได้ไหม

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden relative
        ${selected
          ? "border-red-500 shadow-xl shadow-red-100 ring-2 ring-red-200"
          : hover ? "border-red-300 shadow-xl shadow-red-100 -translate-y-1" : "border-gray-100 shadow-sm"
        }`}
    >
      {/* Checkbox สำหรับ bulk select — แสดงเฉพาะ admin/owner */}
      {selectable && (
        <div
          className="absolute top-3 left-3 z-10"
          onClick={(e) => { e.stopPropagation(); onSelect(p._id); }}
        >
          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all
            ${selected
              ? "bg-red-600 border-red-600 shadow-md"
              : "bg-white/90 border-gray-300 hover:border-red-400"
            }`}>
            {selected && <span className="text-white text-xs font-black">✓</span>}
          </div>
        </div>
      )}

      {/* รูปสินค้า — คลิกเพื่อดูรายละเอียด */}
      <div
        className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={onClick}
      >
        {p.image
          ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
          : <span className="text-6xl opacity-20">🖥️</span>
        }
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
        {/* Overlay สีแดงเมื่อถูกเลือก */}
        {selected && (
          <div className="absolute inset-0 bg-red-600/10" />
        )}
      </div>

      {/* เนื้อหา */}
      <div className="p-5">
        <h3 className="font-black text-gray-900 text-base mb-1 truncate">{p.name}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed">{p.description || "ไม่มีคำอธิบาย"}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-black text-red-600">฿{p.price?.toLocaleString()}</span>
          <span className={`text-xs font-bold px-2 py-1 rounded-full
            ${p.stock > 5 ? "bg-green-100 text-green-600" : p.stock > 0 ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"}`}>
            {p.stock > 0 ? `${p.stock} ชิ้น` : "หมด"}
          </span>
        </div>

        {/* ผู้ขาย */}
        {p.createdBy && (
          <div className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-gray-50 rounded-lg">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
              {p.createdBy?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-gray-500 font-medium truncate">{p.createdBy?.name}</span>
            <span className="ml-auto text-xs text-red-500 font-bold flex-shrink-0">Seller</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAddCart(p._id); }}
            disabled={p.stock === 0}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-red-200 flex items-center justify-center gap-1.5"
          >
            <span>🛒</span> เพิ่มลงตะกร้า
          </button>
          {canManage && canEditThis && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(p); }}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 transition-colors">
              ✏️
            </button>
          )}
          {canManage && canEditThis && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(p._id); }}
              className="w-10 h-10 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-center text-red-500 transition-colors">
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ProductsPage ───────────────────────────────────────────────────
export default function ProductsPage({ setCartCount }) {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "", image: "" });
  const [search, setSearch] = useState("");

  // ── Bulk Select State ──────────────────────────────────────────
  const [selectMode, setSelectMode] = useState(false);   // เปิด/ปิด mode เลือก
  const [selectedIds, setSelectedIds] = useState([]);     // id ที่เลือกไว้
  const [bulkDeleting, setBulkDeleting] = useState(false); // กำลังลบอยู่

  const canAdd = user?.role === "owner";           // เพิ่มสินค้าได้เฉพาะ owner
  const canEdit = user?.role === "admin" || user?.role === "owner"; // แก้ไข/ลบได้ทั้งคู่

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const d = await apiFetch("/products"); setProducts(d); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setForm({ name: "", description: "", price: "", stock: "", image: "" });
    setEditProduct(null);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || "", price: p.price, stock: p.stock, image: p.image || "" });
    setEditProduct(p);
    setShowModal(true);
  };

  const save = async () => {
    try {
      if (editProduct) await apiFetch(`/products/${editProduct._id}`, { method: "PUT", body: JSON.stringify(form) }, token);
      else await apiFetch("/products", { method: "POST", body: JSON.stringify(form) }, token);
      toast.success(editProduct ? "อัปเดตสำเร็จ!" : "เพิ่มสินค้าสำเร็จ!");
      setShowModal(false);
      load();
    } catch (e) { toast.error(e.message); }
  };

  // ลบสินค้าทีละชิ้น
  const del = async (id) => {
    if (!confirm("ต้องการลบสินค้านี้?")) return;
    try {
      await apiFetch(`/products/${id}`, { method: "DELETE" }, token);
      toast.success("ลบสำเร็จ");
      load();
    } catch (e) { toast.error(e.message); }
  };

  // ── Bulk Select Functions ──────────────────────────────────────

  // toggle เลือก/ยกเลิก id เดียว
  const toggleSelect = (id) => {
    // หาสินค้าที่จะเลือก
    const product = products.find(p => p._id === id);

    // เช็คสิทธิ์
    if (user?.role === "owner") {
      const isOwn = product?.createdBy?._id?.toString() === user?.id?.toString() ||
        product?.createdBy?.toString() === user?.id?.toString();
      if (!isOwn) {
        toast.error("ไม่มีสิทธิ์ลบสินค้านี้");
        return;
      }
    }

    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  // เลือกทั้งหมดในหน้าปัจจุบัน (filtered)
  // เลือกทั้งหมดเฉพาะที่มีสิทธิ์ลบ
  const selectAll = () => {
    const deletable = filtered.filter(p => {
      if (user?.role === "admin") return true; // admin ลบได้ทุกชิ้น
      if (user?.role === "owner") {
        // owner ลบได้เฉพาะของตัวเอง
        return p.createdBy?._id?.toString() === user?.id?.toString() ||
          p.createdBy?.toString() === user?.id?.toString();
      }
      return false;
    });
    setSelectedIds(deletable.map(p => p._id));
  };

  // ยกเลิกทั้งหมด
  const clearSelect = () => {
    setSelectedIds([]);
  };

  // ออกจาก select mode และ clear
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds([]);
  };

  // ลบทั้งหมดที่เลือก
  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`ต้องการลบสินค้า ${selectedIds.length} รายการ? ไม่สามารถย้อนกลับได้`)) return;

    setBulkDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      // เช็คสิทธิ์อีกรอบก่อนลบจริง
      const product = products.find(p => p._id === id);
      if (user?.role === "owner") {
        const isOwn = product?.createdBy?._id?.toString() === user?.id?.toString() ||
          product?.createdBy?.toString() === user?.id?.toString();
        if (!isOwn) {
          failCount++;
          continue; // ข้ามไปสินค้าถัดไป
        }
      }

      try {
        await apiFetch(`/products/${id}`, { method: "DELETE" }, token);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setBulkDeleting(false);
    exitSelectMode();
    load();

    if (failCount === 0) {
      toast.success(`ลบสำเร็จ ${successCount} รายการ 🗑️`);
    } else {
      toast.error(`ลบสำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`);
    }
  };

  const addToCart = async (productId) => {
    try {
      await apiFetch("/cart/add", { method: "POST", body: JSON.stringify({ productId, quantity: 1 }) }, token);
      toast.success("เพิ่มลงตะกร้าแล้ว! 🛒");
      const cart = await apiFetch("/cart", {}, token);
      setCartCount(cart?.items?.length || 0);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  // เช็คว่าเลือกครบทุกรายการหรือยัง
  const isAllSelected = filtered.length > 0 && filtered.every(p => selectedIds.includes(p._id));

  if (loading) return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />)}
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

      {/* ── Bulk Action Bar — แสดงเมื่อ selectMode = true ─────── */}
      {selectMode && (
        <div className="bg-white border-2 border-red-200 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-lg shadow-red-100"
          style={{ animation: "popIn 0.2s ease" }}>
          <div className="flex items-center gap-4">
            {/* Checkbox เลือกทั้งหมด */}
            <button
              onClick={isAllSelected ? clearSelect : selectAll}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all
                ${isAllSelected ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center
                ${isAllSelected ? "border-white bg-white/20" : "border-gray-400"}`}>
                {isAllSelected && <span className="text-red-600 text-xs font-black">✓</span>}
              </div>
              {isAllSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
            </button>

            {/* จำนวนที่เลือก */}
            {selectedIds.length > 0 && (
              <span className="text-sm font-bold text-gray-700">
                เลือกแล้ว <span className="text-red-600 text-base">{selectedIds.length}</span> รายการ
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* ปุ่มลบที่เลือก */}
            {selectedIds.length > 0 && (
              <button
                onClick={bulkDelete}
                disabled={bulkDeleting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-black rounded-xl text-sm transition-all shadow-md shadow-red-200 flex items-center gap-2"
              >
                {bulkDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังลบ...
                  </>
                ) : (
                  <>🗑️ ลบ {selectedIds.length} รายการ</>
                )}
              </button>
            )}

            {/* ปุ่มออกจาก select mode */}
            <button
              onClick={exitSelectMode}
              className="px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-all"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm font-medium bg-white"
            placeholder="ค้นหาสินค้า..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <span className="flex items-center text-sm text-gray-400 font-medium">{filtered.length} รายการ</span>

        {/* ปุ่มเพิ่มสินค้า + Bulk Upload — เฉพาะ owner */}
        {canAdd && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={openAdd}
              className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-red-200">
              + เพิ่มสินค้า
            </button>
            <button onClick={() => navigate("/bulk-upload")}
              className="px-5 py-3 border-2 border-red-200 text-red-600 font-bold rounded-xl text-sm hover:bg-red-50 transition-all">
              📦 Upload จำนวนมาก
            </button>
          </div>
        )}

        {/* ปุ่มเลือกเพื่อลบ — ทั้ง owner และ admin */}
        {canEdit && (
          <button onClick={() => { setSelectMode(!selectMode); setSelectedIds([]); }}
            className={`px-5 py-3 font-bold rounded-xl text-sm transition-all border-2
      ${selectMode ? "bg-red-600 text-white border-red-600" : "border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50"}`}>
            {selectMode ? "✕ ออกจากโหมดเลือก" : "☑️ เลือกเพื่อลบ"}
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
            <ProductCard
              key={p._id}
              p={p}
              onAddCart={addToCart}
              onEdit={openEdit}
              onDelete={del}
              canManage={canEdit}
              currentUser={user}  // ← เพิ่มตรงนี้
              onClick={() => !selectMode && setSelectedProduct(p)}
              selectable={selectMode && canEdit}
              selected={selectedIds.includes(p._id)}
              onSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddCart={addToCart}
      />

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
          <button onClick={() => setShowModal(false)} className="px-5 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50">
            ยกเลิก
          </button>
        </div>
      </Modal>
    </div>
  );
}