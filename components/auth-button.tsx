'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { LogoutButton } from './logout-button';
import type { User } from '@supabase/supabase-js';

export function AuthButton({ user }: { user: User | null }) {
  return user ? (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline">
        {user.email}
      </span>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={'outline'}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}

