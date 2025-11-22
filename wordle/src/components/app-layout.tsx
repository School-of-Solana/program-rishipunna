'use client'

import { Toaster } from './ui/sonner'
import { AppHeader } from '@/components/app-header'
import React from 'react'
import { ClusterChecker } from '@/components/cluster/cluster-ui'
import { AccountChecker } from '@/components/account/account-ui'
import { BGPattern } from '@/components/dots.background'

export function AppLayout({
  children,
  links,
}: {
  children: React.ReactNode
  links: { label: string; path: string }[]
}) {
  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Background pattern - covers entire screen including behind header */}
      <BGPattern variant="dots" className="fixed inset-0 -z-10" />

      <AppHeader links={links} />
      <main className="flex-grow container mx-auto p-4  ">
        <ClusterChecker>
          <AccountChecker />
        </ClusterChecker>
        {children}
      </main>
      <Toaster />
    </div>
  )
}
