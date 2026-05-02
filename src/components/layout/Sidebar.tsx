"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Database,
  Layers,
  Cpu,
  FolderOpen,
  Download,
  Settings,
  ChevronDown,
  Zap,
} from "lucide-react";
import { useState } from "react";

const navSections = [
  {
    title: "Analytics",
    items: [{ href: "/claude-usage", label: "Overview", icon: BarChart3 }],
  },
  {
    title: "Sessions",
    items: [{ href: "/claude-usage/sessions", label: "All Sessions", icon: Database }],
  },
  {
    title: "Tools",
    items: [{ href: "/claude-usage/tools", label: "Tool Usage", icon: Layers }],
  },
  {
    title: "Projects",
    items: [{ href: "/claude-usage/projects", label: "Project Stats", icon: FolderOpen }],
  },
  {
    title: "Models",
    items: [{ href: "/claude-usage/models", label: "Model Usage", icon: Cpu }],
  },
  {
    title: "Export",
    items: [{ href: "/claude-usage/export", label: "Export Data", icon: Download }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["Analytics", "Sessions", "Tools", "Models", "Projects", "Export"])
  );

  const toggleSection = (title: string) => {
    const next = new Set(openSections);
    if (next.has(title)) {
      next.delete(title);
    } else {
      next.add(title);
    }
    setOpenSections(next);
  };

  return (
    <aside className="flex h-screen w-64 flex-col bg-[#0a0a0a] border-r border-[#2a2a2a]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-[#2a2a2a] px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faff69]">
          <Zap className="h-4 w-4 text-[#0a0a0a]" />
        </div>
        <div>
          <span className="font-sans text-sm font-semibold tracking-tight text-[#ffffff]">
            Claude Usage
          </span>
          <span className="block text-[10px] font-medium uppercase tracking-widest text-[#888888]">
            Analytics
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            <button
              onClick={() => toggleSection(section.title)}
              className="flex w-full items-center justify-between px-6 py-2 text-[11px] font-semibold uppercase tracking-widest text-[#5a5a5a] hover:text-[#888888] transition-colors"
            >
              {section.title}
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  openSections.has(section.title) ? "rotate-0" : "-rotate-90"
                )}
              />
            </button>
            {openSections.has(section.title) && (
              <ul className="px-3 space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium tracking-wide transition-all duration-200",
                          isActive
                            ? "bg-[#faff69] text-[#0a0a0a] font-semibold"
                            : "text-[#888888] hover:bg-[#1a1a1a] hover:text-[#ffffff]"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#2a2a2a] p-4">
        <Link
          href="/claude-usage/settings"
          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium tracking-wide text-[#888888] hover:bg-[#1a1a1a] hover:text-[#ffffff] transition-all"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}