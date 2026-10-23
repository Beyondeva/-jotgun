import { faFileCsv, faFileExport, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';
import { useShell } from '../../app/shell';
import { Button } from '../../design/components/Button';
import { Sheet } from '../../design/components/Sheet';
import { buildBackup, restoreBackup } from '../../db/backup';
import { db } from '../../db/db';
import { fileStamp, toCsv, validateBackup, type Backup } from '../../lib/backup';
import { saveFile } from '../../lib/download';
import { useCategoryOf } from '../categories/store';

/** Back up to JSON, restore from it, or export transactions as CSV. */
export function DataSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useShell();
  const categoryOf = useCategoryOf();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPending(null);
      setError(null);
    }
  }, [open]);

  const exportJson = async () => {
    const backup = await buildBackup();
    await saveFile(JSON.stringify(backup), `${fileStamp('jotgun')}.json`, 'application/json');
  };

  const exportCsv = async () => {
    const txs = await db.transactions.toArray();
    await saveFile(toCsv(txs, (id) => categoryOf(id).name), `${fileStamp('jotgun')}.csv`, 'text/csv');
  };

  const pick = async (file: File) => {
    setError(null);
    try {
      const result = validateBackup(JSON.parse(await file.text()));
      if (result.ok) setPending(result.backup);
      else setError(result.reason);
    } catch {
      setError('อ่านไฟล์ไม่ได้ (ต้องเป็นไฟล์ .json ที่สำรองจากจดกัน)');
    }
  };

  const restore = async () => {
    if (!pending) return;
    await restoreBackup(pending);
    toast(`นำเข้าแล้ว ${pending.transactions.length} รายการ`);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="สำรองและส่งออก">
      <div className="data-sheet">
        <div className="data-sheet__group">
          <Button variant="ink" block icon={faFileExport} onClick={() => void exportJson()}>
            สำรองข้อมูล (JSON)
          </Button>
          <Button variant="quiet" block icon={faFileCsv} onClick={() => void exportCsv()}>
            ส่งออกตาราง (CSV)
          </Button>
          <p className="field__help">ไฟล์สำรองมีทุกอย่างยกเว้นรูปสลิป · เก็บไว้ในแอปไฟล์หรือ iCloud</p>
        </div>

        <div className="data-sheet__group">
          <Button variant="quiet" block icon={faFileImport} onClick={() => fileInput.current?.click()}>
            นำเข้าจากไฟล์สำรอง
          </Button>
          {error && <p className="field__help data-sheet__error">{error}</p>}
          {pending && (
            <div className="data-sheet__confirm">
              <p>
                ไฟล์วันที่ <b>{new Date(pending.exportedAt).toLocaleDateString('th-TH', { dateStyle: 'medium' })}</b> มี{' '}
                <b className="num">{pending.transactions.length}</b> รายการ · ข้อมูลในเครื่องตอนนี้จะถูกแทนที่ทั้งหมด
              </p>
              <Button variant="danger" block onClick={() => void restore()}>
                แทนที่ข้อมูลด้วยไฟล์นี้
              </Button>
            </div>
          )}
        </div>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void pick(f);
        }}
      />
    </Sheet>
  );
}
