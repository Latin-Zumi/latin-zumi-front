import { useEffect, useState } from 'react';
import { getWalletRates } from '../services/ratesService';
import type { WalletRates } from '../types';

interface WalletRatesState {
  data: WalletRates | null;
  isLoading: boolean;
  hasError: boolean;
}

export function useWalletRates() {
  const [state, setState] = useState<WalletRatesState>({
    data: null,
    isLoading: true,
    hasError: false,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getWalletRates()
      .then((data) => {
        if (active) setState({ data, isLoading: false, hasError: false });
      })
      .catch(() => {
        if (active) setState({ data: null, isLoading: false, hasError: true });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  function reload() {
    setState({ data: null, isLoading: true, hasError: false });
    setAttempt((current) => current + 1);
  }

  return { ...state, reload };
}
