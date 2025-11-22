'use client'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { ClusterUiSelect } from './cluster/cluster-ui'
import { WalletButton } from '@/components/solana/solana-provider'

export function AppHeader({ links = [] }: { links: { label: string; path: string }[] }) {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)

  function isActive(path: string) {
    return path === '/' ? pathname === '/' : pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-4">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-16 items-center justify-between px-6 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-lg shadow-lg">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Link
              className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              href="/"
            >
              Wordle
            </Link>

            {/* Desktop Navigation */}
            {links.length > 0 && (
              <nav className="hidden md:flex items-center">
                <ul className="flex items-center gap-1">
                  {links.map(({ label, path }) => (
                    <li key={path}>
                      <Link
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive(path)
                            ? 'text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                        }`}
                        href={path}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <WalletButton />
              <ClusterUiSelect />
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Toggle menu"
            >
              {showMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMenu && (
        <div className="md:hidden mt-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-lg shadow-lg">
          <div className="px-6 py-4 space-y-4">
            {/* Mobile Navigation Links */}
            {links.length > 0 && (
              <nav>
                <ul className="space-y-1">
                  {links.map(({ label, path }) => (
                    <li key={path}>
                      <Link
                        className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                          isActive(path)
                            ? 'text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                        }`}
                        href={path}
                        onClick={() => setShowMenu(false)}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {/* Mobile Actions */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Wallet</span>
                <WalletButton />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Cluster</span>
                <ClusterUiSelect />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
