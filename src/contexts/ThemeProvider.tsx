import { createContext, useContext, ReactNode } from 'react';
import { AppTheme } from '@utils/config.js';

interface ThemeContextType {
  theme: AppTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  theme: AppTheme;
}

export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
