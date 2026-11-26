import type { Priority, Status } from '@/lib/domain/brief';
import { Icon, type IconName } from '../icons';

const STATUS: Record<Status, { cls: string; icon: IconName }> = {
  New: { cls: 'st-new', icon: 'statusNew' },
  Reviewed: { cls: 'st-rev', icon: 'statusReviewed' },
  Quoted: { cls: 'st-quo', icon: 'statusQuoted' },
  Won: { cls: 'st-won', icon: 'statusWon' },
  Lost: { cls: 'st-lost', icon: 'statusLost' },
};

/** Status always pairs colour with an icon and a label, never colour alone. */
export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS[status];
  return (
    <span className={`st ${s.cls}`}>
      <Icon name={s.icon} />
      {status}
    </span>
  );
}

/** Must, Should and Could differ by weight and line style, not colour. */
export function PriorityChip({ priority }: { priority: Priority }) {
  return <span className={`prio prio-${priority.toLowerCase()}`}>{priority}</span>;
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="tag">{children}</span>;
}
