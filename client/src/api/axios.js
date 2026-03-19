/**
 * ═══════════════════════════════════════════════════════════════════
 * axios.js - Axios API Instance
 * ═══════════════════════════════════════════════════════════════════
 * 
 * ไฟล์นี้สำหรับสร้าง axios instance พร้อม base URL
 * ทำให้ไม่ต้องเขียน URL เต็มทุกครั้งที่เรียก API
 * 
 * วิธีใช้:
 *   import API from "../api/axios"
 *   API.get("/products")
 *   API.post("/auth/login", data)
 */

import axios from "axios";

// สร้าง axios instance ด้วย baseURL จากเซิร์ฟเวอร์
const API = axios.create({
  baseURL: "http://localhost:5000", // Backend server URL
});

// Export เพื่อให้ไฟล์อื่นสามารถใช้งาน
export default API;
