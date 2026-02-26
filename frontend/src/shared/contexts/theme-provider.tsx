import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system"
type OrishaTheme = "osun" | "ogun" | "shango" | "yemoja" | "oshun" | "all";

interface ThemeProviderProps {
    children: React.ReactNode
    defaultTheme?: Theme
    defaultOrishaTheme?: OrishaTheme;
    storageKey?: string
    orishaStorageKey?: string;
}

interface ThemeProviderState {
    theme: Theme
    orishaTheme: OrishaTheme;
    setTheme: (theme: Theme) => void
    setOrishaTheme: (orishaTheme: OrishaTheme) => void;
}

const initialState: ThemeProviderState = {
    theme: "system",
    orishaTheme: "all",
    setTheme: () => null,
    setOrishaTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
    children,
    defaultTheme = "system",
    defaultOrishaTheme = "all",
    storageKey = "vite-ui-theme",
    orishaStorageKey = "orisha-theme",
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )
    
    const [orishaTheme, setOrishaTheme] = useState<OrishaTheme>(
        () => (localStorage.getItem(orishaStorageKey) as OrishaTheme) || defaultOrishaTheme
    )

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark", "osun", "ogun", "shango", "yemoja", "oshun")

        // Apply light/dark theme
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"

            root.classList.add(systemTheme)
        } else {
            root.classList.add(theme)
        }
        
        // Apply orisha theme
        if (orishaTheme !== "all") {
            root.classList.add(orishaTheme);
        }
    }, [theme, orishaTheme])

    const value: ThemeProviderState = {
        theme,
        orishaTheme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
        setOrishaTheme: (orishaTheme: OrishaTheme) => {
            localStorage.setItem(orishaStorageKey, orishaTheme);
            setOrishaTheme(orishaTheme);
        },
    }

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}