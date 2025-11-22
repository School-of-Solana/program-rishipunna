import React, { useContext } from "react"

import { useState, useEffect } from "react";
import { useCounterProgram } from './counter-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import clsx from "clsx";
import { CounterCreate } from "./counter-ui";
import { toast } from "sonner";

export function WordleGame() {
  const { gameQuery, progressGameMutation } = useCounterProgram();
  const [ currentGuess, setCurrentGuess ] = useState("");
  const [ isSubmitting, setIsSubmitting] = useState(false);
  const [ revealIndex, setRevealIndex] = useState(-1);
  const { publicKey } = useWallet();

    const submitGuess = async () => {
      if (isSubmitting) return;
      if (currentGuess.length !== 5) return;

      setIsSubmitting(true);

      try{
        await progressGameMutation.mutateAsync({
          guess: currentGuess,
          owner: publicKey,
        });
      } catch (error){
          toast("Guess submission cancelled..")
      }

      setCurrentGuess("");
      setIsSubmitting(false);
    };

    // ⭐ Reveal animation when tries increases
  useEffect(() => {
    if (!gameQuery.data) return;
    if (gameQuery.data.tries === 0) return;

    setRevealIndex((gameQuery.data.tries - 1) * 5); // start revealing new row

    const int = setInterval(() => {
      setRevealIndex((idx) => {
        if (idx >= ((gameQuery.data.tries) * 5) - 1 ) {
          clearInterval(int);
          return -1; // stop animation
        }
        return idx + 1;
      });
    }, 250); // tile delay

    return () => clearInterval(int);
  }, [gameQuery.data.tries]);

  if (gameQuery.isLoading) return <div>Loading game...</div>;

  return (
    <div className="flex flex-col  md:lg:flex-row items-center justify-center gap-5">
      <div className="grid gap-5 items-center justify-start h-full p-5 bg-gray-900 rounded-xl">
        <CounterCreate/>
      <WordGrid
            tries={gameQuery.data?.tries}
            correctPos={gameQuery.data?.correctCharPos}
            correctNotPos={gameQuery.data?.correctCharNotPos}
            guesses = {gameQuery.data?.guesses}
            currentGuess={currentGuess}
            revealIndex = {revealIndex}
        />
        </div>

        <div className=" flex-1 grid grid-flow-row bg-gray-900 gap-2 items-around justify-around rounded-xl h-full w-fit p-5 sm:w-fit md:w-fit lg:w-fit">
            <Keyboard
                correctPos={gameQuery.data?.correctCharPos}
                correctNotPos={gameQuery.data?.correctCharNotPos}
                guesses={gameQuery.data?.guesses}
                usedLetters={currentGuess.split("")}
                onKeyPress={(letter) => {
                    if (currentGuess.length < 5) {
                        setCurrentGuess((g) => g + letter);
                    }
                }}
                onBackspace={() =>
                    setCurrentGuess((g) => g.slice(0, -1))
                }
                onEnter={submitGuess}
            />
            <GameStatus game={gameQuery.data} />    
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
  );
}


export function WordGrid({
  guesses,
  correctPos,
  correctNotPos,
  currentGuess,
  tries,
  revealIndex
}) {
  const totalRows = 6;
  const [showContent, setShowContent] = useState(false);

  // p-5 bg-gray-900 rounded-xl
  return (
    <div className="">
    <div className="grid grid-rows-6 gap-2 items-center justify-center">
      {Array.from({ length: totalRows }).map((_, rowIndex) => {
        const guess = guesses[rowIndex] || "";
        const isPastGuess = rowIndex < tries;
        const isCurrentRow = rowIndex === tries;

        return (
          <div key={rowIndex} className={clsx("grid grid-cols-5 gap-2 items-center justify-center")} style={{
            animationDelay: '1s'
          }}>
            {Array.from({ length: 5 }).map((_, col) => {
              let letter = "";
              let bg = "bg-gray-800 rounded-full";
              // const isRevealedTile = isPastGuess && rowIndex === tries - 1;
              let delay = 0; // seconds
              if (rowIndex === tries - 1) delay = 0.4 * col;

              if (isPastGuess) {
                // Completed guess
                letter = guess[col];
                if (correctPos[rowIndex][col]) bg = "animate-tile-bounce";
                else if (correctNotPos[rowIndex][col]) bg = "animate-tile-bounce";
                else bg = "animate-tile-bounce";
              }

              if (isCurrentRow) {
                // Current guess (uncolored)
                bg = "bg-gray-80 rounded-full";
                letter = currentGuess[col] || "";
              }

              // setTimeout((""), 3000);
             
              return (
                <div
                  key={col}
                  className={clsx(
                    "size-12 border border-gray-500 flex items-center justify-center text-xl font-bold uppercase transition-all duration-500 rounded-full",
                    bg,
                    (rowIndex == tries-1) ? `delay-${col * 100}` : "",
                  )} style={{
                    animationDelay: `${delay}s`,
                    "--final-color": correctPos[rowIndex][col]
                      ? "#16a34a" // green-600
                      : correctNotPos[rowIndex][col]
                      ? "#ca8a04" // yellow-600
                      : "#4a5565", // gray-600
                    "--final-shape": correctPos[rowIndex][col]
                      ? "20%" // green-600
                      : correctNotPos[rowIndex][col]
                      ? "20%" // yellow-600
                      : "50%", // gray-600
                  }}
                  >
                  {letter}
                </div>
              )
            })}
          </div>
        );
      })}
    </div>
    </div>
  );
}




