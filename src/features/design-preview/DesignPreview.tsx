import { faArrowRight, faCamera, faMagnifyingGlass, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, IconButton } from '../../design/components/Button';
import { DailyBars, DonutChart } from '../../design/components/Charts';
import { StackedBar } from '../../design/components/StackedBar';
import { EmptyState, ProgressBar, Skeleton } from '../../design/components/Feedback';
import { Money } from '../../design/components/Money';
import { PageLoader } from '../../design/components/PageLoader';
import { Paper } from '../../design/components/Paper';
import { DoneStamp } from '../../design/components/Stamp';
import { Tag } from '../../design/components/Tag';
import { Icon } from '../../design/Icon';
import { CATEGORY_ICONS, CATEGORY_ICON_KEYS } from '../../design/icons';
import { CAT_COLORS } from '../../design/palette';
import { ThemePicker } from '../settings/ThemePicker';
import { KhaoTang, type Mood } from '../../mascot/KhaoTang';
import { CategoryEditorSheet } from '../categories/CategoryEditor';
import { CategoryGrid } from '../categories/CategoryGrid';
import { forType, useCategories } from '../categories/store';
import { SlipCard, SlipThumbMock } from '../inbox/SlipCard';
import { Receipt } from '../transactions/Receipt';
import { BANK_NAME, BANK_TINT, MOCK_SLIPS, MOCK_TX, MONTH, WEEK_BARS, catById } from './mockData';
import './preview.css';

const INKS = [
  ['--paper', 'กระดาษ'],
  ['--sheet', 'ใบเสร็จ'],
  ['--ink', 'หมึก'],
  ['--ink-2', 'หมึกรอง'],
  ['--accent', 'อิฐ · กดได้'],
  ['--income', 'รายรับ'],
  ['--over', 'เกินงบ'],
  ['--mark', 'ปากกาเน้น'],
] as const;

const MOODS: { mood: Mood; when: string }[] = [
  { mood: 'happy', when: 'อยู่ในงบ' },
  { mood: 'worried', when: 'ใช้เร็วเกิน' },
  { mood: 'sleeping', when: 'ไม่มีสลิป' },
  { mood: 'reading', when: 'กำลังอ่าน' },
  { mood: 'celebrate', when: 'จดครบ' },
];

