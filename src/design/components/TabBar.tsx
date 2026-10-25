import { faChartColumn, faGear, faHouse, faInbox, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useDecor } from '../decor';
import { Icon, type IconDefinition } from '../Icon';

export type TabKey = 'home' | 'inbox' | 'summary' | 'settings';

const TABS: { key: TabKey; label: string; icon: IconDefinition }[] = [
  { key: 'home', label: 'หน้าแรก', icon: faHouse },
  { key: 'inbox', label: 'รอจด', icon: faInbox },
  { key: 'summary', label: 'สรุป', icon: faChartColumn },
  { key: 'settings', label: 'ตั้งค่า', icon: faGear },
];

interface Props {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  onAdd: () => void;
  inboxCount?: number;
}

/**
 * Icon-only tabs; labels stay for screen readers. A decorated theme swaps in its
 * drawn icons and shows the labels under them (drawings alone are harder to read).
 * From 720px wide the same bar becomes a rail down the left, labels shown (responsive.css).
 */
export function TabBar({ active, onChange, onAdd, inboxCount = 0 }: Props) {
  const decor = useDecor();
  const drawn = decor && decor !== 'loading' ? decor.tabIcons : undefined;
  const AddIcon = drawn?.add;

  const renderTab = (t: (typeof TABS)[number]) => {
    const isActive = t.key === active;
    const Drawn = drawn?.[t.key];
    return (
      <button
        key={t.key}
        className={`tab ${isActive ? 'is-active' : ''}`}
        onClick={() => onChange(t.key)}
        aria-label={t.label}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className="tab__icon">
          {Drawn ? <Drawn active={isActive} /> : <Icon icon={t.icon} size={20} />}
          {t.key === 'inbox' && inboxCount > 0 && <span className="tab__badge num">{inboxCount > 99 ? '99+' : inboxCount}</span>}
        </span>
        {/* plain phone bars hide the label (CSS); drawn bars and the wide-screen rail show it */}
        <span className="tab__label">{t.label}</span>
        {!drawn && isActive && <span className="tab__dot" />}
      </button>
    );
  };

  return (
    <nav className={`tabbar ${drawn ? 'tabbar--drawn' : ''}`} aria-label="เมนูหลัก">
      {TABS.slice(0, 2).map(renderTab)}
      <button type="button" className={`tabbar__add ${AddIcon ? 'tabbar__add--drawn' : ''}`} onClick={onAdd} aria-label="จดรายการใหม่">
        {AddIcon ? <AddIcon active={false} /> : <Icon icon={faPlus} size={20} />}
      </button>
      {TABS.slice(2).map(renderTab)}
    </nav>
  );
}
