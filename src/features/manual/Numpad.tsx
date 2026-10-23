import { faDeleteLeft } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '../../design/Icon';
import type { AmountKey } from '../../lib/amountInput';

const KEYS: AmountKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];

/** The app's own keypad, so the iOS keyboard never covers the form. */
export function Numpad({ onKey }: { onKey: (key: AmountKey) => void }) {
  return (
    <div className="numpad" role="group" aria-label="แป้นตัวเลข">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          className={`numpad__key ${k === 'back' ? 'numpad__key--back' : ''}`}
          onClick={() => onKey(k)}
          aria-label={k === 'back' ? 'ลบตัวเลข' : k === '.' ? 'จุดทศนิยม' : k}
        >
          {k === 'back' ? <Icon icon={faDeleteLeft} size={20} /> : k}
        </button>
      ))}
    </div>
  );
}
