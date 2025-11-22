use anchor_lang::prelude::*;

use crate::errors::WordleErrors;
use crate::states::*;

pub fn progression(ctx: Context<Progression>, guess: String) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let uc_guess: String = guess.to_uppercase();

    if guess.chars().count() != 5 {
        return err! {WordleErrors::InvalidGuessLength};
    }

    // Check if already exhausted tries before allowing another guess
    if game.tries >= 6 {
        return err! {WordleErrors::TriesExhausted};
    }

    let curr_try = game.tries as usize;
    game.guesses[curr_try] = uc_guess.clone();
    game.tries += 1;

    if uc_guess == game.solution {
        game.is_solved = true;
    }

    // ============================================================================
    // Wordle Letter Matching Logic (Standard Rules)
    // ============================================================================
    // This implements the standard Wordle algorithm for handling duplicate letters:
    //
    // 1. First Pass - GREEN (Correct Position):
    //    Mark all letters that are in the correct position in the solution
    //
    // 2. Second Pass - YELLOW (Wrong Position):
    //    For remaining letters (not marked green), check if they exist elsewhere
    //    in the solution. Each solution letter can only be "used" once.
    //
    // 3. Third Pass - GRAY (Not in word):
    //    Any letter not marked green or yellow is implicitly gray
    //
    // Example: Solution = "TOTAL", Guess = "TTTTT"
    //   Position 0: T == T (green) ✓
    //   Position 1: T != O, but T exists at position 2 in solution (yellow) ✓
    //   Position 2: T == T (green) ✓
    //   Position 3: T != A, and T is already fully matched (gray) ✗
    //   Position 4: T != L, and T is already fully matched (gray) ✗
    // ============================================================================

    // Step 1: Mark all correct positions (green)
    for i in 0..5 {
        let curr_guess_char = uc_guess.chars().nth(i);
        if game.solution.chars().nth(i) == curr_guess_char {
            game.correct_char_pos[curr_try][i] = true;
        }
    }

    // Step 2: Track which solution positions have been used
    let mut solution_used = [false; 5];

    // Mark positions already matched as green as used
    for i in 0..5 {
        if game.correct_char_pos[curr_try][i] {
            solution_used[i] = true;
        }
    }

    // Step 3: Mark correct letters in wrong positions (yellow)
    // Only mark if the letter exists in solution and hasn't been fully accounted for
    for i in 0..5 {
        // Skip if already marked as correct position
        if game.correct_char_pos[curr_try][i] {
            continue;
        }

        let curr_guess_char = uc_guess.chars().nth(i);

        // Find an unused matching character in the solution
        for j in 0..5 {
            if !solution_used[j] && game.solution.chars().nth(j) == curr_guess_char {
                game.correct_char_not_pos[curr_try][i] = true;
                solution_used[j] = true; // Mark this solution position as used
                break; // Only match once per guess position
            }
        }
    }
    Ok(())
}

#[derive(Accounts)]
pub struct Progression<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub game: Account<'info, NewGame>,

    pub system_program: Program<'info, System>,
}
