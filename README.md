# จดกัน (Jotgun)

PWA จดรายรับรายจ่ายส่วนตัว อ่านสลิปโอนเงินธนาคารไทยให้อัตโนมัติ ใช้บน iPhone ผ่าน Safari แบบ "เพิ่มไปยังหน้าจอโฮม"
ข้อมูลทั้งหมดอยู่ในเครื่อง (IndexedDB) ไม่มี backend

- Vite + React + TypeScript, vite-plugin-pwa
- Dexie (IndexedDB)
- OCR: tesseract.js (tha+eng) ใน Web Worker, QR: jsQR
- กราฟ: Recharts, ไอคอน: Font Awesome, อนิเมชัน: framer-motion

## Deploy

เชื่อม repo นี้กับ Vercel แล้วทุก push เข้า `main` จะ deploy ให้อัตโนมัติ (ค่าตั้งใน `vercel.json`) · ต้องเป็น HTTPS เพื่อให้ PWA ทำงานเต็มที่

## พัฒนา

```bash
npm install
npm run dev        # เปิดบนมือถือใน Wi-Fi เดียวกันที่ http://<IP เครื่อง>:5173
npm test           # Vitest: ตัวอ่านสลิป, หมวดอัตโนมัติ, ฐานข้อมูล ฯลฯ
npm run build
```

ผ่าน http บน LAN iOS จะไม่ลง service worker (ออฟไลน์และ "เพิ่มไปยังหน้าจอโฮม" แบบเต็มต้องใช้ HTTPS เช่นบน Vercel)

## โครงสร้าง

- `src/slip/` อ่านสลิป: ย่อรูป → QR → OCR → แยกข้อมูล (`parse.ts`, โปรไฟล์ธนาคารใน `banks.ts`)
  เจอสลิปที่อ่านผิด ให้เพิ่มข้อความ OCR (ปิดชื่อ/เลขบัญชี) ลง `src/slip/__tests__/fixtures.ts` แล้วแก้ให้ test ผ่าน
- `src/db/` ฐานข้อมูลและ logic ของสลิป หมวด งบ สำรองข้อมูล
- `src/features/` หน้าจอ
- `src/design/` tokens, component, ไอคอน

## Assets

```bash
npm run icons      # ไอคอนแอปจาก src/assets/logo/app-icon.svg
npm run splash     # หน้าจอเปิดแอป iOS จาก public/splash-mark.svg
```
