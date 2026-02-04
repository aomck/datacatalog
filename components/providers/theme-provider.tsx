'use client';

import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ReactNode } from 'react';

const theme = createTheme({
  typography: {
    fontFamily: 'var(--font-kanit), ui-sans-serif, system-ui, sans-serif',
  },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
}
