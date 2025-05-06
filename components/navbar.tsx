"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, LayoutDashboard, Wind, Database, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Turbine Monitoring",
      icon: Wind,
      href: "/monitoring",
      children: [],
    },
    {
      name: "Project Management",
      icon: Building2,
      children: [
        {
          name: "Wind Farm Project Dashboard",
          href: "/projects/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: "Project Management",
          href: "/projects",
          icon: Building2,
        },
      ],
    },
    {
      name: "Basic Data Settings",
      icon: Database,
      children: [
        {
          name: "Turbine Management",
          href: "/turbines",
          icon: Wind,
        },
      ],
    },
  ]

  // Check if current path matches a navigation item or its children
  const isActive = (item: (typeof navItems)[0]) => {
    if (item.href && pathname === item.href) return true
    if (item.children && item.children.some((child) => child.href === pathname)) return true
    return false
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
      <div className="container flex h-14 items-center justify-start">
        <nav className="flex items-center space-x-4 lg:space-x-6 pl-4">
          <Link href="/" className="flex items-center space-x-2 mr-4">
            <Wind className="h-6 w-6" />
          </Link>
          {navItems.map((item, index) =>
            item.children.length > 0 ? (
              <DropdownMenu key={index}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center text-sm font-medium transition-colors hover:text-primary-foreground/80",
                      isActive(item) ? "text-primary-foreground" : "text-primary-foreground/70",
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {item.children.map((child, childIndex) => (
                    <DropdownMenuItem key={childIndex} asChild>
                      <Link
                        href={child.href}
                        className={cn("flex items-center w-full", pathname === child.href ? "font-medium" : "")}
                      >
                        <child.icon className="h-4 w-4 mr-2" />
                        {child.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
               <Link
                key={index}
                href={item.href || "#"}
                 className={cn(
                   "flex items-center text-sm font-medium transition-colors hover:text-primary-foreground/80",
                   pathname === item.href ? "text-primary-foreground" : "text-primary-foreground/70",
                 )}
               >
                 <item.icon className="h-4 w-4 mr-2" />
                 {item.name}
               </Link>
            ),
          )}
          <Link
            href="/profile"
            className="ml-4 text-sm font-medium text-primary-foreground/70 transition-colors hover:text-primary-foreground/80"
          >
            User Settings
          </Link>
        </nav>
      </div>
    </header>
  )
}
