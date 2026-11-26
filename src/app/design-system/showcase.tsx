'use client';

import { useState } from 'react';
import { ChipGroup, RangePair, Segmented, Switch } from '@/components/ui/choices';
import { TextField } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { BUDGETS, GOALS } from '@/lib/domain/catalog';

/** Interactive half of the design system page. */
export function Showcase() {
  const [goals, setGoals] = useState<string[]>(['bookings']);
  const [budget, setBudget] = useState<string>('b2');
  const [ages, setAges] = useState<[number, number]>([28, 55]);
  const [vat, setVat] = useState(true);
  const [email, setEmail] = useState('daniel@');
  const toast = useToast();
  return (
    <div className="col" style={{ gap: 24, maxWidth: 640 }}>
      <TextField label="Business name" placeholder="e.g. Ember & Oak" />
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={
          email.includes('.')
            ? undefined
            : 'That email looks incomplete. Check the ending, for example .co.uk.'
        }
      />
      <ChipGroup label="Goals" options={GOALS} value={goals} onChange={setGoals} max={3} />
      <Segmented
        label="Budget"
        options={BUDGETS.map((b) => ({ id: b.id, label: b.short }))}
        value={budget}
        onChange={setBudget}
        mono
      />
      <RangePair
        label="Typical age range"
        min={18}
        max={75}
        low={ages[0]}
        high={ages[1]}
        onChange={(l, h) => setAges([l, h])}
      />
      <Switch label="Add VAT (20%)" checked={vat} onChange={setVat} />
      <div>
        <Button onClick={() => toast.show('Share link copied. It expires in 30 days.')}>Show a toast</Button>
      </div>
    </div>
  );
}
