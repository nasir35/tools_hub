import * as LucideIcons from "lucide-react";

interface DynamicIconProps {
  name: string;
  className?: string;
}

export function DynamicIcon({ name, className }: DynamicIconProps) {
  // @ts-ignore
  const Icon = LucideIcons[name];

  if (!Icon) {
    // Fallback icon if the name doesn't match
    const FallbackIcon = LucideIcons.Wrench;
    return <FallbackIcon className={className} />;
  }

  return <Icon className={className} />;
}
