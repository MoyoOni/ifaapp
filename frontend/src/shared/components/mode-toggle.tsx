import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { useTheme } from "@/shared/contexts/theme-provider"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    const cycleTheme = () => {
        if (theme === "light") setTheme("dark")
        else if (theme === "dark") setTheme("system")
        else setTheme("light")
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={cycleTheme}
            title={`Current: ${theme}. Click to switch.`}
        >
            {theme === "light" && <Sun className="h-[1.2rem] w-[1.2rem]" />}
            {theme === "dark" && <Moon className="h-[1.2rem] w-[1.2rem]" />}
            {theme === "system" && <Monitor className="h-[1.2rem] w-[1.2rem]" />}
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
