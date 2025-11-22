'use client'

import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useConnection } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useCounterProgram } from './counter-data-access'
import { ellipsify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { useWallet } from '@solana/wallet-adapter-react'

export function CounterCreate() {
  const { initialize, exitGameMutation } = useCounterProgram()
  const { publicKey } = useWallet()
  
  return (
    <div className='flex justify-center gap-2 w-auto'>
      <Button onClick={async () => {
        await exitGameMutation.mutateAsync(publicKey);
        await initialize.mutateAsync(publicKey);
        }} disabled={initialize.isPending || exitGameMutation.isPending}>
        Create/Reset Board {(initialize.isPending || exitGameMutation.isPending) && '...'}
      </Button>
    </div>
  )
}