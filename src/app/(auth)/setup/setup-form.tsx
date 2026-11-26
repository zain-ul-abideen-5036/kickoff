'use client';

import { useActionState } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { setUp, type AuthState } from '../actions';

export function SetupForm({ needsCode }: { needsCode: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(setUp, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="col" style={{ gap: 18 }} noValidate>
      {state.error && (
        <div className="note note-err" role="alert">
          <Icon name="alert" />
          <span>{state.error}</span>
        </div>
      )}
      {Object.keys(e).length > 0 && (
        <div className="note note-err" role="alert">
          <Icon name="alert" />
          <span>
            {Object.keys(e).length} {Object.keys(e).length === 1 ? 'answer needs' : 'answers need'} a quick
            look.
          </span>
        </div>
      )}
      <TextField
        label="Studio name"
        name="studio"
        autoComplete="organization"
        defaultValue={state.values?.studio ?? 'Studio North'}
        error={e.studio}
        hint="Clients see this on the intake, shared briefs and PDFs."
      />
      <TextField
        label="Your name"
        name="name"
        autoComplete="name"
        defaultValue={state.values?.name}
        error={e.name}
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        defaultValue={state.values?.email}
        error={e.email}
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        error={e.password}
        hint="At least 10 characters. A short phrase works well."
      />
      {needsCode && (
        <TextField
          label="Setup code"
          name="code"
          autoComplete="off"
          error={e.code}
          hint="The SETUP_CODE you set when deploying. It stops anyone else claiming this studio."
        />
      )}
      <Button type="submit" variant="primary" size="lg" loading={pending} iconAfter="arrowRight">
        Create studio
      </Button>
    </form>
  );
}
