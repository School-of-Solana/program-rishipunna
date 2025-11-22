'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { useCounterProgram } from './counter-data-access'

import { WordleGame } from './wordle'

export default function CounterFeature() {
  const { publicKey } = useWallet()

  return publicKey ? (
    <div className="grid items-center justify-center gap-2  ">
      <WordleGame />
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
