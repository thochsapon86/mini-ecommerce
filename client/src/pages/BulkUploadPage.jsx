/**
 * BulkUploadPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * หน้าเพิ่มสินค้าหลายรายการพร้อมกัน สำหรับ admin/owner เท่านั้น
 *
 * Features:
 *   - เพิ่ม/ลบ row สินค้าได้ไม่จำกัด
 *   - import จากไฟล์ JSON
 *   - export template JSON ให้ดาวน์โหลด
 *   - preview รายการก่อน upload
 *   - แสดงผลลัพธ์หลัง upload (สำเร็จ/ล้มเหลว)
 *   - progress bar แสดงความคืบหน้า
 */

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/apiFetch";

// ค่าเริ่มต้นของ row สินค้าว่าง
const emptyProduct = () => ({
  id: Date.now() + Math.random(), // unique key สำหรับ React
  name: "",
  description: "",
  price: "",
  stock: "",
  image: "",
});

export default function BulkUploadPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // รายการสินค้าที่จะ upload (เริ่มต้นด้วย 3 row ว่าง)
  const [products, setProducts] = useState([emptyProduct(), emptyProduct(), emptyProduct()]);

  // สถานะการ upload
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const [results, setResults] = useState([]); // ผลลัพธ์แต่ละรายการ

  // ── แก้ไขค่าใน row ────────────────────────────────────────────
  const updateProduct = (id, field, value) => {
    setProducts(prev =>
      prev.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  };

  // ── เพิ่ม row ใหม่ ─────────────────────────────────────────────
  const addRow = () => {
    setProducts(prev => [...prev, emptyProduct()]);
  };

  // ── ลบ row ────────────────────────────────────────────────────
  const removeRow = (id) => {
    if (products.length === 1) {
      toast.error("ต้องมีอย่างน้อย 1 รายการ");
      return;
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // ── duplicate row ─────────────────────────────────────────────
  const duplicateRow = (product) => {
    const newProduct = { ...product, id: Date.now() + Math.random() };
    setProducts(prev => [...prev, newProduct]);
    toast.success("คัดลอกแล้ว");
  };

  // ── import JSON ───────────────────────────────────────────────
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        // รองรับทั้ง array และ object ที่มี key "products"
        const list = Array.isArray(data) ? data : data.products;

        if (!Array.isArray(list)) {
          toast.error("รูปแบบ JSON ไม่ถูกต้อง ต้องเป็น array");
          return;
        }

        // แปลงเป็น format ที่ใช้ใน state
        const imported = list.map(item => ({
          id: Date.now() + Math.random(),
          name: item.name || "",
          description: item.description || "",
          price: item.price || "",
          stock: item.stock || "",
          image: item.image || "",
        }));

        setProducts(imported);
        toast.success(`นำเข้า ${imported.length} รายการสำเร็จ`);
      } catch {
        toast.error("ไฟล์ JSON ไม่ถูกต้อง");
      }
    };
    reader.readAsText(file);

    // reset input เพื่อให้ import ไฟล์เดิมซ้ำได้
    e.target.value = "";
  };

  // ── export template JSON ──────────────────────────────────────
  const exportTemplate = () => {
    const template = [
      {
        name: "Intel Core i9-14900K",
        description: "CPU รุ่นท็อป 24 cores สำหรับ gaming และ content creation",
        price: 18900,
        stock: 10,
        image: "https://example.com/image.jpg"
      },
      {
        name: "NVIDIA RTX 4080",
        description: "การ์ดจอระดับ flagship 16GB GDDR6X",
        price: 35900,
        stock: 5,
        image: ""
      }
    ];

    // สร้างไฟล์ JSON แล้ว download
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_template.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("ดาวน์โหลด template แล้ว");
  };

  // ── validate ทุก row ──────────────────────────────────────────
  const validate = () => {
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p.name.trim()) {
        toast.error(`แถวที่ ${i + 1}: กรุณากรอกชื่อสินค้า`);
        return false;
      }
      if (!p.price || isNaN(p.price) || Number(p.price) <= 0) {
        toast.error(`แถวที่ ${i + 1}: กรุณากรอกราคาให้ถูกต้อง`);
        return false;
      }
      if (!p.stock || isNaN(p.stock) || Number(p.stock) < 0) {
        toast.error(`แถวที่ ${i + 1}: กรุณากรอกจำนวนสต็อกให้ถูกต้อง`);
        return false;
      }
    }
    return true;
  };

  // ── upload ทีละรายการ ─────────────────────────────────────────
  const handleUpload = async () => {
    if (!validate()) return;

    // filter เฉพาะ row ที่มีชื่อ
    const validProducts = products.filter(p => p.name.trim());

    setUploading(true);
    setProgress(0);
    setResults([]);

    const uploadResults = [];

    for (let i = 0; i < validProducts.length; i++) {
      const p = validProducts[i];
      try {
        // POST /api/products ทีละรายการ
        await apiFetch("/products", {
          method: "POST",
          body: JSON.stringify({
            name: p.name.trim(),
            description: p.description.trim(),
            price: Number(p.price),
            stock: Number(p.stock),
            image: p.image.trim(),
          }),
        }, token);

        uploadResults.push({ name: p.name, success: true });
      } catch (err) {
        uploadResults.push({ name: p.name, success: false, error: err.message });
      }

      // อัปเดต progress bar
      setProgress(Math.round(((i + 1) / validProducts.length) * 100));
      setResults([...uploadResults]);
    }

    setUploading(false);

    const successCount = uploadResults.filter(r => r.success).length;
    const failCount = uploadResults.filter(r => !r.success).length;

    if (failCount === 0) {
      toast.success(`เพิ่มสินค้าสำเร็จทั้งหมด ${successCount} รายการ! 🎉`);
    } else {
      toast.error(`สำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`);
    }
  };

  // ── clear ทุก row ─────────────────────────────────────────────
  const handleClear = () => {
    if (!confirm("ล้างรายการทั้งหมด?")) return;
    setProducts([emptyProduct(), emptyProduct(), emptyProduct()]);
    setResults([]);
    setProgress(0);
  };

  const filledCount = products.filter(p => p.name.trim()).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate("/products")}
              className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
            >
              ← กลับ
            </button>
          </div>
          <h1 className="text-3xl font-black text-gray-900">เพิ่มสินค้าจำนวนมาก</h1>
          <p className="text-gray-400 text-sm mt-1">
            กรอกข้อมูลสินค้าหลายรายการพร้อมกัน •
            <span className="text-red-600 font-bold"> {filledCount} รายการพร้อม upload</span>
          </p>
        </div>

        {/* ปุ่มเครื่องมือ */}
        <div className="flex items-center gap-3">
          {/* Import JSON */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all flex items-center gap-2"
          >
            <span>📂</span> Import JSON
          </button>

          {/* Export Template */}
          <button
            onClick={exportTemplate}
            className="px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2"
          >
            <span>⬇️</span> Template
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            className="px-4 py-2.5 border-2 border-gray-200 text-gray-500 font-bold rounded-xl text-sm hover:bg-gray-100 transition-all"
          >
            ล้างทั้งหมด
          </button>
        </div>
      </div>

      {/* ── Progress Bar ────────────────────────────────────────── */}
      {uploading && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-gray-900 text-sm">กำลัง upload...</span>
            <span className="font-black text-red-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-red-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────── */}
      {results.length > 0 && !uploading && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 mb-6">
          <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
            <span>📊</span> ผลลัพธ์การ Upload
          </h2>
          <div className="flex gap-4 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2">
              <span className="text-green-700 font-black text-lg">{results.filter(r => r.success).length}</span>
              <span className="text-green-600 text-sm font-medium ml-1">สำเร็จ</span>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2">
              <span className="text-red-700 font-black text-lg">{results.filter(r => !r.success).length}</span>
              <span className="text-red-600 text-sm font-medium ml-1">ล้มเหลว</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                ${r.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                <span>{r.success ? "✓" : "✕"}</span>
                <span className="font-semibold flex-1">{r.name}</span>
                {!r.success && <span className="text-xs opacity-75">{r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden mb-6">

        {/* Header */}
        <div className="grid gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest"
          style={{ gridTemplateColumns: "2fr 2fr 1fr 1fr 2fr auto" }}>
          <div>ชื่อสินค้า *</div>
          <div>รายละเอียด</div>
          <div>ราคา (฿) *</div>
          <div>สต็อก *</div>
          <div>URL รูปภาพ</div>
          <div>จัดการ</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50">
          {products.map((p, index) => (
            <div
              key={p.id}
              className="grid gap-3 px-4 py-3 items-center hover:bg-gray-50/50 transition-colors group"
              style={{ gridTemplateColumns: "2fr 2fr 1fr 1fr 2fr auto" }}
            >
              {/* เลขแถว */}
              <div className="relative">
                <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-xs text-gray-300 font-bold w-4 text-right">
                  {index + 1}
                </span>
                <input
                  className={`w-full px-3 py-2 rounded-lg border-2 text-sm font-medium outline-none transition-colors
                    ${p.name ? "border-gray-200 focus:border-red-400" : "border-dashed border-gray-200 focus:border-red-400"}`}
                  placeholder="ชื่อสินค้า..."
                  value={p.name}
                  onChange={e => updateProduct(p.id, "name", e.target.value)}
                  disabled={uploading}
                />
              </div>

              <input
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-red-400 text-sm font-medium outline-none transition-colors border-dashed focus:border-solid"
                placeholder="รายละเอียด..."
                value={p.description}
                onChange={e => updateProduct(p.id, "description", e.target.value)}
                disabled={uploading}
              />

              <input
                className={`w-full px-3 py-2 rounded-lg border-2 text-sm font-medium outline-none transition-colors
                  ${p.price ? "border-gray-200 focus:border-red-400" : "border-dashed border-gray-200 focus:border-red-400"}`}
                placeholder="0"
                type="number"
                min="0"
                value={p.price}
                onChange={e => updateProduct(p.id, "price", e.target.value)}
                disabled={uploading}
              />

              <input
                className={`w-full px-3 py-2 rounded-lg border-2 text-sm font-medium outline-none transition-colors
                  ${p.stock ? "border-gray-200 focus:border-red-400" : "border-dashed border-gray-200 focus:border-red-400"}`}
                placeholder="0"
                type="number"
                min="0"
                value={p.stock}
                onChange={e => updateProduct(p.id, "stock", e.target.value)}
                disabled={uploading}
              />

              <input
                className="w-full px-3 py-2 rounded-lg border-2 border-dashed border-gray-200 focus:border-red-400 focus:border-solid text-sm font-medium outline-none transition-colors"
                placeholder="https://..."
                value={p.image}
                onChange={e => updateProduct(p.id, "image", e.target.value)}
                disabled={uploading}
              />

              {/* ปุ่มจัดการ */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => duplicateRow(p)}
                  disabled={uploading}
                  title="คัดลอก"
                  className="w-7 h-7 bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-lg flex items-center justify-center text-xs transition-colors"
                >⧉</button>
                <button
                  onClick={() => removeRow(p.id)}
                  disabled={uploading}
                  title="ลบ"
                  className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg flex items-center justify-center text-xs transition-colors"
                >✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* ปุ่มเพิ่มแถว */}
        <button
          onClick={addRow}
          disabled={uploading}
          className="w-full py-3 text-sm font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2 border-t border-dashed border-gray-200"
        >
          <span className="text-lg">+</span> เพิ่มแถวใหม่
        </button>
      </div>

      {/* ── Footer Actions ───────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400 font-medium">
          รวม <span className="font-black text-gray-900">{products.length}</span> แถว •
          พร้อม upload <span className="font-black text-red-600">{filledCount}</span> รายการ
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/products")}
            className="px-6 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-all"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || filledCount === 0}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-200 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-red-200 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                กำลัง Upload...
              </>
            ) : (
              <>
                <span>🚀</span> Upload {filledCount} รายการ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}