import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// Theme comes from the board (light/dark) instead of next-themes.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          // The app's own tokens (src/styles/tokens.css), not shadcn's --popover/--border.
          "--normal-bg": "var(--raised)",
          "--normal-text": "var(--text)",
          "--normal-border": "var(--line-strong)",
          "--border-radius": "12px",
          fontFamily: "var(--font)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
