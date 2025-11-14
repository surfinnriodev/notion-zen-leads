import { useAppVersion } from "@/hooks/useAppVersion";
import { cn } from "@/lib/utils";

interface VersionBadgeProps {
  className?: string;
  variant?: "default" | "minimal";
}

export const VersionBadge = ({ className, variant = "default" }: VersionBadgeProps) => {
  const { versionInfo, isLoading } = useAppVersion();

  if (isLoading || !versionInfo) {
    return null;
  }

  if (variant === "minimal") {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        v.{versionInfo.version} - {versionInfo.date}
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)}>
      <span className="font-medium">v.{versionInfo.version}</span>
      <span>•</span>
      <span>{versionInfo.date}</span>
    </div>
  );
};

