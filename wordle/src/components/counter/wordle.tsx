import React, { useContext } from 'react'

import { useState, useEffect } from 'react'
import { useCounterProgram } from './counter-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import clsx from 'clsx'
import { WordleAction } from './wordle-action'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Delete, CornerDownLeft, Gamepad2 } from 'lucide-react'
import { useConfettiSideCannons, useConfettiEmoji } from '@/components/ui/confetti'
import { Empty } from '@/components/ui/empty'

export function WordleGame() {
  const { gameQuery, progressGameMutation } = useCounterProgram()
  const [currentGuess, setCurrentGuess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [revealIndex, setRevealIndex] = useState(-1)
  const { publicKey } = useWallet()

  const submitGuess = async () => {
    if (isSubmitting) return
    if (currentGuess.length !== 5) return

    setIsSubmitting(true)

    try {
      if (!publicKey) {
        toast('Please connect your wallet')
        return
      }
      await progressGameMutation.mutateAsync({
        guess: currentGuess,
      })
    } catch (error) {
      toast('Guess submission cancelled..')
    }

    setCurrentGuess('')
    setIsSubmitting(false)
  }

  // ⭐ Reveal animation when tries increases
  useEffect(() => {
    if (!gameQuery.data) return
    if (gameQuery.data.tries === 0) return

    setRevealIndex((gameQuery.data.tries - 1) * 5) // start revealing new row

    const int = setInterval(() => {
      setRevealIndex((idx) => {
        if (idx >= gameQuery.data.tries * 5 - 1) {
          clearInterval(int)
          return -1 // stop animation
        }
        return idx + 1
      })
    }, 250) // tile delay

    return () => clearInterval(int)
  }, [gameQuery.data.tries])

  if (gameQuery.isLoading) return <div>Loading game...</div>

  // Check if game exists: has a solution (non-empty string) and query is not in error
  const hasGame =
    !gameQuery.isError &&
    gameQuery.data &&
    gameQuery.data.solution &&
    gameQuery.data.solution.length > 0 &&
    gameQuery.data.solution !== ''

  // Show empty state if no game exists
  if (!hasGame) {
    return (
      <div className="container mx-auto px-4 py-4">
        <Empty
          icon={<Gamepad2 className="h-12 w-12" />}
          title="No game found"
          description="Create a new Wordle game to start playing. You'll have 6 tries to guess the 5-letter word!"
          action={<WordleAction />}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="grid gap-4  items-start">
        {/* Game Grid Card */}
        <Card className="py-4 bg-transparent border-none">
          <CardContent className="space-y-4 ">
            <WordleAction />
            <WordGrid
              tries={gameQuery.data?.tries}
              correctPos={gameQuery.data?.correctCharPos}
              correctNotPos={gameQuery.data?.correctCharNotPos}
              guesses={gameQuery.data?.guesses}
              currentGuess={currentGuess}
              revealIndex={revealIndex}
            />
          </CardContent>
        </Card>

        {/* Keyboard and Status Card */}
        <Card className="py-4 self-center w-full max-w-full">
          <CardContent className="space-y-4 px-2 sm:px-4">
            <Keyboard
              correctPos={gameQuery.data?.correctCharPos}
              correctNotPos={gameQuery.data?.correctCharNotPos}
              guesses={gameQuery.data?.guesses}
              onKeyPress={(letter: string) => {
                if (currentGuess.length < 5) {
                  setCurrentGuess((g) => g + letter)
                }
              }}
              onBackspace={() => setCurrentGuess((g) => g.slice(0, -1))}
              onEnter={submitGuess}
            />
            <GameStatus game={gameQuery.data} />
          </CardContent>
        </Card>
      </div>

      {!gameQuery.data?.isSolved && gameQuery.data?.tries < 6 && (
        <WordInput
          currentGuess={currentGuess}
          setCurrentGuess={setCurrentGuess}
          onSubmit={submitGuess}
          disabled={isSubmitting}
          gameQuery={gameQuery}
        />
      )}
    </div>
  )
}

export function WordGrid({
  guesses,
  correctPos,
  correctNotPos,
  currentGuess,
  tries,
  revealIndex,
}: {
  guesses: string[]
  correctPos: boolean[][]
  correctNotPos: boolean[][]
  currentGuess: string
  tries: number
  revealIndex: number
}) {
  const totalRows = 6
  const [showContent, setShowContent] = useState(false)

  return (
    <div className="grid grid-rows-6 gap-1.5 items-center justify-center">
      {Array.from({ length: totalRows }).map((_, rowIndex) => {
        const guess = guesses[rowIndex] || ''
        const isPastGuess = rowIndex < tries
        const isCurrentRow = rowIndex === tries

        return (
          <div
            key={rowIndex}
            className={clsx('grid grid-cols-5 gap-1.5 items-center justify-center')}
            style={{
              animationDelay: '1s',
            }}
          >
            {Array.from({ length: 5 }).map((_, col) => {
              let letter = ''
              let bg = 'bg-gray-800 rounded-full'
              // const isRevealedTile = isPastGuess && rowIndex === tries - 1;
              let delay = 0 // seconds
              if (rowIndex === tries - 1) delay = 0.4 * col

              if (isPastGuess) {
                // Completed guess
                letter = guess[col]
                if (correctPos[rowIndex][col]) bg = 'animate-tile-bounce'
                else if (correctNotPos[rowIndex][col]) bg = 'animate-tile-bounce'
                else bg = 'animate-tile-bounce'
              }

              if (isCurrentRow) {
                // Current guess (uncolored)
                bg = 'bg-gray-80 rounded-full'
                letter = currentGuess[col] || ''
              }

              // setTimeout((""), 3000);

              return (
                <div
                  key={col}
                  className={clsx(
                    'size-10 sm:size-11 md:size-12 border border-border flex items-center justify-center text-lg font-bold uppercase transition-all duration-500 rounded-full',
                    bg,
                    rowIndex == tries - 1 ? `delay-${col * 100}` : '',
                  )}
                  style={
                    {
                      animationDelay: `${delay}s`,
                      '--final-color': correctPos[rowIndex][col]
                        ? '#16a34a' // green-600
                        : correctNotPos[rowIndex][col]
                          ? '#ca8a04' // yellow-600
                          : '#4a5565', // gray-600
                      '--final-shape': correctPos[rowIndex][col]
                        ? '20%' // green-600
                        : correctNotPos[rowIndex][col]
                          ? '20%' // yellow-600
                          : '50%', // gray-600
                    } as React.CSSProperties
                  }
                >
                  {letter}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

const KEYS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

export function Keyboard({
  guesses,
  correctPos,
  correctNotPos,
  onKeyPress,
  onBackspace,
  onEnter,
}: {
  guesses: string[]
  correctPos: boolean[][]
  correctNotPos: boolean[][]
  onKeyPress: (letter: string) => void
  onBackspace: () => void
  onEnter: () => void
}) {
  const green = new Set<string>()
  const yellow = new Set<string>()
  const gray = new Set<string>()

  guesses.forEach((guess: string, rowIndex: number) => {
    guess.split('').forEach((letter: string, col: number) => {
      if (correctPos[rowIndex][col]) {
        green.add(letter)
      } else if (correctNotPos[rowIndex][col]) {
        yellow.add(letter)
      } else {
        gray.add(letter)
      }
    })
  })

  // Green overrides everything else
  yellow.forEach((l) => {
    if (green.has(l)) yellow.delete(l)
  })
  gray.forEach((l) => {
    if (green.has(l) || yellow.has(l)) gray.delete(l)
  })

  const colorLetter = (letter: string) => {
    if (green.has(letter)) return 'animate-tile-bounce'
    if (yellow.has(letter)) return 'animate-tile-bounce'
    if (gray.has(letter)) return 'animate-tile-bounce'
    return 'bg-muted rounded-full'
  }

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-full overflow-hidden">
      {KEYS.map((row, idx) => (
        <div
          key={idx}
          className="flex justify-center items-center gap-1 sm:gap-1.5 md:gap-2 w-full"
          style={{ minWidth: 0 }}
        >
          {row.split('').map((letter) => (
            <Button
              key={letter}
              variant="outline"
              onClick={() => onKeyPress(letter)}
              className={`size-7 sm:size-8 md:size-9 lg:size-10 shrink-0 text-xs sm:text-sm md:text-base font-bold transition-all duration-300 rounded-full p-0 ${colorLetter(letter)}`}
              style={
                {
                  animationDelay: '2s',
                  '--final-color': green.has(letter)
                    ? '#00a63e'
                    : yellow.has(letter)
                      ? '#d08700'
                      : gray.has(letter)
                        ? '#e7000b'
                        : 'transparent',
                  '--final-shape': green.has(letter)
                    ? '20%'
                    : yellow.has(letter)
                      ? '20%'
                      : gray.has(letter)
                        ? '50%'
                        : '50%',
                  '--final-opacity': green.has(letter)
                    ? '100%'
                    : yellow.has(letter)
                      ? '100%'
                      : gray.has(letter)
                        ? '50%'
                        : '100%',
                } as React.CSSProperties
              }
            >
              {letter}
            </Button>
          ))}
          {idx == 1 && (
            <Button
              variant="destructive"
              onClick={onBackspace}
              className="size-7 sm:size-8 md:size-9 lg:size-10 shrink-0 rounded-full p-0 ml-0.5 sm:ml-1 md:ml-1.5"
            >
              <Delete className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5" />
            </Button>
          )}
          {idx == 2 && (
            <Button
              variant="default"
              onClick={onEnter}
              className="size-7 sm:size-8 md:size-9 lg:size-10 shrink-0 rounded-full p-0 ml-0.5 sm:ml-1 md:ml-1.5"
            >
              <CornerDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

export function WordInput({
  currentGuess,
  setCurrentGuess,
  onSubmit,
  disabled,
  gameQuery,
}: {
  currentGuess: string
  setCurrentGuess: (guess: string | ((g: string) => string)) => void
  onSubmit: (guess: string) => void
  disabled: boolean
  gameQuery: any
}) {
  useEffect(() => {
    if (disabled) return
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()

      if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
        setCurrentGuess((g: string) => g + key)
      }

      if (key === 'BACKSPACE') {
        setCurrentGuess((g: string) => g.slice(0, -1))
      }

      if (key === 'ENTER' && currentGuess.length === 5 && !gameQuery.isLoading) {
        onSubmit(currentGuess)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentGuess, disabled])

  return null
}

export function GameStatus({ game }: { game: any }) {
  const { fire: fireSuccessConfetti } = useConfettiSideCannons()
  const { fire: fireFailConfetti } = useConfettiEmoji()
  const [hasFiredConfetti, setHasFiredConfetti] = useState(false)

  useEffect(() => {
    if (game?.isSolved && !hasFiredConfetti) {
      // Delay confetti slightly to let the tile animations complete
      fireSuccessConfetti()
      setHasFiredConfetti(true)
    }
  }, [game?.isSolved, hasFiredConfetti, fireSuccessConfetti])

  useEffect(() => {
    // Fire crying emoji confetti when game is failed (6 tries used, not solved)
    if (game?.tries >= 6 && !game?.isSolved && !hasFiredConfetti) {
      fireFailConfetti()
      setHasFiredConfetti(true)
    }
  }, [game?.tries, game?.isSolved, hasFiredConfetti, fireFailConfetti])

  // Reset confetti flag when game changes
  useEffect(() => {
    if (!game?.isSolved && game?.tries < 6) {
      setHasFiredConfetti(false)
    }
  }, [game?.isSolved, game?.tries])

  if (game?.tries >= 6 && !game?.isSolved) {
    return (
      <div className="flex justify-center items-center text-red-600 dark:text-red-400 text-sm sm:text-base font-bold p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
        ❌ Game Over — The correct word was: <span className="ml-2 font-mono">{game.solution}</span>
      </div>
    )
  }

  return null
}

export function ResetGuess({ setCurrentGuess }: { setCurrentGuess: (guess: string) => void }) {
  setCurrentGuess('')
}