const KEYS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export function Keyboard({
  guesses,
  correctPos,
  correctNotPos,
  onKeyPress,
  onBackspace,
  onEnter,
}) {
  const green = new Set<string>();
  const yellow = new Set<string>();
  const gray = new Set<string>();

  guesses.forEach((guess, rowIndex) => {
    guess.split("").forEach((letter, col) => {
      if (correctPos[rowIndex][col]) {
        green.add(letter);
      } else if (correctNotPos[rowIndex][col]) {
        yellow.add(letter);
      } else {
        gray.add(letter);
      }
    });
  });

  // Green overrides everything else
  yellow.forEach((l) => {
    if (green.has(l)) yellow.delete(l);
  });
  gray.forEach((l) => {
    if (green.has(l) || yellow.has(l)) gray.delete(l);
  });

  const colorLetter = (letter: string) => {
    if (green.has(letter)) return "animate-tile-bounce";
    if (yellow.has(letter)) return "animate-tile-bounce";
    if (gray.has(letter)) return "animate-tile-bounce";
    return "bg-gray-800 rounded-full";
  };

  return (
    <div className="flex flex-col gap-2 md:p-5 lg:p-5">
      {KEYS.map((row, idx) => (
        <div key={idx} className="flex justify-center items-center gap-2 w-full">
          {row.split("").map((letter) => (
            <button
              key={letter}
              onClick={() => onKeyPress(letter)}
              className={`size-5 sm:size-7 md:size-10 lg:size-12 border text-white font-bold transition-all duration-300 rounded-full ${colorLetter(letter)}`}
              style={{
                animationDelay: "2s",
                "--final-color": green.has(letter)?
                "#00a63e" : 
                yellow.has(letter) ? 
                "#d08700" :
                gray.has(letter) ?
                "#e7000b" : 
                "#1e2939",
                "--final-shape": green.has(letter)?
                "20%" : 
                yellow.has(letter) ? 
                "20%" :
                gray.has(letter) ?
                "50%" : 
                "50%",
                "--final-opacity": green.has(letter)?
                "100%" : 
                yellow.has(letter) ? 
                "100%" :
                gray.has(letter) ?
                "50%" : 
                "100%",
              }}
            >
              {letter}
            </button>
          ))}
          {(idx == 1) && (
            <button
              onClick={onBackspace}
              className="size-5 sm:size-7 md:size-10 lg:size-12 border bg-red-700 rounded text-white"
            >
              ⌫
            </button>
          )}
          {(idx == 2) && (
            <button
              onClick={onEnter}
              className="size-5 sm:size-7 md:size-10 lg:size-12 border w-max bg-blue-700 font-bold rounded text-white"
            >
              ⏎
            </button>
          )}
        </div>
      ))}
    </div>
  );
}


export function WordInput({
  currentGuess,
  setCurrentGuess,
  onSubmit,
  disabled,
  gameQuery
}) {
  useEffect(() => {
    if (disabled) return;
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();

      if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
        setCurrentGuess((g) => g + key);
      }

      if (key === "BACKSPACE") {
        setCurrentGuess((g) => g.slice(0, -1));
      }

      if (key === "ENTER" && currentGuess.length === 5 && !gameQuery.isLoading) {
        onSubmit(currentGuess);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);

  }, [currentGuess, disabled]);

  return null;
}



export function GameStatus({ game }) {
  if (game.isSolved) {
    return (
      <div className="flex justify-center text-green-400 text-2xl font-bold animate-[bounce_5s]" style={{
        animationDelay: "2s"
      }}>
        🎉 You solved it!
      </div>
    );
  }

  if (game.tries >= 6) {
    return (
      <div className="flex justify-center text-red-400 text-xl font-bold">
        ❌ Game Over — The correct word was: {game.solution}
      </div>
    );
  }

  return null;
}


export function ResetGuess({setCurrentGuess}){
    setCurrentGuess("");
}
