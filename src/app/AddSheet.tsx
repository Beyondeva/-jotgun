import { faAngleRight, faCamera, faPen } from '@fortawesome/free-solid-svg-icons';
import { useRef } from 'react';
import { useNavigate } from 'react-router';
import { Sheet } from '../design/components/Sheet';
import { Icon } from '../design/Icon';
import { useReader } from '../features/inbox/reader';
import { useShell } from './shell';

/** "จดรายการใหม่": read slips from photos, or write one by hand. Phone tab bar and wide layout both open it. */
export function AddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { openManual } = useShell();
  const { readFiles } = useReader();
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <>
      <Sheet open={open} onClose={onClose} title="จดรายการใหม่">
        <div className="add-list">
          {/* the picker must open inside the tap itself, or iOS blocks it */}
          <button className="add-row" onClick={() => fileInput.current?.click()}>
            <span className="add-row__icon">
              <Icon icon={faCamera} size={16} />
            </span>
            <span className="add-row__title">อ่านสลิปจากรูป</span>
            <Icon icon={faAngleRight} size={14} className="list__chev" />
          </button>
          <button
            className="add-row"
            onClick={() => {
              onClose();
              openManual();
            }}
          >
            <span className="add-row__icon">
              <Icon icon={faPen} size={16} />
            </span>
            <span className="add-row__title">จดเอง</span>
            <Icon icon={faAngleRight} size={14} className="list__chev" />
          </button>
        </div>
      </Sheet>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = ''; // allow picking the same files again
          if (!files.length) return;
          onClose();
          readFiles(files);
          navigate('/inbox');
        }}
      />
    </>
  );
}
