import { useEffect, useState } from 'react';
import type { AuthState } from '../cloud/auth';
import type { CloudAuthRepository } from '../cloud/dataAccess';

export interface UseCloudAuthInput {
  enabled: boolean;
  auth: CloudAuthRepository | null;
}

export interface CloudAuthController {
  state: AuthState;
  requestOtp: (email: string, redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useCloudAuth = ({ enabled, auth }: UseCloudAuthInput): CloudAuthController => {
  const [state, setState] = useState<AuthState>(() => enabled ? { status: 'loading' } : { status: 'disabled' });

  useEffect(() => {
    if (!enabled || !auth) {
      setState({ status: 'disabled' });
      return;
    }

    let mounted = true;
    setState({ status: 'loading' });

    auth.getSession()
      .then(nextState => {
        if (mounted) setState(nextState);
      })
      .catch(error => {
        if (!mounted) return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Could not read cloud auth session.'
        });
      });

    const unsubscribe = auth.subscribeToAuthChanges(nextState => {
      if (mounted) setState(nextState);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [auth, enabled]);

  return {
    state,
    requestOtp: (email, redirectTo) => {
      if (!enabled || !auth) return Promise.resolve();
      return auth.requestOtp(email, redirectTo);
    },
    signOut: () => {
      if (!enabled || !auth) return Promise.resolve();
      return auth.signOut();
    }
  };
};

