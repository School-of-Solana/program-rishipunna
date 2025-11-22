'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useCounterProgram } from './counter-data-access'
import { CounterCreate } from './counter-ui'
import { AppHero } from '../app-hero'
import { ellipsify } from '@/lib/utils'
import { WordleGame } from './wordle'

export default function CounterFeature() {
  const { publicKey } = useWallet()
  const { programId } = useCounterProgram()

  return publicKey ? (
    <div className='grid items-center justify-center gap-2  '>
      {/* <AppHero
        title="WORDLE"
      >
        <p className="mb-6">
          <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
        </p>
      </AppHero> */}
      {/* <CounterCreate /> */}
      
      <WordleGame/>
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}
