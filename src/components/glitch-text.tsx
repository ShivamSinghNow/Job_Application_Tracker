"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
}

export function GlitchText({
  children,
  className,
  as: Component = "span",
}: GlitchTextProps) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <Component
      className={cn("relative inline-block cursor-pointer", className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Base text */}
      <span className={cn(isHovering && "animate-glitch-skew")}>{children}</span>

      {/* Glitch layers - only visible on hover */}
      {isHovering && (
        <>
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 animate-glitch-1 text-neon-cyan"
            style={{
              textShadow: "-2px 0 var(--neon-magenta)",
              clipPath: "inset(0 0 0 0)",
            }}
          >
            {children}
          </span>
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 animate-glitch-2 text-neon-magenta"
            style={{
              textShadow: "2px 0 var(--neon-cyan)",
              clipPath: "inset(0 0 0 0)",
            }}
          >
            {children}
          </span>
        </>
      )}
    </Component>
  );
}

interface GlitchIconProps {
  children: React.ReactNode;
  className?: string;
}

export function GlitchIcon({ children, className }: GlitchIconProps) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className={cn("relative", className, isHovering && "animate-glitch-skew")}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}
      {isHovering && (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 animate-glitch-1 text-neon-cyan opacity-70"
            style={{ filter: "drop-shadow(-2px 0 var(--neon-magenta))" }}
          >
            {children}
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 animate-glitch-2 text-neon-magenta opacity-70"
            style={{ filter: "drop-shadow(2px 0 var(--neon-cyan))" }}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}
