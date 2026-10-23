import { faCheck, faPlus, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Button } from '../../design/components/Button';
import { Money } from '../../design/components/Money';
import { CategoryIcon } from '../../design/components/CategoryIcon';
import { Segmented } from '../../design/components/Segmented';
import { Sheet } from '../../design/components/Sheet';
import { Icon } from '../../design/Icon';
import type { CategoryIconKey } from '../../design/icons';
import { CATEGORY_COLORS, catColor, type CatColor } from '../../design/palette';
import type { Category, TxType } from '../../db/types';
import { IconPicker } from './IconPicker';
import { FALLBACK_CATEGORY_ID, normalizeKeyword, useCategories } from './store';
import './categories.css';

export interface CategoryDraft {
  kind?: TxType;
  name?: string;
  keywords?: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** edit this category; omit to create a new one */
  category?: Category;
  /** prefill for a new category, e.g. from a slip's receiver */
  draft?: CategoryDraft;
  onSaved?: (category: Category) => void;
}

export function CategoryEditorSheet({ open, onClose, category, draft, onSaved }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={category ? 'แก้ไขหมวดหมู่' : 'สร้างหมวดหมู่'}>
      {/* remount per open so the form starts from the right values */}
      {open && <CategoryForm key={category?.id ?? 'new'} category={category} draft={draft} onDone={onClose} onSaved={onSaved} />}
    </Sheet>
  );
}

interface FormProps {
  category?: Category;
  draft?: CategoryDraft;
  onDone: () => void;
  onSaved?: (category: Category) => void;
}

