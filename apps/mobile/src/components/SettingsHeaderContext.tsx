import React, { useEffect, useRef } from 'react';

export interface SettingsHeaderState {
  title: string;
  onBack: () => void;
}

interface SettingsHeaderContextValue {
  setHeaderState: (state: SettingsHeaderState | null) => void;
}

export const SettingsHeaderContext = React.createContext<SettingsHeaderContextValue | null>(null);

export function useSettingsHeader(): SettingsHeaderContextValue | null {
  return React.useContext(SettingsHeaderContext);
}

export function useSettingsHeaderOverride(
  state: SettingsHeaderState | null,
  enabled = true,
): void {
  const settingsHeader = useSettingsHeader();
  const setHeaderState = settingsHeader?.setHeaderState;
  const title = state?.title;
  const onBack = state?.onBack;
  const lastAppliedStateRef = useRef<SettingsHeaderState | null>(null);

  useEffect(() => {
    if (!setHeaderState) {
      return undefined;
    }

    if (!enabled || !title || !onBack) {
      if (lastAppliedStateRef.current !== null) {
        lastAppliedStateRef.current = null;
        setHeaderState(null);
      }
      return undefined;
    }

    const previousState = lastAppliedStateRef.current;
    if (
      previousState?.title === title &&
      previousState?.onBack === onBack
    ) {
      return undefined;
    }

    const nextState = { title, onBack };
    lastAppliedStateRef.current = nextState;
    setHeaderState(nextState);
    return undefined;
  }, [enabled, onBack, setHeaderState, title]);

  useEffect(() => {
    return () => {
      if (lastAppliedStateRef.current !== null && setHeaderState) {
        lastAppliedStateRef.current = null;
        setHeaderState(null);
      }
    };
  }, [setHeaderState]);
}
