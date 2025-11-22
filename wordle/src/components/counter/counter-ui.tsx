'use client'

import { useCounterProgram } from './counter-data-access'
import { Button } from '@/components/ui/button'
import { useWallet } from '@solana/wallet-adapter-react'

export function CounterCreate() {
  const { initialize, exitGameMutation } = useCounterProgram()
  const { publicKey } = useWallet()

  return (
    <div className="flex justify-center gap-2">
      <Button
        onClick={async () => {
          await exitGameMutation.mutateAsync()
          await initialize.mutateAsync()
        }}
        disabled={initialize.isPending || exitGameMutation.isPending}
      >
        Create/Reset Board {(initialize.isPending || exitGameMutation.isPending) && '...'}
      </Button>
    </div>
  )
}
