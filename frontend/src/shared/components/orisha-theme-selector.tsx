import { Sun, Monitor, Droplets, Mountain, Zap, Waves } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useTheme } from "@/shared/contexts/theme-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui";

export function OrishaThemeSelector() {
    const { orishaTheme, setOrishaTheme } = useTheme();

    const orishaThemes = [
        { id: 'all', name: 'Default', icon: Monitor, description: 'Standard theme' },
        { id: 'osun', name: 'Osun', icon: Sun, description: 'Golden yellow - River goddess' },
        { id: 'ogun', name: 'Ogun', icon: Mountain, description: 'Iron and strength' },
        { id: 'shango', name: 'Shango', icon: Zap, description: 'Thunder and fire' },
        { id: 'yemoja', name: 'Yemoja', icon: Waves, description: 'Ocean and motherhood' },
        { id: 'oshun', name: 'Oshun', icon: Droplets, description: 'River and fertility' },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    title={`Current: ${orishaTheme}. Click to switch.`}
                >
                    {orishaTheme === 'all' && <Monitor className="h-[1.2rem] w-[1.2rem]" />}
                    {orishaTheme === 'osun' && <Sun className="h-[1.2rem] w-[1.2rem]" />}
                    {orishaTheme === 'ogun' && <Mountain className="h-[1.2rem] w-[1.2rem]" />}
                    {orishaTheme === 'shango' && <Zap className="h-[1.2rem] w-[1.2rem]" />}
                    {orishaTheme === 'yemoja' && <Waves className="h-[1.2rem] w-[1.2rem]" />}
                    {orishaTheme === 'oshun' && <Droplets className="h-[1.2rem] w-[1.2rem]" />}
                    <span className="sr-only">Select Orisha theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <div className="p-1">
                    <p className="px-2 py-1 text-xs font-bold text-muted-foreground">Orisha Themes</p>
                    {orishaThemes.map((theme) => (
                        <DropdownMenuItem
                            key={theme.id}
                            onClick={() => setOrishaTheme(theme.id as any)}
                            className={`${orishaTheme === theme.id ? 'bg-accent' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <theme.icon className="h-4 w-4" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{theme.name}</span>
                                    <span className="text-xs text-muted-foreground">{theme.description}</span>
                                </div>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}