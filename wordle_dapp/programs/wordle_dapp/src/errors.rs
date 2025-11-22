use anchor_lang::prelude::*;

#[error_code]
pub enum WordleErrors {
    #[msg("No. of tries exhausted")]
    TriesExhausted,

    #[msg("The length of the guess word exceeds 5 letters")]
    InvalidGuessLength,

    #[msg("Invalid characters. Characters must be aplhabets.")]
    InvalidCharacters,
}