export function DesignPreview() {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [tag, setTag] = useState('food');
  const [picked, setPicked] = useState<string>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [stamp, setStamp] = useState(false);
  const [demoSlips, setDemoSlips] = useState(MOCK_SLIPS.slice(2, 4));
  const [progress, setProgress] = useState(3);

  useEffect(() => {
    const t = setInterval(() => setProgress((p) => (p >= 12 ? 0 : p + 1)), 700);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!stamp) return;
    const t = setTimeout(() => setStamp(false), 1900);
    return () => clearTimeout(t);
  }, [stamp]);

  const expenseCats = forType(categories, 'expense');
  const slices = MONTH.byCategory.map((s) => ({ id: s.id, name: s.name, value: s.value, color: s.color }));

  return (
    <main className="page dp">
      <header className="dp-head">
        <div className="dp-brand">
          <img src="favicon.svg" alt="" width={44} height={44} className="dp-brand__icon" />
          <div>
            <h1>จดกัน</h1>
            <p className="dp-muted">Design preview · v0.2 · แนวใบเสร็จ</p>
          </div>
        </div>
        <ThemePicker />
        <Button size="lg" block icon={faArrowRight} onClick={() => navigate('/design-preview/app')}>
          ลองหน้าแอปตัวอย่าง
        </Button>
      </header>

      <Section title="แนวคิด">
        <p className="dp-lead">
          แอปนี้เริ่มจากสลิป หน้าตาทั้งหมดเลยเป็น <b>สมุดบัญชีกับใบเสร็จ</b>: พื้นกระดาษ หมึกเกือบดำ สีอิฐสีเดียวสำหรับสิ่งที่กดได้ และ<span className="mark">ปากกาเน้นสีเหลือง</span>
          สำหรับจุดที่ต้องตรวจ ข้อมูลอยู่บนหน้าโดยตรง ใช้กระดาษใบเสร็จเฉพาะตอนที่ต้องจัดกลุ่ม
        </p>
      </Section>

      <Section title="สี">
        <div className="dp-swatches">
          {INKS.map(([v, name]) => (
            <div key={v} className="dp-swatch">
              <span className="dp-swatch__chip" style={{ background: `var(${v})` }} />
              <span>{name}</span>
            </div>
          ))}
        </div>
        <div className="dp-sub">หมึกหมวดหมู่ 12 สี (เหมือนดินสอสี)</div>
        <div className="dp-inks">
          {CAT_COLORS.map((c) => (
            <span key={c} className="dp-ink" style={{ background: `var(--cat-${c})` }} title={c} />
          ))}
        </div>
      </Section>

      <Section title="ตัวอักษร" note="IBM Plex Sans Thai Looped · ตัวเลขใหญ่ IBM Plex Sans Condensed · เลขอ้างอิง IBM Plex Mono">
        <div className="dp-type">
          <span className="dp-muted">ใช้ไปเดือนนี้</span>
          <Money value={MONTH.expense} size="hero" countUp />
          <h1 style={{ fontSize: 26, marginTop: 16 }}>หัวข้อหน้า 26 หนา</h1>
          <h2 style={{ fontSize: 15 }}>หัวข้อส่วน 15 หนา</h2>
          <p>เนื้อหา 15px ไทยแบบมีหัว อ่านง่ายและดูอบอุ่นเหมือนสมุดบัญชี English 0123456789</p>
          <p className="mono dp-muted">REF 015296121834BTF07211 · 12:18</p>
          <div className="dp-row">
            <Money value={3250000} size="md" tone="income" sign="plus" />
            <Money value={18900} size="md" sign="minus" />
            <Money value={45000} size="md" tone="over" sign="minus" />
          </div>
        </div>
      </Section>

      <Section title="ปุ่ม" note="สีอิฐมีได้ปุ่มเดียวต่อหน้า ที่เหลือเป็นหมึก เส้น หรือข้อความ">
        <div className="dp-row dp-wrap">
          <Button icon={faCamera}>อ่านสลิป</Button>
          <Button variant="ink">บันทึก</Button>
          <Button variant="quiet" icon={faPlus}>
            เพิ่มคำ
          </Button>
          <Button variant="ghost">ยกเลิก</Button>
          <Button variant="danger" icon={faTrash}>
            ลบ
          </Button>
          <IconButton icon={faMagnifyingGlass} label="ค้นหา" />
        </div>
      </Section>

      <Section title="ใบเสร็จ" note="รายการจัดกลุ่มตามวัน มียอดสุทธิของวัน · ลองปัดซ้าย/ขวา">
        <Receipt txs={MOCK_TX.slice(0, 5)} categoryOf={(id) => catById[id]} onDelete={() => {}} onEdit={() => {}} />
      </Section>

      <Section title="กราฟ">
        <div className="dp-sub">หน้าแรก: แถบเดียวแบ่งตามหมวด</div>
        <StackedBar data={slices} />
        <div className="dp-sub">สรุป: แท่งรายวันมีแกนจริง วันนี้เป็นสีอิฐ</div>
        <DailyBars data={WEEK_BARS} />
        <div className="dp-sub">สรุป: วงแหวนบาง</div>
        <DonutChart data={slices} size={150} label="รายจ่าย" />
      </Section>

      <Section title="สลิปรอจด" note="ช่องที่ข้าวตังอ่านไม่ชัดถูกขีดด้วยปากกาเน้น">
        <div className="reading">
          <KhaoTang mood="reading" size={60} />
          <div className="reading__text">
            <span className="reading__title">ข้าวตังกำลังอ่านสลิป</span>
            <ProgressBar value={progress} max={12} />
            <span className="reading__count num">อ่านแล้ว {progress}/12 ใบ</span>
          </div>
        </div>
        <div className="slip-stack">
          <AnimatePresence initial={false} mode="popLayout">
            {demoSlips.map((s, i) => (
              <SlipCard
                key={s.id}
                thumb={<SlipThumbMock tint={BANK_TINT[s.bank]} />}
                bankName={BANK_NAME[s.bank]}
                amount={s.amount}
                counterparty={s.receiver}
                occurredAt={s.occurredAt}
                refNo={s.refNo}
                categories={expenseCats}
                suggestedCategoryId={s.suggestedCategoryId}
                lowConfidence={s.lowConfidence}
                duplicate={i === 1}
                onPick={() => setDemoSlips((d) => d.filter((x) => x.id !== s.id))}
                onCreate={() => setEditorOpen(true)}
              />
            ))}
          </AnimatePresence>
          <Paper className="skeleton-slip">
            <Skeleton w={64} h={92} r={4} />
            <div className="skeleton-slip__lines">
              <Skeleton w="50%" h={22} />
              <Skeleton w="75%" />
              <Skeleton w="40%" h={10} />
            </div>
          </Paper>
          {demoSlips.length === 0 && (
            <Button variant="quiet" onClick={() => setDemoSlips(MOCK_SLIPS.slice(2, 4))}>
              แสดงสลิปอีกครั้ง
            </Button>
          )}
        </div>
      </Section>

      <Section title="หมวดหมู่" note={`ตาราง 4 คอลัมน์ · ป้ายหมวด · ไอคอนให้เลือก ${CATEGORY_ICON_KEYS.length} แบบ`}>
        <CategoryGrid categories={expenseCats} suggestedId="food" selectedId={picked} onPick={setPicked} onCreate={() => setEditorOpen(true)} />
        <div className="tag-row">
          {expenseCats.map((c) => (
            <Tag key={c.id} label={c.name} icon={c.icon} color={c.color} selected={tag === c.id} onClick={() => setTag(c.id)} />
          ))}
        </div>
        <Button variant="quiet" icon={faPlus} onClick={() => setEditorOpen(true)}>
          เปิดหน้าสร้างหมวดหมู่
        </Button>
        <div className="dp-icons">
          {CATEGORY_ICON_KEYS.slice(0, 42).map((k) => (
            <span key={k} className="dp-icons__cell" title={k}>
              <Icon icon={CATEGORY_ICONS[k]} size={16} />
            </span>
          ))}
        </div>
      </Section>

      <Section title="ข้าวตัง" note="ลายเส้นหมึก ลงสีเหลื่อมแบบงานพิมพ์ riso · โผล่เฉพาะตอนว่าง ตอนอ่าน และตอนสรุป">
        <div className="dp-moods">
          {MOODS.map((m) => (
            <div key={m.mood} className="dp-mood">
              <KhaoTang mood={m.mood} size={92} />
              <span className="dp-muted">{m.when}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="กำลังโหลด" note="ขึ้นเมื่อหน้าหรือข้อมูลโหลดนานเกิน 0.15 วินาที">
        <Paper>
          <PageLoader />
        </Paper>
      </Section>

      <Section title="หน้าว่างและตราประทับ">
        <Paper>
          <EmptyState mood="sleeping" title="ไม่มีสลิปรอจด" body="กด “จด” ด้านล่าง แล้วเลือกรูปสลิปจากอัลบั้ม" />
        </Paper>
        <Button variant="ink" onClick={() => setStamp(true)}>
          ดูตราประทับ “จดครบ”
        </Button>
      </Section>

      <Section title="ไอคอนแอป">
        <div className="dp-row">
          <img src="apple-touch-icon-180x180.png" alt="ไอคอนแอป" width={84} height={84} className="dp-appicon" />
          <img src="apple-touch-icon-180x180.png" alt="" width={56} height={56} className="dp-appicon dp-appicon--sm" />
        </div>
      </Section>

      {stamp && <DoneStamp />}
      <CategoryEditorSheet open={editorOpen} onClose={() => setEditorOpen(false)} onSaved={(c) => setPicked(c.id)} />
    </main>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="dp-section">
      <div className="dp-section__head">
        <h2>{title}</h2>
        {note && <p className="dp-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}
