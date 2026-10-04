'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { Capacitor, SystemBarType, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

const ThemeContext = createContext({
    theme: 'light',
    toggleTheme: () => { },
    setTheme: () => { },
});

const applyLightTheme = () => {
    if (typeof window === 'undefined') return;

    const color = '#ffffff';
    document.documentElement.style.setProperty('--system-surface', color);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';

    if (!Capacitor.isNativePlatform()) return;

    Promise.all([
        SystemBars.setStyle({ bar: SystemBarType.StatusBar, style: SystemBarsStyle.Light }),
        SystemBars.setStyle({ bar: SystemBarType.NavigationBar, style: SystemBarsStyle.Light }),
        StatusBar.setBackgroundColor({ color }),
    ]).catch((error) => console.warn('[Theme] Could not update native system bars:', error));
};

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    useEffect(() => {
        localStorage.setItem('melachow-theme', 'light');
        applyLightTheme();
    }, []);

    const keepLightTheme = () => applyLightTheme();

    return (
        <ThemeContext.Provider value={{ theme: 'light', toggleTheme: keepLightTheme, setTheme: keepLightTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

