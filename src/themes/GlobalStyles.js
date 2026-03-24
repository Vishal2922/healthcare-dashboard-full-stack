import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  :root {
    /* 1. Core Color Tokens */
    --color-primary: ${({ theme }) => theme.colors.primary};
    --color-background: ${({ theme }) => theme.colors.background};
    --color-surface: ${({ theme }) => theme.colors.surface};
    --color-text-primary: ${({ theme }) => theme.colors.text};
    --color-text-secondary: ${({ theme }) => theme.colors.textSecondary};
    --color-border: ${({ theme }) => theme.colors.border};
    
    /* 2. State Colors */
    --color-error: ${({ theme }) => theme.colors.error || '#dc2626'};
    --color-success: ${({ theme }) => theme.colors.success || '#16a34a'};
  }

  body {
    background-color: var(--color-background);
    color: var(--color-text-primary);
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    transition: background-color 0.25s linear, color 0.25s linear;
    margin: 0;
    padding: 0;
  }
  
  a {
    color: var(--color-primary);
    text-decoration: none;
  }
  
  * {
    box-sizing: border-box;
  }
`;