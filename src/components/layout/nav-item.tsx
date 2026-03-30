'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItemProps {
  href: string
  icon: LucideIcon
  label: string
}

export function NavItem({ href, icon: Icon, label }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition-all duration-150',
        isActive
          ? 'bg-blue-50 font-semibold text-blue-700'
          : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      )}
    >
      <Icon
        className={cn(
          'h-[17px] w-[17px] shrink-0 transition-colors',
          isActive ? 'text-blue-600' : 'text-slate-400'
        )}
      />
      {label}
    </Link>
  )
}
