import { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabase-client';

export interface FarmerProfile {
  id: string;
  full_name: string;
  email: string;
  address: string;
}

interface State {
  profile: FarmerProfile | null;
  loading: boolean;
  error: string | null;
}

export function useFarmerProfile(): State {
  const [state, setState] = useState<State>({
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (cancelled) return;

      if (userError || !userData.user) {
        setState({ profile: null, loading: false, error: 'Not signed in.' });
        return;
      }

      const { data, error } = await supabase
        .from('farmers')
        .select('id, full_name, email, address')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setState({
          profile: null,
          loading: false,
          error: error?.message ?? 'Farmer profile not found.',
        });
        return;
      }

      setState({ profile: data, loading: false, error: null });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}