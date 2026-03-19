/**
 * ═══════════════════════════════════════════════════════════════════
 * AuthContext.jsx - Global Authentication Context
 * ═══════════════════════════════════════════════════════════════════
 * 
 * ไฟล์นี้จัดการสถานะการล็อกอิน (Authentication state) ให้ทั่วแอพ
 * ใช้ React Context API เพื่อให้ทุก component สามารถเข้าถึง token และ user info ได้
 * 
 * ข้อมูลสำคัญ:
 *   - token: JWT token สำหรับ authentication (เก็บในตะกร้า localStorage)
 *   - user: ข้อมูลผู้ใช้ที่เข้ารหัสจาก token (name, email, role, etc.)
 *   - login: ฟังก์ชันสำหรับล็อกอิน (บันทึก token)
 *   - logout: ฟังก์ชันสำหรับออกจากระบบ (ลบ token)
 * 
 * วิธีใช้:
 *   const { token, user, login, logout } = useAuth();
 */

import { createContext, useContext, useState, useEffect } from "react";

// สร้าง Context สำหรับ authentication
const AuthContext = createContext(null);

/**
 * useAuth() - Hook สำหรับใช้ AuthContext
 * 
 * @returns {object} - { token, user, login, logout }
 * 
 * ตัวอย่าง:
 *   const { token, user } = useAuth();
 *   if (!token) { // ไม่ได้ล็อกอิน
 *     return <Navigate to="/login" />;
 *   }
 */
export const useAuth = () => useContext(AuthContext);

/**
 * decodeToken - ถอดรหัส JWT token เพื่อดึงข้อมูล payload
 * 
 * JWT token มี 3 ส่วน: header.payload.signature
 * โค้ดนี้ดึงส่วน payload (ตรงกลาง) แล้ว decode ด้วย base64
 * 
 * @param {string} t - JWT token ที่ต้องถอดรหัส
 * @returns {object|null} - Data object หรือ null ถ้า error
 * 
 * ตัวอย่างข้อมูลที่ได้:
 *   {
 *     userId: "64a7f3d2e5c9b1a2c3d4e5f6",
 *     name: "John Doe",
 *     email: "john@example.com",
 *     role: "user",
 *     exp: 1699156000000
 *   }
 */
const decodeToken = (t) => {
  try { 
    // ขั้นตอนที่ 1: แบ่ง token ด้วย "." และเอาส่วนตรงกลาง (payload)
    // ขั้นตอนที่ 2: ใช้ atob() ถอดรหัส base64
    // ขั้นตอนที่ 3: แปลง string เป็น JSON object
    return JSON.parse(atob(t.split(".")[1])); 
  } catch { 
    // ถ้า error ให้ return null
    return null; 
  }
};

/**
 * ═══════════════════════════════════════════════════════════════════
 * AuthProvider - Component Wrapper สำหรับ Authentication Context
 * ═══════════════════════════════════════════════════════════════════
 * 
 * ห่ออ้อม App component ด้วย AuthProvider เพื่อให้ทุก child component
 * สามารถเข้าถึง authentication state ผ่าน useAuth() hook
 * 
 * @param {React.ReactNode} children - Child components ที่ต้องอ้อม
 * 
 * ขั้นตอนการทำงาน:
 *   1. ดึง token จาก localStorage (ถ้าที่เคยล็อกอิน)
 *   2. ถ้ามี token จะถอดรหัสเพื่อดึง user data
 *   3. เมื่อ token เปลี่ยน จะอัปเดต user data โดยอัตโนมัติ
 *   4. Provide { token, user, login, logout } ให้ทุก child component
 */
export function AuthProvider({ children }) {
  // ขั้นตอนที่ 1: สร้าง state สำหรับ token
  // ดึงจาก localStorage ตั้งแต่เริ่มต้น
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  
  // สร้าง state สำหรับ user info
  const [user, setUser] = useState(null);

  // ขั้นตอนที่ 2: Side effect - เมื่อ token เปลี่ยน ให้อัปเดต user
  useEffect(() => {
    // ถ้ามี token ให้ถอดรหัสเพื่อดึง user data
    if (token) setUser(decodeToken(token));
    // ถ้าไม่มี token ให้เคลียร์ user data
    else setUser(null);
  }, [token]); // dependency: เมื่อ token เปลี่ยน

  /**
   * login - บันทึก token ลงใน state และ localStorage
   * 
   * @param {string} t - JWT token ที่ได้จากเซิร์ฟเวอร์
   * 
   * ขั้นตอนการทำงาน:
   *   1. บันทึก token ลง localStorage
   *   2. อัปเดต token state (ทำให้ useEffect ทำงาน)
   *   3. useEffect ถอดรหัสและอัปเดต user data
   */
  const login = (t) => { 
    localStorage.setItem("token", t);  // บันทึกลง browser storage
    setToken(t);  // อัปเดต state
  };

  /**
   * logout - ลบ token และ user data
   * 
   * ขั้นตอนการทำงาน:
   *   1. ลบ token จาก localStorage
   *   2. ตั้ง token state เป็น null
   *   3. useEffect ถูกกระตุ้นและตั้ง user เป็น null
   */
  const logout = () => { 
    localStorage.removeItem("token");  // ลบจาก browser storage
    setToken(null);  // ตั้ง token เป็น null
  };

  // ขั้นตอนที่ 3: Provide context ให้ child components ทั้งหมด
  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
