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

// interface GameData{
//   player: PublicKey;
//   solution: string;
//   tries: number;
//   isSolved: boolean;
//   correctCharPos: boolean[][];
//   correctCharNotPos: boolean[][];
//   guesses: string[];
// }

// import { useMemo } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useConnection, useAnchorProvider, useWallet } from "@solana/wallet-adapter-react";
// import { PublicKey, Keypair } from "@solana/web3.js";
// import { toast } from "react-hot-toast";
// import { getCounterProgramId, getCounterProgram } from "../utils/programs";

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
  // const { connection } = useConnection();
  // const provider = useAnchorProvider();
  const { publicKey } = useWallet()
  const queryClient = useQueryClient()

  // const cluster = "devnet"; // or use your cluster hook
  // const wordle_seed = "WORDLE_DAPP";

  // const programId = useMemo(() => getCounterProgramId(cluster), [cluster]);
  // const program = useMemo(() => getCounterProgram(provider, programId), [provider, programId]);

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
      return program.account.newGame.fetch(gamePda)
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
      toast.message('Initializing PDA...')
      if (!publicKey) throw new Error('Wallet not connected')
      const [gamePda] = PublicKey.findProgramAddressSync([Buffer.from(wordle_seed), publicKey.toBuffer()], programId)
      const accountInfo = await connection.getAccountInfo(gamePda)

      if (!accountInfo) {
        return program.methods
          .createSeed()
          .accounts({ signer: publicKey, game: gamePda, system_program: web3.SystemProgram.programId })
          .rpc()
      } else {
        toast.error('PDA already exists. Delete it before recreating it.')
      }
    },
    onSuccess: async (tx) => {
      toast.success('Game initialized!')
      queryClient.invalidateQueries(['game', publicKey?.toBase58(), programId.toBase58()])
    },
    onError: () => toast.error('Failed to initialize game'),
  })

  // -------------------------
  // Exit / remove game
  // -------------------------
  const exitGameMutation = useMutation({
    mutationFn: async () => {
      toast.message('Removing PDA...')
      if (!publicKey) throw new Error('Wallet not connected')
      const [gamePda] = PublicKey.findProgramAddressSync([Buffer.from(wordle_seed), publicKey.toBuffer()], programId)
      const accountInfo = await connection.getAccountInfo(gamePda)
      if (!accountInfo) toast.error('Game does not exist!')
      return program.methods
        .removeGame()
        .accounts({ signer: publicKey, game: gamePda, system_program: web3.SystemProgram.programId })
        .rpc()
    },
    onSuccess: async () => {
      toast.success('Game removed!')
      queryClient.invalidateQueries(['game', publicKey?.toBase58(), programId.toBase58()])
    },
    onError: (err: any) => toast.error(err.message || 'Failed to remove game'),
  })

  // -------------------------
  // Progress / submit guess
  // -------------------------
  const progressGameMutation = useMutation({
    mutationKey: ['counter', 'progress', { cluster }],
    mutationFn: async (data: { guess: string; owner: PublicKey }) => {
      toast.message('Sending guess...')
      const [gameAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from(wordle_seed), data.owner.toBuffer()],
        programId,
      )
      const gameAccount = await connection.getAccountInfo(gameAddress)

      if (!gameAccount) {
        toast.error('Game PDA does not exist')
        // throw new Error("Game PDA does not exist");
      }

      // Await the transaction
      const tx = await program.methods
        .progressGame(data.guess)
        .accounts({ signer: data.owner, game: gameAddress })
        .rpc()

      return tx
    },
    onSuccess: async (tx) => {
      toast.success('Guess sent')
      await utils.invalidateQueries(['game', publicKey?.toBase58(), programId.toBase58()])
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
