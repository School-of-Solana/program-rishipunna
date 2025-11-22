'use client'

import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useCluster } from '../cluster/cluster-data-access'
import { AccountButtons, AccountTransactions } from './account-ui'
import { ellipsify } from '@/lib/utils'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Wallet, History, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useGetBalance, useGetSignatures } from './account-data-access'

export default function AccountDetailFeature() {
  const params = useParams()
  const address = useMemo(() => {
    if (!params.address) {
      return null
    }
    try {
      return new PublicKey(params.address)
    } catch (e) {
      toast(`invalid public key: ${e}`)
      return null
    }
  }, [params])

  // All hooks must be called unconditionally before any early returns
  const { getExplorerUrl } = useCluster()
  const balanceQuery = useGetBalance({ address })
  const transactionsQuery = useGetSignatures({ address })

  if (!address) {
    return <div>Error loading account</div>
  }

  const balance = balanceQuery.data ? Math.round((balanceQuery.data / LAMPORTS_PER_SOL) * 100000) / 100000 : 0

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address.toString())
    toast.success('Address copied to clipboard')
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                  <Wallet className="h-6 w-6 text-primary" strokeWidth={2.5} />
                </div>
                <div>
                  <CardTitle className="text-xl">Account Details</CardTitle>
                  <CardDescription>Wallet information and balance</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Balance</span>
                <span className="text-2xl font-bold">{balance} SOL</span>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Address</span>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <code className="flex-1 text-sm font-mono break-all">{ellipsify(address.toString(), 16)}</code>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={copyToClipboard}
                      title="Copy address"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <a href={getExplorerUrl(`account/${address}`)} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="View on explorer">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <AccountButtons address={address} />
            </div>
          </CardContent>
        </Card>

        {/* Transactions Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                <History className="h-6 w-6 text-primary" strokeWidth={2.5} />
              </div>
              <div>
                <CardTitle className="text-xl">Transactions</CardTitle>
                <CardDescription>Recent transaction history</CardDescription>
              </div>
            </div>
            <CardAction>
              {transactionsQuery.isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Button variant="outline" size="icon" onClick={() => transactionsQuery.refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </CardAction>
          </CardHeader>
          <CardContent>
            <AccountTransactions address={address} showTitle={false} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
