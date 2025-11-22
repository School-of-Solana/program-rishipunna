#![allow(clippy::result_large_err)]
#![allow(unexpected_cfgs)]

use crate::instructions::*;
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod states;

declare_id!("8v1HDhJ5EmQRUWtr8tyoVE9qmXK1eLpB38CBj5HfZG2U");

#[program]
pub mod wordle_dapp {
    use super::*;
    // pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
    //     ctx.accounts.new_account.data = data;
    //     msg!("Changed data to: {}!", data); // Message will show up in the tx logs
    //     Ok(())
    // }

    pub fn create_seed(ctx: Context<CreatePDA>) -> Result<()> {
        initialize(ctx)
    }
    pub fn progress_game(ctx: Context<Progression>, guess: String) -> Result<()> {
        progression(ctx, guess)
    }
    pub fn remove_game(ctx: Context<RemovePDA>) -> Result<()> {
        remove_pda(ctx)
    }
}
