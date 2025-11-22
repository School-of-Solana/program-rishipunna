'use client'

import { useCounterProgram } from './counter-data-access'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useWallet } from '@solana/wallet-adapter-react'
import { RotateCcw, DoorOpen } from 'lucide-react'

export function WordleAction() {
  const { initialize, exitGameMutation, gameQuery } = useCounterProgram()
  const { publicKey } = useWallet()

  const { mutateAsync: mutateInitialize, isPending: isCreating } = initialize
  const { mutateAsync: mutateExitGame, isPending: isExiting } = exitGameMutation
  const { data: gameData, isLoading: isLoadingGame } = gameQuery

  // Check if game exists:
  // - Query must not be in error state (account exists)
  // - Solution must be non-empty (actual game data, not default)
  const hasGame =
    !gameQuery.isError &&
    gameQuery.data &&
    gameQuery.data.solution &&
    gameQuery.data.solution.length > 0 &&
    gameQuery.data.solution !== ''

  const handleCreate = async () => {
    await mutateInitialize()
  }

  const handleReset = async () => {
    // Reset: exit existing game then create new one
    try {
      await mutateExitGame()
      // Wait a bit for the query to update
      await new Promise((resolve) => setTimeout(resolve, 500))
      await mutateInitialize()
    } catch (error) {
      console.error('Reset failed:', error)
    }
  }

  const handleExit = async () => {
    // Exit: remove the game
    try {
      await mutateExitGame()
      // Force refetch to update UI immediately
      await gameQuery.refetch()
    } catch (error) {
      console.error('Exit failed:', error)
    }
  }

  // No game exists - show only Create button
  if (!hasGame) {
    return (
      <div className="flex justify-center gap-2">
        <Button onClick={handleCreate} disabled={isCreating || !publicKey}>
          {isCreating && <Spinner className="mr-2" />}
          Create New Game
        </Button>
      </div>
    )
  }

  // Game exists - show Reset and Exit buttons
  return (
    <div className="flex justify-center gap-2">
      <Button onClick={handleReset} disabled={isExiting || isCreating || !publicKey} variant="secondary">
        {(isExiting || isCreating) && <Spinner className="mr-2" />}
        {!isExiting && !isCreating && <RotateCcw />}
        {isExiting ? 'Resetting' : isCreating ? 'Creating' : 'Reset Board'}
      </Button>
      <Button className=" text-destructive" onClick={handleExit} disabled={isExiting || !publicKey} variant="outline">
        {isExiting && <Spinner className="mr-2" />}
        {!isExiting && <DoorOpen />}
        Exit Game
      </Button>
    </div>
  )
}
