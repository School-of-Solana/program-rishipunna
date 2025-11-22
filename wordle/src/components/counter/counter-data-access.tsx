// 'use client'

import { useEffect, useState } from 'react'
import { getCounterProgram, getCounterProgramId } from '@/anchor/counter-exports'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import { web3 } from '@coral-xyz/anchor'

export interface GameData {
  player: PublicKey
  solution: string
  tries: number
  isSolved: boolean
  correctCharPos: boolean[][]
  correctCharNotPos: boolean[][]
  guesses: string[]
}

export function useCounterProgram() {
  const { publicKey } = useWallet()
  const queryClient = useQueryClient()

  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getCounterProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getCounterProgram(provider, programId), [provider, programId])
  const wordle_seed = 'WORDLE_DAPP'
  const utils = useQueryClient()

  // -------------------------
  // Fetch the game PDA
  // -------------------------

  const defaultGameData: GameData = {
    player: Keypair.generate().publicKey,
    solution: '',
    tries: 0,
    isSolved: false,
    correctCharPos: Array(6).fill(Array(5).fill(false)),
    correctCharNotPos: Array(6).fill(Array(5).fill(false)),
    guesses: Array(6).fill(''),
  }

  const gameQuery = useQuery<GameData>({
    queryKey: ['game', publicKey?.toBase58(), programId.toBase58()],
    queryFn: async () => {
      if (!publicKey) throw new Error('Wallet not connected')
      const [gamePda] = PublicKey.findProgramAddressSync([Buffer.from(wordle_seed), publicKey.toBuffer()], programId)
      try {
        return await program.account.newGame.fetch(gamePda)
      } catch (error: any) {
        // If account doesn't exist, return default data
        if (error.message?.includes('Account does not exist') || error.message?.includes('not found')) {
          return defaultGameData
        }
        throw error
      }
    },
    enabled: !!publicKey && !!program,
    refetchOnWindowFocus: false,
    initialData: defaultGameData,
  })

  useEffect(() => {
    gameQuery.refetch()
  }, [publicKey])

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  // -------------------------
  // Initialize game
  // -------------------------
  const initialize = useMutation({
    mutationFn: async () => {
      toast.message('Creating a new game')
      if (!publicKey) throw new Error('Wallet not connected')
      const [gamePda] = PublicKey.findProgramAddressSync([Buffer.from(wordle_seed), publicKey.toBuffer()], programId)
      const accountInfo = await connection.getAccountInfo(gamePda)

      if (!accountInfo) {
        return program.methods.createSeed().accounts({ signer: publicKey }).rpc()
      } else {
        toast.error('Game already exists. Exit it before creating a new one.')
      }
    },
    onSuccess: async (tx) => {
      toast.success('Game created!')
      queryClient.invalidateQueries({ queryKey: ['game', publicKey?.toBase58(), programId.toBase58()] })
    },
    onError: () => toast.error('Failed to create game'),
  })

  // -------------------------
  // Exit / remove game
  // -------------------------
  const exitGameMutation = useMutation({
    mutationFn: async () => {
      toast.message('Exiting the game')
      if (!publicKey) throw new Error('Wallet not connected')
      const [gamePda] = PublicKey.findProgramAddressSync([Buffer.from(wordle_seed), publicKey.toBuffer()], programId)
      const accountInfo = await connection.getAccountInfo(gamePda)
      if (!accountInfo) toast.error('Game does not exist!')
      else {
        return program.methods.removeGame().accounts({ signer: publicKey, game: gamePda }).rpc()
      }
    },
    onSuccess: async () => {
      toast.success('Game exited!')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to exit game'),
  })

  // -------------------------
  // Progress / submit guess
  // -------------------------
  const progressGameMutation = useMutation({
    mutationKey: ['counter', 'progress', { cluster }],
    mutationFn: async (data: { guess: string }) => {
      toast.message('Sending guess...')
      if (!publicKey) throw new Error('Wallet not connected')
      const [gameAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from(wordle_seed), publicKey?.toBuffer()],
        programId,
      )
      const gameAccount = await connection.getAccountInfo(gameAddress)

      if (!gameAccount) {
        toast.error('Game PDA does not exist')
      }

      // Await the transaction
      const tx = await program.methods.progressGame(data.guess).accounts({ signer: publicKey, game: gameAddress }).rpc()

      return tx
    },
    onSuccess: async (tx) => {
      toast.success('Guess sent')
      await utils.invalidateQueries({ queryKey: ['game', publicKey?.toBase58(), programId.toBase58()] })
    },
    onError: (err: any) => {
      // console.error("progressGameMutation error:", err);
      toast.error(err.message || 'Failed to submit guess')
    },
  })

  return {
    program,
    programId,
    publicKey,
    gameQuery,
    initialize,
    exitGameMutation,
    progressGameMutation,
    getProgramAccount,
  }
}
