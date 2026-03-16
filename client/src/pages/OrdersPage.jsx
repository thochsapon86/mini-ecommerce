/**
 * OrdersPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * หน้า Checkout สำหรับยืนยันคำสั่งซื้อ
 * Features:
 *   - ดึงคูปองที่ user รับแล้วมาแสดงให้เลือกได้เลย
 *   - กดเลือกคูปองแล้วนำไปใช้ได้ทันที ไม่ต้องพิมพ์โค้ด
 *   - แสดงส่วนลดและราคาสุทธิก่อนกด checkout
 *   - หลัง checkout สำเร็จ redirect ไปหน้าชำระเงินพร้อมราคา
 *
 * Props:
 *   setPaymentAmount {function} - ส่งราคาสุทธิไปหน้าชำระเงิน
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/apiFetch";
import LoadingSpinner from "../components/LoadingSpinner";

export default function OrdersPage({ setPaymentAmount }) {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(true);

  // คูปองทั้งหมดในระบบ
  const [allCoupons, setAllCoupons] = useState([]);

  // คูปองที่ user เลือกไว้
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  // ราคาในตะกร้า (สำหรับคำนวณ preview ส่วนลด)
  const [cartTotal, setCartTotal] = useState(0);

  // โหลดคูปองและตะกร้าเมื่อ component mount
  useEffect(() => {
    loadCoupons();
    loadCart();
  }, []);

  // ดึงคูปองทั้งหมด แล้ว filter เฉพาะที่ user รับแล้วและยังไม่หมดอายุ
  const loadCoupons = async () => {
    try {
      const data = await apiFetch("/coupons");

      // filter เฉพาะคูปองที่:
      // 1. user รับแล้ว (claimedUsers มี user id)
      // 2. ยังไม่หมดอายุ
      const myCoupons = data.filter((c) => {
        const claimed = c.claimedUsers?.includes(user?.id);
        const notExpired = !c.expiresAt || new Date() < new Date(c.expiresAt);
        return claimed && notExpired;
      });

      setAllCoupons(myCoupons);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingCoupons(false);
    }
  };

  // ดึงยอดรวมจากตะกร้าเพื่อแสดง preview ส่วนลด
  const loadCart = async () => {
    try {
      const cart = await apiFetch("/cart", {}, token);
      const total = cart?.items?.reduce(
        (sum, item) => sum + (item.product?.price || 0) * item.quantity,
        0
      );
      setCartTotal(total || 0);
    } catch (e) {
      // ไม่ต้อง toast เพราะเป็นแค่ preview
    }
  };

  // คำนวณส่วนลดและราคาสุทธิจากคูปองที่เลือก
  const discount = selectedCoupon
    ? Math.floor((cartTotal * selectedCoupon.discountPercent) / 100)
    : 0;
  const finalPrice = cartTotal - discount;

  // ยืนยันการสั่งซื้อ
  const checkout = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(
        "/orders/checkout",
        {
          method: "POST",
          body: JSON.stringify({
            couponCode: selectedCoupon?.code || undefined,
          }),
        },
        token
      );

      const order = data.order || data;
      toast.success("สั่งซื้อสำเร็จ! 🎉");

      // ส่งราคาสุทธิไปหน้าชำระเงิน
      setPaymentAmount(order.finalPrice || order.totalPrice);
      navigate("/payments");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Checkout</h1>
      <p className="text-gray-400 text-sm mb-8">ยืนยันคำสั่งซื้อและชำระเงิน</p>

      {/* ── เลือกคูปอง ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-4">
        <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
          <span>🎫</span> คูปองของฉัน
        </h2>

        {loadingCoupons ? (
          // กำลังโหลดคูปอง
          <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
            กำลังโหลดคูปอง...
          </div>
        ) : allCoupons.length === 0 ? (
          // ไม่มีคูปองที่ใช้ได้
          <div className="text-center py-4 text-gray-400">
            <p className="text-sm font-medium">ไม่มีคูปองที่ใช้ได้</p>
            <p className="text-xs mt-1">ไปรับคูปองได้ที่หน้าคูปอง</p>
          </div>
        ) : (
          // แสดงรายการคูปองที่ใช้ได้
          <div className="flex flex-col gap-3">
            {allCoupons.map((c) => {
              const isSelected = selectedCoupon?._id === c._id;
              return (
                <button
                  key={c._id}
                  onClick={() =>
                    // ถ้าคลิกคูปองที่เลือกอยู่แล้ว → ยกเลิก
                    setSelectedCoupon(isSelected ? null : c)
                  }
                  className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                    ${isSelected
                      ? "border-red-500 bg-red-50 shadow-md shadow-red-100"  // เลือกอยู่
                      : "border-gray-200 hover:border-red-300 bg-white"       // ยังไม่เลือก
                    }`}
                >
                  {/* dashed divider ซ้าย */}
                  <div className="absolute left-0 top-3 bottom-3 border-l-2 border-dashed border-red-200" />

                  {/* โค้ดคูปอง */}
                  <div className="pl-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`font-black text-base px-2 py-0.5 rounded-lg
                        ${isSelected ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                        {c.code}
                      </span>
                      <span className="text-2xl font-black text-red-600">{c.discountPercent}%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-medium">
                      {c.expiresAt
                        ? `หมดอายุ: ${new Date(c.expiresAt).toLocaleDateString("th-TH")}`
                        : "ไม่มีวันหมดอายุ"}
                    </p>
                    {/* แสดงส่วนลดที่จะได้รับถ้าเลือกคูปองนี้ */}
                    {cartTotal > 0 && (
                      <p className="text-xs text-green-600 font-bold mt-1">
                        ประหยัด ฿{Math.floor((cartTotal * c.discountPercent) / 100).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Checkmark เมื่อเลือกแล้ว */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                    ${isSelected ? "bg-red-600 text-white" : "border-2 border-gray-300"}`}>
                    {isSelected && <span className="text-xs font-black">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── สรุปราคา ────────────────────────────────────────── */}
      {cartTotal > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-sm font-medium">ราคาสินค้า</span>
            <span className="font-bold text-gray-900">฿{cartTotal.toLocaleString()}</span>
          </div>

          {/* แสดงส่วนลดเมื่อเลือกคูปอง */}
          {selectedCoupon && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                <span>🎫</span> ส่วนลด ({selectedCoupon.discountPercent}%)
              </span>
              <span className="font-bold text-green-600">-฿{discount.toLocaleString()}</span>
            </div>
          )}

          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
            <span className="font-black text-gray-900">ราคาสุทธิ</span>
            <span className="text-2xl font-black text-red-600">฿{finalPrice.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* ── ปุ่ม Checkout ────────────────────────────────────── */}
      <button
        onClick={checkout}
        disabled={loading}
        className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-black rounded-xl shadow-lg shadow-red-200 transition-all text-base"
      >
        {loading ? "กำลังดำเนินการ..." : `✓ ยืนยันการสั่งซื้อ${selectedCoupon ? ` (฿${finalPrice.toLocaleString()})` : ""}`}
      </button>

      {/* แสดงคูปองที่เลือกอยู่ */}
      {selectedCoupon && (
        <p className="text-center text-sm text-green-600 font-semibold mt-3 flex items-center justify-center gap-1">
          <span>🎫</span> ใช้คูปอง <span className="font-black bg-green-50 px-2 py-0.5 rounded-lg">{selectedCoupon.code}</span> ลด {selectedCoupon.discountPercent}%
        </p>
      )}
    </div>
  );
}