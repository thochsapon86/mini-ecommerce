/**
 * useValidation.js
 * ─────────────────────────────────────────────────────────────────
 * Custom Hook สำหรับ validate form ก่อนส่งข้อมูล
 * ใช้ได้กับทุก form ในแอป
 *
 * วิธีใช้:
 *   const { errors, validate, clearErrors } = useValidation();
 *
 *   const rules = {
 *     email: [
 *       { required: true, message: "กรุณากรอกอีเมล" },
 *       { pattern: /email/, message: "อีเมลไม่ถูกต้อง" }
 *     ]
 *   };
 *
 *   if (!validate(formData, rules)) return; // หยุดถ้า invalid
 */

import { useState } from "react";

export function useValidation() {
  const [errors, setErrors] = useState({});

  /**
   * validate - ตรวจสอบข้อมูลตาม rules
   * @param {object} data  - ข้อมูลที่ต้องการตรวจสอบ เช่น { email, password }
   * @param {object} rules - กฎการตรวจสอบแต่ละ field
   * @returns {boolean}    - true = ผ่านทั้งหมด, false = มี error
   */
  const validate = (data, rules) => {
    const newErrors = {};

    for (const field in rules) {
      const value = data[field];
      const fieldRules = rules[field];

      for (const rule of fieldRules) {
        // required
        if (rule.required && (!value || !String(value).trim())) {
          newErrors[field] = rule.message;
          break;
        }

        // minLength
        if (rule.minLength && value && String(value).length < rule.minLength) {
          newErrors[field] = rule.message;
          break;
        }

        // maxLength
        if (rule.maxLength && value && String(value).length > rule.maxLength) {
          newErrors[field] = rule.message;
          break;
        }

        // min (number)
        if (rule.min !== undefined && Number(value) < rule.min) {
          newErrors[field] = rule.message;
          break;
        }

        // max (number)
        if (rule.max !== undefined && Number(value) > rule.max) {
          newErrors[field] = rule.message;
          break;
        }

        // pattern (regex)
        if (rule.pattern && value && !rule.pattern.test(String(value))) {
          newErrors[field] = rule.message;
          break;
        }

        // custom function
        if (rule.custom && !rule.custom(value, data)) {
          newErrors[field] = rule.message;
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // true = ไม่มี error
  };

  const clearErrors = () => setErrors({});
  const clearError = (field) => setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });

  return { errors, validate, clearErrors, clearError };
}