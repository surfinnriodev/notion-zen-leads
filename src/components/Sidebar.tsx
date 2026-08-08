import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Home,
  Mail,
  Settings,
  MapPin
} from "lucide-react";
import { VersionBadge } from "./VersionBadge";
import { useRegion, REGION_LABEL, type Region } from "@/contexts/RegionContext";

// Cada região tem seu próprio menu. O Rio mantém as rotas sem prefixo (legadas),
// a Bahia vive sob /bahia — por enquanto só Leads e Configurações.
const NAV: Record<Region, { name: string; href: string; icon: typeof Home }[]> = {
  rio: [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Leads", href: "/leads", icon: Users },
    { name: "Emails", href: "/emails", icon: Mail },
    { name: "Configurações", href: "/configuracoes", icon: Settings },
  ],
  bahia: [
    { name: "Leads", href: "/bahia/leads", icon: Users },
    { name: "Configurações", href: "/bahia/configuracoes", icon: Settings },
  ],
};

export const Sidebar = () => {
  const location = useLocation();
  const region = useRegion();
  const navigation = NAV[region];
  const other: Region = region === "rio" ? "bahia" : "rio";
  const otherHref = other === "rio" ? "/" : "/bahia/leads";

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-[100]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-border">
          <LayoutDashboard className="w-6 h-6 text-primary mr-3" />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-foreground leading-tight">Surf Inn</h1>
            <span className="text-xs text-muted-foreground">{REGION_LABEL[region]}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Troca de operação */}
        <div className="px-4 pb-2">
          <Link
            to={otherHref}
            className="flex items-center px-3 py-2 text-sm rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
          >
            <MapPin className="w-4 h-4 mr-3" />
            Ir para {REGION_LABEL[other]}
          </Link>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <VersionBadge variant="minimal" />
        </div>
      </div>
    </div>
  );
};
