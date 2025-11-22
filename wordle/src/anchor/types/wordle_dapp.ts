/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/wordle_dapp.json`.
 */
export type WordleDapp = {
  address: '8v1HDhJ5EmQRUWtr8tyoVE9qmXK1eLpB38CBj5HfZG2U'
  metadata: {
    name: 'wordleDapp'
    version: '0.1.0'
    spec: '0.1.0'
    description: 'Created with Anchor'
  }
  instructions: [
    {
      name: 'createSeed'
      discriminator: [252, 40, 71, 192, 7, 14, 103, 7]
      accounts: [
        {
          name: 'signer'
          writable: true
          signer: true
        },
        {
          name: 'game'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [87, 79, 82, 68, 76, 69, 95, 68, 65, 80, 80]
              },
              {
                kind: 'account'
                path: 'signer'
              },
            ]
          }
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: []
    },
    {
      name: 'progressGame'
      discriminator: [143, 59, 203, 254, 183, 171, 92, 82]
      accounts: [
        {
          name: 'signer'
          writable: true
          signer: true
        },
        {
          name: 'game'
          writable: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'guess'
          type: 'string'
        },
      ]
    },
    {
      name: 'removeGame'
      discriminator: [208, 12, 103, 49, 155, 37, 215, 223]
      accounts: [
        {
          name: 'signer'
          writable: true
          signer: true
        },
        {
          name: 'game'
          writable: true
        },
      ]
      args: []
    },
  ]
  accounts: [
    {
      name: 'newGame'
      discriminator: [140, 166, 192, 74, 126, 119, 230, 26]
    },
  ]
  errors: [
    {
      code: 6000
      name: 'triesExhausted'
      msg: 'No. of tries exhausted'
    },
    {
      code: 6001
      name: 'invalidGuessLength'
      msg: 'The length of the guess word exceeds 5 letters'
    },
    {
      code: 6002
      name: 'invalidCharacters'
      msg: 'Invalid characters. Characters must be aplhabets.'
    },
  ]
  types: [
    {
      name: 'newGame'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'player'
            type: 'pubkey'
          },
          {
            name: 'solution'
            type: 'string'
          },
          {
            name: 'tries'
            type: 'i8'
          },
          {
            name: 'isSolved'
            type: 'bool'
          },
          {
            name: 'correctCharPos'
            type: {
              array: [
                {
                  array: ['bool', 5]
                },
                6,
              ]
            }
          },
          {
            name: 'correctCharNotPos'
            type: {
              array: [
                {
                  array: ['bool', 5]
                },
                6,
              ]
            }
          },
          {
            name: 'guesses'
            type: {
              array: ['string', 6]
            }
          },
        ]
      }
    },
  ]
}
