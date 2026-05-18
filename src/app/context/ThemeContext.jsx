'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
    theme: 'light',
    toggleTheme: () => { },
    setTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Lazy initializer: reads localStorage synchronously on first client render
    // so that theme state is immediately correct — no useEffect delay, no flash.
    const [theme, setThemeState] = useState(() => {
        if (typeof window === 'undefined') return 'light';
        return localStorage.getItem('melachow-theme') || 'light';
    });

    // Sync the <html> class on mount in case the blocking script missed anything
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setThemeState(newTheme);
        localStorage.setItem('melachow-theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem('melachow-theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

