import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { GlobalStyles } from '../themes/GlobalStyles';
import { lightTheme } from '../themes/lightTheme';
import { darkTheme } from '../themes/darkTheme';
import { warmTheme } from '../themes/warmTheme';
import axiosClient from '../services/axiosClient';

const ThemeContext = createContext();

const THEMES = {
  light: lightTheme,
  dark: darkTheme,
  warm: warmTheme,
};

const THEME_STORAGE_KEY = 'clinic_theme_mode';
const COLOR_STORAGE_KEY = 'clinic_brand_color';

export const AppThemeProvider = ({ children }) => {
  // Theme mode: user preference stored in localStorage
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || 'warm';
    } catch {
      return 'warm';
    }
  });

  // Brand color: tenant setting from backend (admin-managed), cached locally
  const [primaryColor, setPrimaryColor] = useState(() => {
    try {
      return localStorage.getItem(COLOR_STORAGE_KEY) || '#20b486';
    } catch {
      return '#20b486';
    }
  });
  const [loading, setLoading] = useState(true);

  // Load brand color from API on mount
  useEffect(() => {
    const fetchBrandColor = async () => {
      try {
        const response = await axiosClient.get('/api/settings/theme');
        if (response.data?.data) {
          const { primaryColor: color } = response.data.data;
          if (color) {
            setPrimaryColor(color);
            try { localStorage.setItem(COLOR_STORAGE_KEY, color); } catch {}
          }
        }
      } catch (error) {
        console.error('Failed to load brand color:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBrandColor();
  }, []);

  // Theme mode toggle — local preference (all staff)
  const changeThemeMode = useCallback((mode) => {
    setThemeMode(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // localStorage not available
    }
  }, []);

  // Brand color update — admin only, saved to backend
  const changeBrandColor = useCallback(async (color) => {
    setPrimaryColor(color);
    try { localStorage.setItem(COLOR_STORAGE_KEY, color); } catch {}
    try {
      await axiosClient.post('/api/settings/theme', { primaryColor: color });
    } catch (error) {
      console.error('Failed to save brand color:', error);
    }
  }, []);

  // Inject admin-set brand color dynamically
  const activeTheme = useMemo(() => {
    const currentThemeObj = THEMES[themeMode] || THEMES.warm;
    return {
      ...currentThemeObj,
      colors: {
        ...currentThemeObj.colors,
        primary: primaryColor,
      }
    };
  }, [themeMode, primaryColor]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    themeMode,
    primaryColor,
    changeThemeMode,
    changeBrandColor,
    activeTheme
  }), [themeMode, primaryColor, changeThemeMode, changeBrandColor, activeTheme]);

  if (loading) return null;

  return (
    <ThemeContext.Provider value={contextValue}>
      <StyledThemeProvider theme={activeTheme}>
        <ConfigProvider
          theme={{
            algorithm: themeMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
            token: {
              colorPrimary: activeTheme.colors.primary,
              colorBgBase: activeTheme.colors.background,
              colorBgContainer: activeTheme.colors.surface,
              colorBgElevated: activeTheme.colors.surface,
              colorTextBase: activeTheme.colors.text,
              colorBorder: activeTheme.colors.border,
              colorLink: activeTheme.colors.primary,
              colorLinkHover: activeTheme.colors.primary,
              colorInfo: activeTheme.colors.primary,
            },
            components: {
              Button: {
                colorPrimary: activeTheme.colors.primary,
                colorPrimaryHover: activeTheme.colors.primary,
                colorPrimaryActive: activeTheme.colors.primary,
                colorLink: activeTheme.colors.primary,
                colorLinkHover: activeTheme.colors.primary,
                colorLinkActive: activeTheme.colors.primary,
                colorText: activeTheme.colors.primary,
                defaultColor: activeTheme.colors.primary,
                defaultBorderColor: activeTheme.colors.primary,
              }
            }
          }}
        >
          <GlobalStyles />
          {children}
        </ConfigProvider>
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);