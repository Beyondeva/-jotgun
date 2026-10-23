import { faPaw } from '@fortawesome/free-solid-svg-icons';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { KhaoTang } from '../../mascot/KhaoTang';
import { Icon } from '../Icon';

/** Wait this long before showing anything, so fast loads don't flash the cat. */
const DELAY = 150;

/** ข้าวตัง walking in, leaving paw prints, while a page or its data loads. */
export function PageLoader() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), DELAY);
    return () => clearTimeout(t);
  }, []);

  if (!show) return <div className="page-loader" aria-busy="true" />;

  return (
    <motion.div
      className="page-loader"
      role="status"
      aria-live="polite"
      aria-label="กำลังโหลด"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <KhaoTang mood="happy" size={96} />
      <div className="page-loader__paws" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="page-loader__paw"
            style={{ rotate: i % 2 ? 12 : -12, y: i % 2 ? 6 : 0 }}
            animate={reduce ? { opacity: 0.5 } : { opacity: [0, 1, 1, 0] }}
            transition={reduce ? { duration: 0 } : { duration: 1.6, repeat: Infinity, delay: i * 0.3, times: [0, 0.15, 0.6, 1] }}
          >
            <Icon icon={faPaw} size={14} />
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
