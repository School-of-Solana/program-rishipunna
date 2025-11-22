// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import WordleIDL from './idl/wordle_dapp.json'
import type { WordleDapp } from './types/wordle_dapp.ts'

// Re-export the generated IDL and type
export { WordleDapp, WordleIDL }

// The programId is imported from the program IDL.
export const COUNTER_PROGRAM_ID = new PublicKey(WordleIDL.address)

// This is a helper function to get the Counter Anchor program.
export function getCounterProgram(provider: AnchorProvider, address?: PublicKey): Program<WordleDapp> {
  return new Program(
    { ...WordleIDL, address: address ? address.toBase58() : WordleIDL.address } as WordleDapp,
    provider,
  )
}

// This is a helper function to get the program ID for the Counter program depending on the cluster.
export function getCounterProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Counter program on devnet and testnet.
      return new PublicKey('8v1HDhJ5EmQRUWtr8tyoVE9qmXK1eLpB38CBj5HfZG2U')
    case 'mainnet-beta':
    default:
      return COUNTER_PROGRAM_ID
  }
}
