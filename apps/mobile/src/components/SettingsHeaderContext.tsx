import React, { useEffect } from 'react';

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

  useEffect(() => {
    if (!enabled || !setHeaderState || !title || !onBack) {
      return undefined;
    }

    setHeaderState({ title, onBack });
    return () => setHeaderState(null);
  }, [enabled, onBack, setHeaderState, title]);
}