function CategoryForm({ category, draft, onDone, onSaved }: FormProps) {
  const store = useCategories();
  const [name, setName] = useState(category?.name ?? draft?.name ?? '');
  const [kind, setKind] = useState<TxType>(category?.kind === 'income' ? 'income' : (draft?.kind ?? 'expense'));
  const [kindTouched, setKindTouched] = useState(false);
  const [color, setColor] = useState<CatColor>(category?.color ?? 'brick');
  const [icon, setIcon] = useState<CategoryIconKey>(category?.icon ?? 'utensils');
  const [keywords, setKeywords] = useState<string[]>(category ? store.keywordsOf(category.id) : (draft?.keywords ?? []));
  const [kwInput, setKwInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // a seeded colour outside the 8-colour picker stays selectable
  const colors = CATEGORY_COLORS.includes(color) ? CATEGORY_COLORS : [color, ...CATEGORY_COLORS];

  const trimmed = name.trim();
  const duplicate = store.categories.find((c) => c.id !== category?.id && c.name.trim() === trimmed);
  const canSave = trimmed.length > 0 && !duplicate;
  const canDelete = category && category.id !== FALLBACK_CATEGORY_ID;

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const addKeyword = () => {
    const k = normalizeKeyword(kwInput);
    if (!k) return;
    if (!keywords.some((x) => x.toLocaleUpperCase('th') === k.toLocaleUpperCase('th'))) setKeywords([...keywords, k]);
    setKwInput('');
  };

  const save = async () => {
    if (!canSave) return;
    const pending = normalizeKeyword(kwInput);
    const saved = await store.save({
      id: category?.id,
      name: trimmed,
      // keep "both" on the fallback category unless the user picks a type
      kind: category?.kind === 'both' && !kindTouched ? 'both' : kind,
      color,
      icon,
      keywords: pending ? [...keywords, pending] : keywords,
    });
    onSaved?.(saved);
    onDone();
  };

  const remove = async () => {
    if (!category) return;
    if (!confirmDelete) return setConfirmDelete(true);
    await store.remove(category.id);
    onDone();
  };

  return (
    <div className="cat-form">
      {/* live preview */}
      <div className="cat-preview">
        <div className="paper paper--torn cat-preview__paper">
          <div className="tx">
            <motion.span key={`${icon}-${color}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }}>
              <CategoryIcon icon={icon} color={color} />
            </motion.span>
            <div className="tx__main">
              <div className={`tx__title ${trimmed ? '' : 'cat-preview__placeholder'}`}>{keywords[0] ?? (trimmed || 'ชื่อหมวดหมู่')}</div>
              <div className="tx__sub">
                <span>{trimmed || 'ชื่อหมวดหมู่'}</span>
                <span aria-hidden>·</span>
                <span className="num">12:30</span>
              </div>
            </div>
            <div className="tx__amt">
              <Money value={kind === 'income' ? 150000 : 12000} size="md" bare tone={kind === 'income' ? 'income' : 'default'} sign={kind === 'income' ? 'plus' : 'minus'} />
            </div>
          </div>
        </div>
        <div className="cat-preview__rules">
          {keywords.length > 0 ? `จัดอัตโนมัติ ${keywords.length} คำ` : ''}
        </div>
      </div>

      <label className="field">
        <span className="field__label">ชื่อ</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น ค่าขนมแมว" maxLength={24} enterKeyHint="done" />
        {duplicate && <span className="field__help cat-form__error">มีหมวด “{duplicate.name}” อยู่แล้ว</span>}
      </label>

      <div className="field">
        <span className="field__label">ประเภท</span>
        <Segmented<TxType>
          value={kind}
          onChange={(k) => {
            setKind(k);
            setKindTouched(true);
          }}
          options={[
            { value: 'expense', label: 'รายจ่าย' },
            { value: 'income', label: 'รายรับ' },
          ]}
        />
      </div>

      <div className="field">
        <span className="field__label">สี</span>
        <div className="swatches" role="radiogroup" aria-label="สี">
          {colors.map((c) => (
            <motion.button
              key={c}
              type="button"
              role="radio"
              aria-checked={c === color}
              aria-label={c}
              className={`swatch ${c === color ? 'is-active' : ''}`}
              style={{ background: catColor(c).ink, ['--ring' as string]: catColor(c).ink }}
              onClick={() => setColor(c)}
            >
              {c === color && <Icon icon={faCheck} size={14} />}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field__label">ไอคอน</span>
        <IconPicker value={icon} color={color} onChange={setIcon} />
      </div>

      <div className="field">
        <span className="field__label">คำในชื่อผู้รับ</span>
        <div className="kw-input">
          <input
            className="input"
            value={kwInput}
            onChange={(e) => setKwInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword();
              }
            }}
            placeholder="เช่น LINE MAN, 7-ELEVEN"
            enterKeyHint="enter"
            autoCapitalize="characters"
          />
          <Button variant="quiet" icon={faPlus} onClick={addKeyword} disabled={!kwInput.trim()} aria-label="เพิ่มคำ" />
        </div>
        <span className="field__help">ชื่อผู้รับมีคำนี้ → เข้าหมวดนี้อัตโนมัติ</span>
        <div className="kw-list">
          <AnimatePresence initial={false}>
            {keywords.map((k) => {
              const owner = store.keywordOwner(k, category?.id);
              return (
                <motion.span
                  key={k}
                  layout
                  className="kw"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  style={{ color: catColor(color).ink, borderColor: catColor(color).ink }}
                >
                  <span>{k}</span>
                  {owner && <span className="kw__move">ย้ายจาก{owner.name}</span>}
                  <button type="button" className="kw__x" aria-label={`ลบคำ ${k}`} onClick={() => setKeywords(keywords.filter((x) => x !== k))}>
                    <Icon icon={faXmark} size={12} />
                  </button>
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="cat-form__actions">
        <Button size="lg" block onClick={save} disabled={!canSave}>
          {category ? 'บันทึก' : 'สร้างหมวดหมู่'}
        </Button>
        {canDelete && (
          <Button variant={confirmDelete ? 'danger' : 'ghost'} icon={faTrash} block onClick={remove}>
            {confirmDelete ? 'แตะอีกครั้งเพื่อลบ' : 'ลบหมวดนี้'}
          </Button>
        )}
      </div>
    </div>
  );
}
