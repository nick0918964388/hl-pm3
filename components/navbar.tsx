"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, LayoutDashboard, Settings, Wind } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "儀表板",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "專案管理",
      href: "/projects",
      icon: Building2,
    },
    {
      name: "風場監控",
      href: "/monitoring",
      icon: Wind,
    },
    {
      name: "系統設定",
      href: "/settings",
      icon: Settings,
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Wind className="h-6 w-6" />
          </Link>
        </div>
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center text-sm font-medium transition-colors hover:text-primary-foreground/80",
                pathname === item.href ? "text-primary-foreground" : "text-primary-foreground/70",
              )}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <Link
            href="/profile"
            className="text-sm font-medium text-primary-foreground/70 transition-colors hover:text-primary-foreground/80"
          >
            使用者設定
          </Link>
        </div>
      </div>
    </header>
  )
}
