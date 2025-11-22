use anchor_lang::prelude::*;

pub const WORDS: [&str; 100] = [
    "ABOUT", "OTHER", "WHICH", "THEIR", "THERE", "FIRST", "WOULD", "THESE", "CLICK", "PRICE",
    "STATE", "EMAIL", "WORLD", "MUSIC", "AFTER", "VIDEO", "WHERE", "ORDER", "GROUP", "UNDER",
    "COULD", "GREAT", "HOTEL", "STORE", "RIGHT", "LOCAL", "THOSE", "USING", "PHONE", "FORUM",
    "BLACK", "CHECK", "INDEX", "BEING", "WOMEN", "TODAY", "SOUTH", "FOUND", "HOUSE", "PHOTO",
    "POWER", "WHILE", "THREE", "TOTAL", "PLACE", "THINK", "NORTH", "MEDIA", "WATER", "SINCE",
    "GUIDE", "BOARD", "WHITE", "SMALL", "LEVEL", "IMAGE", "TITLE", "SHALL", "CLASS", "STILL",
    "MONEY", "EVERY", "VISIT", "REPLY", "VALUE", "PRESS", "LEARN", "PRINT", "STOCK", "POINT",
    "LARGE", "TABLE", "START", "MODEL", "HUMAN", "MOVIE", "MARCH", "GOING", "STUDY", "STAFF",
    "AGAIN", "NEVER", "TOPIC", "BELOW", "PARTY", "LOGIN", "LEGAL", "ABOVE", "QUOTE", "STORY",
    "YOUNG", "FIELD", "PAPER", "NIGHT", "POKER", "ISSUE", "RANGE", "COURT", "AUDIO", "LIGHT",
];
pub const WORDLE_SEED: &str = "WORDLE_DAPP";

#[account]
#[derive(InitSpace)]
pub struct NewGame {
    pub player: Pubkey,
    #[max_len(5)]
    pub solution: String,
    pub tries: i8,
    pub is_solved: bool,
    pub correct_char_pos: [[bool; 5]; 6],
    pub correct_char_not_pos: [[bool; 5]; 6],
    #[max_len(5)]
    pub guesses: [String; 6],
}
