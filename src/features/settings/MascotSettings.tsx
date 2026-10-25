import { useState } from 'react';
import { Paper } from '../../design/components/Paper';
import { KhaoTang, type Mood } from '../../mascot/KhaoTang';
import { setMascot3D, useMascot3DPref } from '../../mascot/prefs';

const MOODS: { mood: Mood; label: string }[] = [
  { mood: 'happy', label: 'ยิ้ม' },
  { mood: 'reading', label: 'อ่านสลิป' },
  { mood: 'celebrate', label: 'ดีใจ' },
  { mood: 'worried', label: 'กังวล' },
  { mood: 'sleeping', label: 'หลับ' },
];

/** ข้าวตัง in 3D: a preview you can tap through, and the switch for weaker phones. */
export function MascotSettings() {
  const on = useMascot3DPref();
  const [i, setI] = useState(0);
  const { mood, label } = MOODS[i];

  return (
    <>
      <div className="list-cap">ข้าวตัง</div>
      <Paper className="list">
        <button className="mascot-preview" onClick={() => setI((i + 1) % MOODS.length)}>
          <KhaoTang mood={mood} size={128} live />
          <span className="mascot-preview__text">
            <span className="list__label">{label}</span>
            <span className="list__value">แตะเพื่อเปลี่ยนท่า</span>
          </span>
        </button>
        <button className="list__row" role="switch" aria-checked={on} onClick={() => setMascot3D(!on)}>
          <span className="list__label">ขยับแบบ 3D</span>
          <span />
          <span className={`switch ${on ? 'is-on' : ''}`} aria-hidden />
        </button>
      </Paper>
    </>
  );
}
