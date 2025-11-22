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

    for i in 0..5 {
        let curr_guess_char = uc_guess.chars().nth(i);
        if game.solution.chars().nth(i) == curr_guess_char {
            game.correct_char_pos[curr_try][i] = true;
        } else {
            for j in 0..5 {
                if game.solution.chars().nth(j) == curr_guess_char {
                    game.correct_char_not_pos[curr_try][i] = true;
                }
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
