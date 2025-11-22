# Project Description

**Deployed Frontend URL:** [TODO: Link to your deployed frontend]

**Solana Program ID:** 8v1HDhJ5EmQRUWtr8tyoVE9qmXK1eLpB38CBj5HfZG2U

## Project Overview

### Description

A decentralized implementation of the popular word guessing game Wordle, built on the Solana blockchain. Users can initialize a game session, which generates a random 5-letter word stored on-chain. Players have six attempts to guess the word, with the smart contract handling all game logic including input validation, state management, and letter matching (correct position vs. correct letter). Each user has their own unique game account derived from their wallet address using PDAs.

### Key Features

- **Create Game**: Initialize a new Wordle game session with a pseudo-randomly generated 5-letter word.
- **Submit Guesses**: Make up to 6 guesses to find the hidden word.
- **On-Chain Logic**: The program validates guesses and calculates the results (Green/Yellow indicators) entirely on-chain.
- **State Tracking**: Persists game state including current tries, past guesses, and solution status.
- **Rent Recovery**: Users can close their game account to recover the rent storage fees.

### How to Use the dApp

1. **Connect Wallet** - Connect your Solana wallet (e.g., Phantom, Solflare).
2. **Start Game** - Click "Create Game" to initialize your personal game session.
3. **Make a Guess** - Type a 5-letter word and submit.
4. **Analyze Results** - View the color-coded feedback:
   - **Green**: Correct letter in the correct position.
   - **Yellow**: Correct letter in the wrong position.
   - **Gray**: Letter not in the word.
5. **Complete Game** - Continue until you solve the word or use all 6 tries.
6. **Reset** - Close the current game to start a fresh one.

## Program Architecture

The Wordle dApp utilizes a single main account structure to hold the game state for each user. It employs Program Derived Addresses (PDAs) to ensure a deterministic 1-to-1 mapping between a user's wallet and their active game session.

### PDA Usage

The program uses a specific seed pattern to generate the game account address.

**PDAs Used:**

- **Game Account**: Derived from seeds `["WORDLE_DAPP", user_wallet_pubkey]`. This ensures that each user can only have one active game at a time and prevents address collisions.

### Program Instructions

**Instructions Implemented:**

- **create_seed**: Initializes the `NewGame` account. It selects a random word from a hardcoded list of 100 words using the current block's slot hash for randomness.
- **progress_game**: Processes a user's guess. It validates the input length, increments the try counter, checks for a win condition, and updates the `correct_char_pos` and `correct_char_not_pos` arrays based on the guess.
- **remove_game**: Closes the game account and refunds the rent lamports back to the user.

### Account Structure

```rust
#[account]
#[derive(InitSpace)]
pub struct NewGame {
    pub player: Pubkey,                     // The wallet that owns this game
    #[max_len(5)]
    pub solution: String,                   // The target 5-letter word
    pub tries: i8,                          // Current number of attempts (0-6)
    pub is_solved: bool,                    // Whether the game has been won
    pub correct_char_pos: [[bool; 5]; 6],   // Tracks "Green" matches per guess
    pub correct_char_not_pos: [[bool; 5]; 6], // Tracks "Yellow" matches per guess
    #[max_len(5)]
    pub guesses: [String; 6],               // History of guesses made
}
```

## Testing

### Test Coverage

The project includes a comprehensive test suite using Anchor and Chai assertions, covering 100% of the instructions and major game logic scenarios.

**Happy Path Tests:**

- **Initialize Game**: Successfully creates a new game account with default values.
- **Valid Guesses**: Verifies state updates for valid 5-letter guesses (uppercase/lowercase handling).
- **Winning Scenario**: correctly identifies a win when the guess matches the solution.
- **Game Logic**: accurately marks characters as correct position (Green) or wrong position (Yellow).
- **Game Removal**: Successfully closes the account and refunds rent.

**Unhappy Path Tests:**

- **Duplicate Game**: Prevents creating a new game if one already exists.
- **Invalid Input**: Rejects guesses that are too short, too long, or empty.
- **Exhausting Tries**: Verifies behavior when a user uses all 6 attempts without solving.
- **Unauthorized Access**: Prevents users from closing or modifying other users' games.
- **Non-existent Removal**: Handles errors when trying to close a game that doesn't exist.

### Running Tests

```bash
yarn install
anchor test
```

### Additional Notes for Evaluators

The randomness for the word selection is derived from the `Clock` slot hash. While sufficient for a casual game, in a high-stakes environment, this could potentialy be manipulated by validators; however, it serves the purpose for this demonstration. The logic for "Yellow" tiles (correct letter, wrong position) implements the standard Wordle algorithm, handling duplicate letters correctly.
