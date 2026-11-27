/**
 * Read-only account summary shown alongside the customer profile form.
 */
import { useId, type ReactNode } from 'react';

import {
  BadgeCheck,
  CheckCircle2,
  GraduationCap,
  Mail,
  Phone,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

import { Badge, Card } from '@/components/ui';

function displayValue(value?: string): string {
  return value?.trim() || 'Not provided';
}

function formatLabel(value?: string): string {
  const text = value?.trim();
  if (!text) return 'Not provided';

  return text
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Icon
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-slate-400 dark:text-ink-500"
      />
      <dt className="w-[92px] shrink-0 text-xs font-medium text-slate-500 dark:text-ink-400">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-right text-sm font-medium text-slate-800 dark:text-ink-100">
        {children}
      </dd>
    </div>
  );
}

export function AccountCard(props: {
  email?: string;
  matricNo?: string;
  phoneNumber?: string;
  gender?: string;
  role?: string;
  status?: string;
}) {
  const { email, matricNo, phoneNumber, gender, role, status } = props;
  const uid = useId();
  const titleId = `${uid}-title`;

  return (
    <Card className="p-5 sm:p-6">
      <section aria-labelledby={titleId}>
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5 dark:border-ink-800">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lavender text-brand-600 ring-1 ring-brand-100 dark:bg-brand-950/70 dark:text-lime-300 dark:ring-brand-900/60"
          >
            <BadgeCheck className="h-4 w-4" />
          </span>
          <h2
            id={titleId}
            className="text-base font-bold tracking-tight text-slate-900 dark:text-ink-50"
          >
            Account details
          </h2>
        </div>

        <dl className="mt-2 divide-y divide-slate-100 dark:divide-ink-800">
          <DetailRow icon={Mail} label="Mail">
            <span className="block truncate" title={displayValue(email)}>
              {displayValue(email)}
            </span>
          </DetailRow>

          <DetailRow icon={GraduationCap} label="Matric number">
            <span className="block truncate" title={displayValue(matricNo)}>
              {displayValue(matricNo)}
            </span>
          </DetailRow>

          <DetailRow icon={Phone} label="Phone">
            <span className="block truncate" title={displayValue(phoneNumber)}>
              {displayValue(phoneNumber)}
            </span>
          </DetailRow>

          <DetailRow icon={UserRound} label="Gender">
            {formatLabel(gender)}
          </DetailRow>

          <DetailRow icon={BadgeCheck} label="Account type">
            <Badge tone="brand" icon={BadgeCheck}>
              {formatLabel(role)}
            </Badge>
          </DetailRow>

          <DetailRow icon={CheckCircle2} label="Status">
            <Badge tone="brand" icon={CheckCircle2}>
              {formatLabel(status)}
            </Badge>
          </DetailRow>
        </dl>

        <p className="mt-3 text-xs leading-5 text-slate-400 dark:text-ink-500">
          These account details are read-only and managed by your institution.
        </p>
      </section>
    </Card>
  );
}
