import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface ButtonColorfulProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label?: string;
    type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
}

export function ButtonColorful({
    className,
    label = "Explore Components",
    type = "button",
    ...props
}: ButtonColorfulProps) {
    return (
        <Button
            type={type}
            className={cn(
                "relative h-10 px-4 overflow-hidden",
                "bg-zinc-900 dark:bg-zinc-100",
                "group",
                className
            )}
            {...props}
        >
            {/* Gradient background effect */}
            <div
                className={cn(
                    "absolute inset-0",
                    "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
                    "opacity-40 group-hover:opacity-80",
                    "transition-opacity duration-300"
                )}
            />

            {/* Content */}
            <div className="relative flex items-center justify-center gap-2">
                <span className="text-white dark:text-zinc-900">{label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-white/90 dark:text-zinc-900/90" />
            </div>
        </Button>
    );
} 