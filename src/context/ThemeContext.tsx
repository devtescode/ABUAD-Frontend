
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;

    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    } else {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;

      setTheme(prefersDark ? 'dark' : 'light');
    }

    setMounted(true);
  }, []);

  // Update DOM and localStorage when theme changes
  useEffect(() => {
    if (!mounted) return;

    const htmlElement = document.documentElement;

    htmlElement.style.transition =
      'background-color 0.3s ease-in-out, color 0.3s ease-in-out';

    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);

    const timer = setTimeout(() => {
      htmlElement.style.transition = '';
    }, 300);

    return () => clearTimeout(timer);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

