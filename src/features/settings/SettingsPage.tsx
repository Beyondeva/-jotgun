import { faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Paper } from '../../design/components/Paper';
import { Segmented } from '../../design/components/Segmented';
import { Sheet } from '../../design/components/Sheet';
import { Icon } from '../../design/Icon';
import { db } from '../../db/db';
import { useBudgets } from '../../db/budgets';
import { useOwnerNames } from '../../db/settings';
import type { Category } from '../../db/types';
import { useThemePref, type ThemePref } from '../../lib/theme';
import { useCachedLiveQuery } from '../../lib/useCachedLiveQuery';
import { CategoryEditorSheet } from '../categories/CategoryEditor';
import { CategoryList } from '../categories/CategoryList';
import { useCategories } from '../categories/store';
import { BudgetsSheet } from './BudgetsSheet';
import { DataSheet } from './DataSheet';
import { FlickerTest } from './FlickerTest';
import { OwnerNamesSheet } from './OwnerNamesSheet';
import { PayeeMemorySheet } from './PayeeMemorySheet';

type Open = 'categories' | 'owners' | 'memory' | 'budgets' | 'data' | null;

export function SettingsPage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useThemePref();
  const { categories, rules } = useCategories();
  const owners = useOwnerNames();
  const remembered = useCachedLiveQuery('payees:count', () => db.payeeMemory.count(), []) ?? 0;
  const budgets = useBudgets() ?? [];
  const txCount = useCachedLiveQuery('tx:count', () => db.transactions.count(), []) ?? 0;
  const [open, setOpen] = useState<Open>(null);
  const [editing, setEditing] = useState<Category | 'new' | null>(null);

  const Row = ({ label, value, onClick }: { label: string; value?: string | number; onClick: () => void }) => (
    <button className="list__row" onClick={onClick}>
      <span className="list__label">{label}</span>
      {value !== undefined ? <span className="list__value num">{value}</span> : <span />}
      <Icon icon={faAngleRight} size={13} className="list__chev" />
    </button>
  );

  return (
    <>
      <h1 className="page-title">ตั้งค่า</h1>

      {/* TEMPORARY: flicker diagnosis on iPhone — remove after */}
      <FlickerTest />

      <div className="list-cap">ธีม</div>
      <Segmented<ThemePref>
        value={theme}
        onChange={setTheme}
        options={[
          { value: 'system', label: 'ตามเครื่อง' },
          { value: 'light', label: 'สว่าง' },
          { value: 'dark', label: 'มืด' },
        ]}
      />

      <div className="list-cap">บัญชี</div>
      <Paper className="list">
        <Row label="ชื่อเจ้าของบัญชี" value={owners?.length ? owners.length : 'ยังไม่ได้ตั้ง'} onClick={() => setOpen('owners')} />
      </Paper>

      <div className="list-cap">งบ</div>
      <Paper className="list">
        <Row label="งบรายเดือน" value={budgets.length ? `${budgets.length} หมวด` : 'ยังไม่ได้ตั้ง'} onClick={() => setOpen('budgets')} />
      </Paper>

      <div className="list-cap">จัดหมวดอัตโนมัติ</div>
      <Paper className="list">
        <Row label="หมวดหมู่และคำ" value={`${categories.length} · ${rules.length} คำ`} onClick={() => setOpen('categories')} />
        <Row label="ผู้รับที่จำไว้" value={remembered} onClick={() => setOpen('memory')} />
      </Paper>

      <div className="list-cap">ข้อมูล</div>
      <Paper className="list">
        <Row label="สำรองและส่งออก" value={`${txCount} รายการ`} onClick={() => setOpen('data')} />
      </Paper>

      {/* design preview is a development tool; hidden in the deployed app */}
      {import.meta.env.DEV && (
        <>
          <div className="list-cap">อื่นๆ</div>
          <Paper className="list">
            <Row label="Design preview" onClick={() => navigate('/design-preview')} />
          </Paper>
        </>
      )}

      <Sheet open={open === 'categories'} onClose={() => setOpen(null)} title="หมวดหมู่">
        <CategoryList onEdit={setEditing} onCreate={() => setEditing('new')} />
      </Sheet>
      <CategoryEditorSheet open={editing !== null} onClose={() => setEditing(null)} category={editing && editing !== 'new' ? editing : undefined} />
      <OwnerNamesSheet open={open === 'owners'} onClose={() => setOpen(null)} />
      <PayeeMemorySheet open={open === 'memory'} onClose={() => setOpen(null)} />
      <BudgetsSheet open={open === 'budgets'} onClose={() => setOpen(null)} />
      <DataSheet open={open === 'data'} onClose={() => setOpen(null)} />
    </>
  );
}
