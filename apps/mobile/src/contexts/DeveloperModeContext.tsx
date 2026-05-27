import { createContext, useContext } from 'react';

interface DeveloperModeContextValue {
  developerNetworks: boolean;
}

const DeveloperModeContext = createContext<DeveloperModeContextValue>({
  developerNetworks: false,
});

export const DeveloperModeProvider = DeveloperModeContext.Provider;

export function useDeveloperMode(): boolean {
  return useContext(DeveloperModeContext).developerNetworks;
}
