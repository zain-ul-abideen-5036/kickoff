'use client';

import { useActionState } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { signIn, type AuthState } from '../actions';

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <form action={action} className="col" style={{ gap: 18 }} noValidate>
      {state.error && (
        <div className="note note-err" role="alert">
          <Icon name="alert" />
          <span>{state.error}</span>
        </div>
      )}
      <input type="hidden" name="next" value={next ?? ''} />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        required
        defaultValue={state.values?.email}
      />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
      <Button type="submit" variant="primary" size="lg" loading={pending} iconAfter="arrowRight">
        Sign in
      </Button>
    </form>
  );
}
