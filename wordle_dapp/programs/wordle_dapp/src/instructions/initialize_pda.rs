use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;

use crate::states::*;

pub fn initialize(ctx: Context<CreatePDA>) -> Result<()> {
    msg!("Initialized");
    let game = &mut ctx.accounts.game;

    let clock = Clock::get()?;

    // Hash the seed to get a pseudo-random value
    let hash_val = hash(&clock.slot.to_le_bytes());

    // Convert first 8 bytes of hash to u64
    let num = usize::from_le_bytes(hash_val.to_bytes()[..8].try_into().unwrap());

    // Map to range 1..=100
    let random_number = num % 100;

    msg!("Random number between 1 and 100: {}", random_number);

    game.player = ctx.accounts.signer.key();
    game.tries = 0;
    game.is_solved = false;
    game.solution = WORDS[random_number].to_string().to_uppercase();
    game.correct_char_pos = [[false; 5]; 6];
    game.correct_char_not_pos = [[false; 5]; 6];
    game.guesses = [
        "".to_string(),
        "".to_string(),
        "".to_string(),
        "".to_string(),
        "".to_string(),
        "".to_string(),
    ];

    Ok(())
}

#[derive(Accounts)]
pub struct CreatePDA<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = 8 + NewGame::INIT_SPACE,
        seeds = [WORDLE_SEED.as_bytes(), signer.key().as_ref()],
        bump
    )]
    pub game: Account<'info, NewGame>,

    pub system_program: Program<'info, System>,
}
