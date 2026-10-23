/**
 * OCR-style text for each bank's transfer slip. These are reconstructed from the
 * public layout of each app's slip (labels and order), with made-up names and
 * numbers; they include typical OCR noise. Add real (anonymised) OCR output here
 * whenever a slip is misread, and fix the parser against it.
 */

export const KBANK = `
โอนเงินสำเร็จ
23 ต.ค. 69 14:32 น.
K+
นาย สมชาย ใ
ธ.กสิกรไทย
xxx-x-x1234-x
LINE MAN Wongnai
Kbank-LINE MAN
xxx-x-x5678-x
เลขที่รายการ:
015296121834BTF07211
จำนวน:
189.00 บาท
ค่าธรรมเนียม:
0.00 บาท
สแกนตรวจสอบสลิป
`;

export const SCB = `
SCB
โอนเงินสำเร็จ
23 ต.ค. 2569 - 08:21
รหัสอ้างอิง: 202610230821SCB44918
จาก
นาย สมชาย ใจดี
xxx-xxx123-4
ไปยัง
BTS สยาม
xxx-xxx987-6
จำนวนเงิน
47.00
`;

export const KTB = `
Krungthai
โอนเงินสำเร็จ
รหัสอ้างอิง
KTB2610221746009312
จาก นาย สมชาย ใจดี
xxx-x-x1234-x
ไปยัง นาย ขวัญ ช่างตัดผม
ธนาคารกรุงไทย xxx-x-x9999-x
จำนวนเงิน 350.00 บาท
ค่าธรรมเนียม 0.00 บาท
วันที่ทำรายการ 22 ต.ค. 2569 - 17:46
`;

export const BBL = `
Bangkok Bank
Bualuang mBanking
โอนเงินสำเร็จ
22 Oct 2026, 10:05
จาก
MR. SOMCHAI JAIDEE
XXX-X-XX123-4
ไปที่
การไฟฟ้านครหลวง
หมายเลขอ้างอิง
BBL0221005M118347
จำนวนเงิน
THB 1,249.00
ค่าธรรมเนียม THB 0.00
`;

export const BAY = `
krungsri
ทำรายการสำเร็จ
21/10/2569 21:12
จาก
น.ส. มะปราง หวานใจ
XXX-X-X4321-X
ไปยัง
SHOPEE
เลขที่อ้างอิง
BAY20261021211200077
จำนวนเงิน
฿ 890.00
`;

export const TTB = `
ttb
โอนเงินสำเร็จ
20 ต.ค. 69 12:00
จาก นาย สมชาย ใจดี
ไปยัง ร้านกาแฟหน้าออฟฟิศ
จำนวนเงิน 65.00 บาท
รหัสอ้างอิง 20261020120000TTB1
`;

export const GSB = `
MyMo ออมสิน
โอนเงินสำเร็จ
๑๙ ต.ค. ๖๙ ๐๙:๑๕ น.
จาก นาง สมศรี ใจดี
ไปยัง นาย สมชาย ใจดี
จำนวนเงิน ๕๐๐.๐๐ บาท
เลขที่อ้างอิง GSB9912000123
`;

/** No bank name, no labels, odd spacing: should still find the amount and date. */
export const UNKNOWN = `
ชำระเงินสำเร็จ
18 ต.ค. 69  19:40
ร้านป้าแดง ข้าวแกง
ยอด 1,050.00 บาท
`;

/** Real tesseract.js (tha+eng) output for a rendered SCB-style slip: logo misread, stray vowel in the month, garbled reference. */
export const SCB_OCR_REAL = `568
a    ๐   ๕
โอนเงินสําเร็จ
23 ต.ุค. 2569 - 08:21
รหัสอ้างอิง: 20261023082150844918
จาก
นาย สมชาย ใจดี
2๐๐๓๐๐123-4
ไปยัง
BTS สยาม
จํานวนเงิน
47.00
`;

/** Real tesseract.js output for a rendered K PLUS-style slip (sara am split into nikhahit + sara aa). */
export const KBANK_OCR_REAL = `a    ๐   [=]
โอนเงินสําเร็จ
23 ต.ค. 69 14:32 น.
นาย สมชาย ใ
ธ.กสิกรไทย
XXX-X-X1234-x
LINE MAN Wongnai
XXX-X-X5678-x
เลขที่รายการ:
015296121834BTF07211
จํานวน:
189.00 บาท
ค่าธรรมเนียม:
0.00 บาท
`;

/**
 * Real tesseract.js output (ink-only pass) for a K PLUS slip with a cartoon
 * background, sent by the user. Names and numbers are replaced with made-up
 * ones of the same shape; the OCR junk around them is kept exactly.
 */
export const KBANK_ART_OCR_REAL = `โอนเงินสําเร็จ
Ix
15 ต.ค. 69 21:57 น.
, นาย สมชาย ใ
7 ธุกสิกรไทย                       -%
XXX-X-x1111-x                 i
๑
@  นาย มานะ ใจกว้างบ ” .
ธ.ไทยพาณิชย์
Xxx-x-x2222-x
จํานวน:
20.00 uw   EEE
ค่าธรรมเนียม:                  Fa
0.00 บาท   Ee
เลขที่รายการ:                 [el uid
012345678901AOR01234 เหต์ง
`;
