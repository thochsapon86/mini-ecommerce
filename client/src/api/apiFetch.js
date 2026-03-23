/**
 * ═══════════════════════════════════════════════════════════════════
 * apiFetch.js - API Fetch Utility
 * ═══════════════════════════════════════════════════════════════════
 * 
 * ไฟล์นี้สำหรับการเรียก API ไปยังเซิร์ฟเวอร์ด้วย fetch
 * ใช้ร่วมกับ JWT token สำหรับการ Authentication
 * 
 * วิธีใช้:
 *   - GET: apiFetch("/products")
 *   - POST: apiFetch("/orders/checkout", { method: "POST", body: JSON.stringify(data) })
 *   - JWT: apiFetch("/profile", {}, token)
 */

// URL หลักของ Backend API
//const API = "https://techzone-api-miq9.onrender.com/api";
const API = "http://localhost:5000/api";

/**
 * apiFetch - ฟังก์ชันสำหรับเรียก API
 * 
 * @param {string} path - เส้นทาง API เช่น "/products", "/auth/login"
 * @param {object} options - ตัวเลือกเพิ่มเติม เช่น method, body, headers
 * @param {string} token - JWT token สำหรับ Authentication (ถ้าจำเป็น)
 * 
 * @returns {Promise} - ข้อมูลที่ได้จาก API (JSON)
 * @throws {Error} - โยนข้อผิดพลาด หากการเรียก API 실패
 * 
 * ขั้นตอนการทำงาน:
 *   1. สร้าง headers ด้วย Content-Type: application/json
 *   2. ถ้ามี token จะเพิ่ม Authorization header ด้วย Bearer token
 *   3. เรียก fetch API ไปยัง baseURL + path
 *   4. ตรวจสอบสถานะ (status code)
 *   5. แปลง response เป็น JSON
 *   6. ถ้ากำลังไม่สำเร็จ (res.ok = false) จะโยนข้อผิดพลาด
 *   7. คืนข้อมูลที่สำเร็จ
 */
export async function apiFetch(path, options = {}, token = null) {
  // ขั้นตอนที่ 1: สร้าง headers พื้นฐาน
  const headers = { "Content-Type": "application/json" };
  
  // ขั้นตอนที่ 2: เพิ่ม Authorization header ถ้ามี token
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  // ขั้นตอนที่ 3: เรียก fetch API
  const res = await fetch(`${API}${path}`, { ...options, headers });
  
  // ขั้นตอนที่ 4: แปลง response เป็น JSON
  const data = await res.json();
  
  // ขั้นตอนที่ 5: ตรวจสอบสถานะและโยนข้อผิดพลาด
  // res.ok จะเป็น true ถ้า status code ระหว่าง 200-299
  if (!res.ok) throw new Error(data.message || "Error");
  
  // ขั้นตอนที่ 6: คืนข้อมูลสำเร็จ
  return data;
}
