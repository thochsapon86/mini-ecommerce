/**
 * ═══════════════════════════════════════════════════════════════════
 * main.jsx - React Entry Point
 * ═══════════════════════════════════════════════════════════════════
 * 
 * ไฟล์หลักสำหรับ React Application
 * โหลด CSS และ render App component เข้าไปใน DOM element
 * 
 * ขั้นตอนการทำงาน:
 *   1. Import React utilities
 *   2. Import CSS files (global styles)
 *   3. Import App component (root component)
 *   4. ค้นหา HTML element ด้วย id "root"
 *   5. Render App component ผ่าน ReactDOM
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Global CSS styles
import App from './App.jsx' // Root component

// ขั้นตอนที่ 4-5: ค้นหา root element และ render App component
// StrictMode จะช่วยตรวจสอบปัญหาในการพัฒนา
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)