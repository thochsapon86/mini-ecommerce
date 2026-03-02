// นำเข้า StrictMode ซึ่งช่วยตรวจจับปัญหาต่าง ๆ ในช่วงพัฒนา (development)
import { StrictMode } from 'react'
// ฟังก์ชัน createRoot คือ API แบบใหม่ของ React 18 สำหรับเริ่มต้น root
import { createRoot } from 'react-dom/client'
// นำเข้าไฟล์ CSS หลักของแอป
import './index.css'
// นำเข้าคอมโพเนนต์ App หลักของแอป
import App from './App.jsx'

// สร้าง root node ของ React และเรนเดอร์คอมโพเนนต์ App ลงไป
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
