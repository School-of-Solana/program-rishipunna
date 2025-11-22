use anchor_lang::prelude::*;
use crate::states::*;

pub fn remove_pda(_ctx: Context<RemovePDA>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct RemovePDA<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut,
    constraint= signer.key() == game.player,
    close = signer)]
    pub game: Account<'info, NewGame>,
}
