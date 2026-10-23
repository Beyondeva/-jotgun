import type { Category, Rule } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'อาหาร', icon: 'utensils', color: 'brick', kind: 'expense', order: 0 },
  { id: 'cafe', name: 'กาแฟ ขนม', icon: 'coffee', color: 'sand', kind: 'expense', order: 1 },
  { id: 'travel', name: 'เดินทาง', icon: 'bus', color: 'sky', kind: 'expense', order: 2 },
  { id: 'shopping', name: 'ช้อปปิ้ง', icon: 'shopping-bag', color: 'plum', kind: 'expense', order: 3 },
  { id: 'bills', name: 'บิล ค่าน้ำไฟ', icon: 'zap', color: 'ochre', kind: 'expense', order: 4 },
  { id: 'home', name: 'ที่พัก', icon: 'house', color: 'clay', kind: 'expense', order: 5 },
  { id: 'health', name: 'สุขภาพ', icon: 'heart-pulse', color: 'moss', kind: 'expense', order: 6 },
  { id: 'fun', name: 'บันเทิง', icon: 'gamepad', color: 'indigo', kind: 'expense', order: 7 },
  { id: 'edu', name: 'การศึกษา', icon: 'graduation-cap', color: 'teal', kind: 'expense', order: 8 },
  { id: 'gift', name: 'ของขวัญ ทำบุญ', icon: 'gift', color: 'rose', kind: 'expense', order: 9 },
  { id: 'pet', name: 'สัตว์เลี้ยง', icon: 'paw', color: 'olive', kind: 'expense', order: 10 },
  { id: 'other', name: 'อื่นๆ', icon: 'ellipsis', color: 'slate', kind: 'both', order: 11 },
  { id: 'salary', name: 'เงินเดือน', icon: 'briefcase', color: 'moss', kind: 'income', order: 12 },
  { id: 'transfer-in', name: 'รับโอน', icon: 'hand-coins', color: 'teal', kind: 'income', order: 13 },
  { id: 'bonus', name: 'รายได้เสริม', icon: 'sparkles', color: 'ochre', kind: 'income', order: 14 },
];

const kw = (categoryId: string, ...keywords: string[]): Rule[] =>
  keywords.map((keyword) => ({ id: `builtin:${keyword}`, keyword, categoryId, builtin: true }));

export const DEFAULT_RULES: Rule[] = [
  ...kw('food', 'LINE MAN', 'LINEMAN', 'GRABFOOD', 'GRAB FOOD', 'FOODPANDA', 'ROBINHOOD', 'SHOPEEFOOD', 'KFC', 'MCDONALD'),
  ...kw('cafe', 'STARBUCKS', 'CAFE AMAZON', 'กาแฟ', 'CAFE'),
  ...kw('travel', 'BTS', 'MRT', 'BEM', 'GRAB', 'BOLT', 'EASY PASS', 'การทางพิเศษ', 'PTT', 'บางจาก', 'SHELL'),
  ...kw('shopping', 'SHOPEE', 'LAZADA', '7-ELEVEN', 'เซเว่น', 'LOTUS', 'BIG C', 'MAKRO', 'CENTRAL'),
  ...kw('bills', 'การไฟฟ้า', 'การประปา', 'MEA', 'PEA', 'AIS', 'TRUE', 'DTAC', '3BB'),
  ...kw('health', 'โรงพยาบาล', 'คลินิก', 'HOSPITAL', 'ร้านยา', 'PHARMACY'),
  ...kw('fun', 'NETFLIX', 'SPOTIFY', 'YOUTUBE', 'MAJOR', 'SF CINEMA', 'STEAM'),
];
