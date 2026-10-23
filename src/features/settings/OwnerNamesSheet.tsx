import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { Button } from '../../design/components/Button';
import { Sheet } from '../../design/components/Sheet';
import { Icon } from '../../design/Icon';
import { setOwnerNames, useOwnerNames } from '../../db/settings';

/** Names on the owner's accounts. A slip sent to any of them counts as income. */
export function OwnerNamesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const names = useOwnerNames() ?? [];
  const [input, setInput] = useState('');

  const add = () => {
    const n = input.replace(/\s+/g, ' ').trim();
    if (n && !names.includes(n)) void setOwnerNames([...names, n]);
    setInput('');
  };

  return (
    <Sheet open={open} onClose={onClose} title="ชื่อเจ้าของบัญชี">
      <div className="field">
        <div className="kw-input">
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            placeholder="เช่น นาย สมชาย ใจดี"
            enterKeyHint="enter"
          />
          <Button variant="quiet" icon={faPlus} onClick={add} disabled={!input.trim()} aria-label="เพิ่มชื่อ" />
        </div>
        <span className="field__help">สลิปที่โอนเข้าชื่อนี้ = รายรับ · ใส่ทั้งไทยและอังกฤษได้</span>
        <div className="kw-list">
          {names.map((n) => (
            <span key={n} className="kw" style={{ borderColor: 'var(--income)', color: 'var(--income)' }}>
              <span>{n}</span>
              <button type="button" className="kw__x" aria-label={`ลบชื่อ ${n}`} onClick={() => void setOwnerNames(names.filter((x) => x !== n))}>
                <Icon icon={faXmark} size={12} />
              </button>
            </span>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
