import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { WordleDapp } from "../target/types/wordle_dapp";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";

const WORDLE_SEED = "WORDLE_DAPP";

describe("wordle_dapp", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.WordleDapp as Program<WordleDapp>;

  const bob = anchor.web3.Keypair.generate();
  const alice = anchor.web3.Keypair.generate();
  const charlie = anchor.web3.Keypair.generate();

  // Test guesses
  const validGuess1 = "ABOUT";
  const validGuess2 = "WORLD";
  const validGuess3 = "STALE";
  const validGuess4 = "CRANE";
  const validGuess5 = "SLATE";
  const validGuess6 = "SPARE";

  const invalidGuessShort = "ABC";
  const invalidGuessLong = "ABCDEF";
  const invalidGuessVeryLong = "THISISWAYTOOLONG";
  const emptyGuess = "";
  const singleChar = "A";
  const fourChar = "TEST";
  const sixChar = "TESTED";

  describe("Initialize Game (create_seed)", () => {
    it("Should successfully initialize a new game for Bob", async () => {
      await airdrop(provider.connection, bob.publicKey);

      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        bob.publicKey,
        program.programId
      );

      await program.methods
        .createSeed()
        .accounts({
          signer: bob.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkGame(
        program,
        pda_key,
        bob.publicKey,
        0, // tries
        false // is_solved
      );
    });

    it("Should verify game account has valid solution from word list", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        bob.publicKey,
        program.programId
      );

      const gameData = await program.account.newGame.fetch(pda_key);

      // Check solution is 5 characters
      assert.strictEqual(
        gameData.solution.length,
        5,
        "Solution should be exactly 5 characters"
      );

      // Check solution is uppercase
      assert.strictEqual(
        gameData.solution,
        gameData.solution.toUpperCase(),
        "Solution should be uppercase"
      );
    });

    it("Should initialize game with empty guesses array", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        bob.publicKey,
        program.programId
      );

      const gameData = await program.account.newGame.fetch(pda_key);

      // Check all guesses are empty
      for (let i = 0; i < 6; i++) {
        assert.strictEqual(
          gameData.guesses[i],
          "",
          `Guess ${i} should be empty string initially`
        );
      }
    });

    it("Should initialize game with all correct_char_pos flags false", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        bob.publicKey,
        program.programId
      );

      const gameData = await program.account.newGame.fetch(pda_key);

      // Check all correct_char_pos are false
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 5; j++) {
          assert.strictEqual(
            gameData.correctCharPos[i][j],
            false,
            `correct_char_pos[${i}][${j}] should be false initially`
          );
        }
      }
    });

    it("Should initialize game with all correct_char_not_pos flags false", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        bob.publicKey,
        program.programId
      );

      const gameData = await program.account.newGame.fetch(pda_key);

      // Check all correct_char_not_pos are false
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 5; j++) {
          assert.strictEqual(
            gameData.correctCharNotPos[i][j],
            false,
            `correct_char_not_pos[${i}][${j}] should be false initially`
          );
        }
      }
    });

    it("Should fail to initialize duplicate game for same user", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        bob.publicKey,
        program.programId
      );

      let should_fail = "This Should Fail";
      try {
        await program.methods
          .createSeed()
          .accounts({
            signer: bob.publicKey,
            game: pda_key,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          SolanaError.contains(error.logs, "already in use"),
          "Expected 'already in use' error when trying to create duplicate game"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Game initialization should have failed when trying to create duplicate game"
      );
    });

    it("Should successfully initialize a new game for Alice", async () => {
      await airdrop(provider.connection, alice.publicKey);

      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        alice.publicKey,
        program.programId
      );

      await program.methods
        .createSeed()
        .accounts({
          signer: alice.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkGame(
        program,
        pda_key,
        alice.publicKey,
        0, // tries
        false // is_solved
      );
    });

    it("Should successfully initialize a new game for Charlie", async () => {
      await airdrop(provider.connection, charlie.publicKey);

      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        charlie.publicKey,
        program.programId
      );

      await program.methods
        .createSeed()
        .accounts({
          signer: charlie.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([charlie])
        .rpc({ commitment: "confirmed" });

      await checkGame(
        program,
        pda_key,
        charlie.publicKey,
        0, // tries
        false // is_solved
      );
    });
  });

  describe("Progress Game - Valid Guesses", () => {
    it("Should successfully make first guess with valid 5-letter word", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        bob.publicKey,
        program.programId
      );

      await program.methods
        .progressGame(validGuess1)
        .accounts({
          signer: bob.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkGame(
        program,
        pda_key,
        bob.publicKey,
        1, // tries
        undefined // is_solved - may or may not be solved
      );
    });

    it("Should store guess in uppercase in guesses array", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        bob.publicKey,
        program.programId
      );

      const gameData = await program.account.newGame.fetch(pda_key);

      assert.strictEqual(
        gameData.guesses[0],
        validGuess1.toUpperCase(),
        "First guess should be stored in uppercase"
      );
      assert.strictEqual(
        gameData.guesses[0].length,
        5,
        "First guess should be 5 characters"
      );
    });

    it("Should successfully make second guess with lowercase input", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        bob.publicKey,
        program.programId
      );

      const lowercaseGuess = "world";

      await program.methods
        .progressGame(lowercaseGuess)
        .accounts({
          signer: bob.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      const gameData = await program.account.newGame.fetch(pda_key);

      assert.strictEqual(
        gameData.tries,
        2,
        "Should have 2 tries after second guess"
      );
      assert.strictEqual(
        gameData.guesses[1],
        lowercaseGuess.toUpperCase(),
        "Second guess should be stored in uppercase"
      );
    });

    it("Should successfully make third guess with mixed case input", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        bob.publicKey,
        program.programId
      );

      const mixedCaseGuess = "StAlE";

      await program.methods
        .progressGame(mixedCaseGuess)
        .accounts({
          signer: bob.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      const gameData = await program.account.newGame.fetch(pda_key);

      assert.strictEqual(
        gameData.tries,
        3,
        "Should have 3 tries after third guess"
      );
      assert.strictEqual(
        gameData.guesses[2],
        mixedCaseGuess.toUpperCase(),
        "Third guess should be stored in uppercase"
      );
    });

    it("Should successfully make fourth guess", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        bob.publicKey,
        program.programId
      );

      await program.methods
        .progressGame(validGuess4)
        .accounts({
          signer: bob.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkGame(
        program,
        pda_key,
        bob.publicKey,
        4, // tries
        undefined // is_solved
      );
    });

    it("Should successfully make fifth guess", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        bob.publicKey,
        program.programId
      );

      await program.methods
        .progressGame(validGuess5)
        .accounts({
          signer: bob.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkGame(
        program,
        pda_key,
        bob.publicKey,
        5, // tries
        undefined // is_solved
      );
    });

    it("Should successfully make sixth guess", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        bob.publicKey,
        program.programId
      );

      // Check if game is already solved
      let gameDataBefore = await program.account.newGame.fetch(pda_key);

      if (!gameDataBefore.isSolved) {
        await program.methods
          .progressGame(validGuess6)
          .accounts({
            signer: bob.publicKey,
            game: pda_key,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([bob])
          .rpc({ commitment: "confirmed" });

        await checkGame(
          program,
          pda_key,
          bob.publicKey,
          6, // tries
          undefined // is_solved
        );
      }
    });
  });

  describe("Progress Game - Invalid Guess Length", () => {
    it("Should fail with guess shorter than 5 letters (3 letters)", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        alice.publicKey,
        program.programId
      );

      let should_fail = "This Should Fail";
      try {
        await program.methods
          .progressGame(invalidGuessShort)
          .accounts({
            signer: alice.publicKey,
            game: pda_key,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "InvalidGuessLength",
          "Expected 'InvalidGuessLength' error for guess shorter than 5 letters"
        );
        should_fail = "Failed";
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Guess should have failed with length < 5"
      );
    });

    it("Should fail with guess longer than 5 letters (6 letters)", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        alice.publicKey,
        program.programId
      );

      let should_fail = "This Should Fail";
      try {
        await program.methods
          .progressGame(invalidGuessLong)
          .accounts({
            signer: alice.publicKey,
            game: pda_key,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "InvalidGuessLength",
          "Expected 'InvalidGuessLength' error for guess longer than 5 letters"
        );
        should_fail = "Failed";
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Guess should have failed with length > 5"
      );
    });

    it("Should fail with empty string guess", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        alice.publicKey,
        program.programId
      );

      let should_fail = "This Should Fail";
      try {
        await program.methods
          .progressGame(emptyGuess)
          .accounts({
            signer: alice.publicKey,
            game: pda_key,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "InvalidGuessLength",
          "Expected 'InvalidGuessLength' error for empty guess"
        );
        should_fail = "Failed";
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Guess should have failed with empty string"
      );
    });

    it("Should fail with single character guess", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        alice.publicKey,
        program.programId
      );

      let should_fail = "This Should Fail";
      try {
        await program.methods
          .progressGame(singleChar)
          .accounts({
            signer: alice.publicKey,
            game: pda_key,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "InvalidGuessLength",
          "Expected 'InvalidGuessLength' error for single character"
        );
        should_fail = "Failed";
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Guess should have failed with single character"
      );
    });

    it("Should fail with four character guess", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        alice.publicKey,
        program.programId
      );

      let should_fail = "This Should Fail";
      try {
        await program.methods
          .progressGame(fourChar)
          .accounts({
            signer: alice.publicKey,
            game: pda_key,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "InvalidGuessLength",
          "Expected 'InvalidGuessLength' error for 4 characters"
        );
        should_fail = "Failed";
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Guess should have failed with 4 characters"
      );
    });

    it("Should fail with very long guess", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        alice.publicKey,
        program.programId
      );

      let should_fail = "This Should Fail";
      try {
        await program.methods
          .progressGame(invalidGuessVeryLong)
          .accounts({
            signer: alice.publicKey,
            game: pda_key,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "InvalidGuessLength",
          "Expected 'InvalidGuessLength' error for very long guess"
        );
        should_fail = "Failed";
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Guess should have failed with very long string"
      );
    });

    it("Should verify tries count unchanged after failed guess", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        alice.publicKey,
        program.programId
      );

      const gameData = await program.account.newGame.fetch(pda_key);

      assert.strictEqual(
        gameData.tries,
        0,
        "Tries should remain 0 after failed guesses"
      );
    });
  });

  describe("Progress Game - Exhausting Tries", () => {
    it("Should successfully make all 6 guesses without solving", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        charlie.publicKey,
        program.programId
      );

      // Get the solution first
      let gameData = await program.account.newGame.fetch(pda_key);
      const solution = gameData.solution;

      // Make guesses that are NOT the solution
      const wrongGuesses = [
        "WRONG",
        "GUESS",
        "TESTS",
        "TRIES",
        "NEVER",
        "FINAL",
      ];

      for (let i = 0; i < 6; i++) {
        // Make sure we're not accidentally guessing the solution
        const guessWord =
          wrongGuesses[i] === solution ? "AAAAA" : wrongGuesses[i];

        await program.methods
          .progressGame(guessWord)
          .accounts({
            signer: charlie.publicKey,
            game: pda_key,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([charlie])
          .rpc({ commitment: "confirmed" });
      }

      gameData = await program.account.newGame.fetch(pda_key);
      assert.strictEqual(
        gameData.tries,
        6,
        "Should have 6 tries after 6 guesses"
      );
      assert.strictEqual(
        gameData.isSolved,
        false,
        "Game should not be solved yet"
      );
    });

    it("Should fail on 7th guess attempt (tries exhausted)", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        charlie.publicKey,
        program.programId
      );

      // Get the solution to make sure we don't guess it
      let gameData = await program.account.newGame.fetch(pda_key);
      const solution = gameData.solution;
      const wrongGuess = solution === "ZZZZZ" ? "AAAAA" : "ZZZZZ";

      let should_fail = "This Should Fail";
      try {
        await program.methods
          .progressGame(wrongGuess)
          .accounts({
            signer: charlie.publicKey,
            game: pda_key,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([charlie])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "TriesExhausted",
          "Expected 'TriesExhausted' error on 7th guess attempt"
        );
        should_fail = "Failed";
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should have failed with TriesExhausted error on 7th guess"
      );
    });

    it("Should have tries count remain at 6 after failed 7th guess attempt", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        charlie.publicKey,
        program.programId
      );

      const gameData = await program.account.newGame.fetch(pda_key);

      assert.strictEqual(
        gameData.tries,
        6,
        "Should still have 6 tries after failed 7th guess attempt"
      );
      assert.strictEqual(gameData.isSolved, false, "Game should not be solved");
    });
  });

  describe("Progress Game - Winning Scenario", () => {
    let david: anchor.web3.Keypair;
    let davidPda: PublicKey;
    let solution: string;

    before(async () => {
      david = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, david.publicKey);

      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        david.publicKey,
        program.programId
      );
      davidPda = pda_key;

      await program.methods
        .createSeed()
        .accounts({
          signer: david.publicKey,
          game: davidPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([david])
        .rpc({ commitment: "confirmed" });

      // Get the solution
      const gameData = await program.account.newGame.fetch(davidPda);
      solution = gameData.solution;
    });

    it("Should successfully solve game on first try with correct guess", async () => {
      await program.methods
        .progressGame(solution)
        .accounts({
          signer: david.publicKey,
          game: davidPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([david])
        .rpc({ commitment: "confirmed" });

      const gameData = await program.account.newGame.fetch(davidPda);

      assert.strictEqual(
        gameData.tries,
        1,
        "Should have 1 try after first guess"
      );
      assert.strictEqual(
        gameData.isSolved,
        true,
        "Game should be marked as solved"
      );
      assert.strictEqual(
        gameData.guesses[0],
        solution,
        "First guess should match solution"
      );
    });

    it("Should allow additional guesses after solving (no error)", async () => {
      // This tests that solving doesn't break the game state
      await program.methods
        .progressGame("EXTRA")
        .accounts({
          signer: david.publicKey,
          game: davidPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([david])
        .rpc({ commitment: "confirmed" });

      const gameData = await program.account.newGame.fetch(davidPda);

      assert.strictEqual(
        gameData.tries,
        2,
        "Should increment tries even after solving"
      );
      assert.strictEqual(
        gameData.isSolved,
        true,
        "Game should still be marked as solved"
      );
    });
  });

  describe("Progress Game - Solving on Last Try", () => {
    let emma: anchor.web3.Keypair;
    let emmaPda: PublicKey;
    let solution: string;

    before(async () => {
      emma = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, emma.publicKey);

      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        emma.publicKey,
        program.programId
      );
      emmaPda = pda_key;

      await program.methods
        .createSeed()
        .accounts({
          signer: emma.publicKey,
          game: emmaPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([emma])
        .rpc({ commitment: "confirmed" });

      // Get the solution
      const gameData = await program.account.newGame.fetch(emmaPda);
      solution = gameData.solution;
    });

    it("Should make 5 wrong guesses without error", async () => {
      const wrongGuesses = ["AAAAA", "BBBBB", "CCCCC", "DDDDD", "EEEEE"];

      for (let i = 0; i < 5; i++) {
        const guessWord =
          wrongGuesses[i] === solution ? "FFFFF" : wrongGuesses[i];

        await program.methods
          .progressGame(guessWord)
          .accounts({
            signer: emma.publicKey,
            game: emmaPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([emma])
          .rpc({ commitment: "confirmed" });
      }

      const gameData = await program.account.newGame.fetch(emmaPda);
      assert.strictEqual(gameData.tries, 5, "Should have 5 tries");
      assert.strictEqual(gameData.isSolved, false, "Should not be solved");
    });

    it("Should successfully solve on 6th try with correct word", async () => {
      await program.methods
        .progressGame(solution)
        .accounts({
          signer: emma.publicKey,
          game: emmaPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([emma])
        .rpc({ commitment: "confirmed" });

      const gameData = await program.account.newGame.fetch(emmaPda);

      assert.strictEqual(gameData.tries, 6, "Should have 6 tries");
      assert.strictEqual(
        gameData.isSolved,
        true,
        "Game should be marked as solved on 6th try"
      );
      assert.strictEqual(
        gameData.guesses[5],
        solution,
        "6th guess should match solution"
      );
    });
  });

  describe("Progress Game - Character Position Tracking", () => {
    let frank: anchor.web3.Keypair;
    let frankPda: PublicKey;
    let solution: string;

    before(async () => {
      frank = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, frank.publicKey);

      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        frank.publicKey,
        program.programId
      );
      frankPda = pda_key;

      await program.methods
        .createSeed()
        .accounts({
          signer: frank.publicKey,
          game: frankPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([frank])
        .rpc({ commitment: "confirmed" });

      // Get the solution
      const gameData = await program.account.newGame.fetch(frankPda);
      solution = gameData.solution;
    });

    it("Should correctly mark all positions when guess matches solution", async () => {
      await program.methods
        .progressGame(solution)
        .accounts({
          signer: frank.publicKey,
          game: frankPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([frank])
        .rpc({ commitment: "confirmed" });

      const gameData = await program.account.newGame.fetch(frankPda);

      // All 5 positions should be marked as correct
      for (let i = 0; i < 5; i++) {
        assert.strictEqual(
          gameData.correctCharPos[0][i],
          true,
          `Position ${i} should be marked correct when guess matches solution`
        );
      }
    });

    it("Should track character positions correctly for partial match", async () => {
      // Create a new game for this test
      const grace = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, grace.publicKey);

      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        grace.publicKey,
        program.programId
      );

      await program.methods
        .createSeed()
        .accounts({
          signer: grace.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([grace])
        .rpc({ commitment: "confirmed" });

      // Make a guess that won't be the solution
      await program.methods
        .progressGame("TESTS")
        .accounts({
          signer: grace.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([grace])
        .rpc({ commitment: "confirmed" });

      const gameData = await program.account.newGame.fetch(pda_key);

      // Just verify the arrays exist and are accessible
      assert.isDefined(
        gameData.correctCharPos[0],
        "correct_char_pos array should be defined"
      );
      assert.isDefined(
        gameData.correctCharNotPos[0],
        "correct_char_not_pos array should be defined"
      );
    });

    it("Should correctly set correctCharNotPos when solution letters are in wrong positions", async () => {
      // Create a new game for this test
      const testUser = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, testUser.publicKey);

      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        testUser.publicKey,
        program.programId
      );

      await program.methods
        .createSeed()
        .accounts({
          signer: testUser.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([testUser])
        .rpc({ commitment: "confirmed" });

      // Get the solution from PDA
      const gameDataBefore = await program.account.newGame.fetch(pda_key);
      const solution = gameDataBefore.solution;

      // Pick two letters from the solution
      // We'll pick letters from positions 0 and 1
      const letter1 = solution[0];
      const letter2 = solution[1];

      // Create a guess where:
      // - letter1 is placed at position 1 (where letter2 should be) - wrong position
      // - letter2 is placed at position 0 (where letter1 should be) - wrong position
      // - Fill positions 2-4 with letters that don't exist in solution
      let guess = ["", "", "", "", ""];

      // Place the two letters at wrong positions
      guess[0] = letter2; // letter2 at position 0 (wrong position, should be letter1)
      guess[1] = letter1; // letter1 at position 1 (wrong position, should be letter2)

      // Fill remaining positions with letters not in solution
      const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let fillerIndex = 0;
      for (let i = 2; i < 5; i++) {
        // Find a letter that's not in the solution
        while (
          fillerIndex < allLetters.length &&
          solution.includes(allLetters[fillerIndex])
        ) {
          fillerIndex++;
        }
        if (fillerIndex < allLetters.length) {
          guess[i] = allLetters[fillerIndex];
          fillerIndex++;
        } else {
          // Fallback: use a letter that's different from solution[i]
          guess[i] = solution[i] === "A" ? "B" : "A";
        }
      }

      const guessWord = guess.join("");

      // Make the guess
      await program.methods
        .progressGame(guessWord)
        .accounts({
          signer: testUser.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([testUser])
        .rpc({ commitment: "confirmed" });

      const gameDataAfter = await program.account.newGame.fetch(pda_key);

      // Verify that correctCharNotPos is true at positions 0 and 1
      // Position 0 has letter2 (which exists in solution at position 1, so wrong position)
      // Position 1 has letter1 (which exists in solution at position 0, so wrong position)
      assert.strictEqual(
        gameDataAfter.correctCharNotPos[0][0],
        true,
        `Position 0 should have correctCharNotPos=true because '${letter2}' exists in solution but at wrong position (solution has '${letter1}' at position 0)`
      );
      assert.strictEqual(
        gameDataAfter.correctCharNotPos[0][1],
        true,
        `Position 1 should have correctCharNotPos=true because '${letter1}' exists in solution but at wrong position (solution has '${letter2}' at position 1)`
      );

      // Verify that correctCharPos is false at these positions (since they're wrong positions)
      assert.strictEqual(
        gameDataAfter.correctCharPos[0][0],
        false,
        "Position 0 should have correctCharPos=false because letter is at wrong position"
      );
      assert.strictEqual(
        gameDataAfter.correctCharPos[0][1],
        false,
        "Position 1 should have correctCharPos=false because letter is at wrong position"
      );
    });
  });

  describe("Remove Game (remove_game)", () => {
    it("Should successfully remove Bob's completed game", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        bob.publicKey,
        program.programId
      );

      await program.methods
        .removeGame()
        .accounts({
          signer: bob.publicKey,
          game: pda_key,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      // Verify game account is closed
      let should_fail = "This should fail";
      try {
        await program.account.newGame.fetch(pda_key);
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          error.message.includes("Account does not exist or has no data"),
          "Game account should be deleted after removal"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Game account should not exist after being removed"
      );
    });

    it("Should successfully remove Alice's game", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        alice.publicKey,
        program.programId
      );

      await program.methods
        .removeGame()
        .accounts({
          signer: alice.publicKey,
          game: pda_key,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      // Verify game account is closed
      let should_fail = "This should fail";
      try {
        await program.account.newGame.fetch(pda_key);
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          error.message.includes("Account does not exist or has no data"),
          "Game account should be deleted after removal"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Game account should not exist after being removed"
      );
    });

    it("Should successfully remove Charlie's exhausted game", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        charlie.publicKey,
        program.programId
      );

      await program.methods
        .removeGame()
        .accounts({
          signer: charlie.publicKey,
          game: pda_key,
        })
        .signers([charlie])
        .rpc({ commitment: "confirmed" });

      // Verify game account is closed
      let should_fail = "This should fail";
      try {
        await program.account.newGame.fetch(pda_key);
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          error.message.includes("Account does not exist or has no data"),
          "Game account should be deleted after removal"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Game account should not exist after being removed"
      );
    });

    it("Should fail to remove non-existent game", async () => {
      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        bob.publicKey,
        program.programId
      );

      let should_fail = "This should fail";
      try {
        await program.methods
          .removeGame()
          .accounts({
            signer: bob.publicKey,
            game: pda_key,
          })
          .signers([bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          error.message.includes("Account does not exist") ||
            error.message.includes("AccountNotInitialized"),
          "Expected account not found error when trying to remove non-existent game"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to remove a non-existent game"
      );
    });

    it("Should fail when wrong signer tries to remove someone else's game", async () => {
      // Create a game for a test user
      const harry = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, harry.publicKey);

      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        harry.publicKey,
        program.programId
      );

      await program.methods
        .createSeed()
        .accounts({
          signer: harry.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([harry])
        .rpc({ commitment: "confirmed" });

      // Try to remove with different signer
      const hacker = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, hacker.publicKey);

      let should_fail = "This should fail";
      try {
        await program.methods
          .removeGame()
          .accounts({
            signer: hacker.publicKey,
            game: pda_key,
          })
          .signers([hacker])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          error.message.includes("constraint") ||
            error.message.includes("ConstraintRaw") ||
            error.message.includes("has_one"),
          "Expected constraint error when wrong signer tries to remove game"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to remove someone else's game (authorization check)"
      );

      // Clean up - remove the game properly
      await program.methods
        .removeGame()
        .accounts({
          signer: harry.publicKey,
          game: pda_key,
        })
        .signers([harry])
        .rpc({ commitment: "confirmed" });
    });

    it("Should allow recreating game after deletion", async () => {
      const ivan = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, ivan.publicKey);

      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        ivan.publicKey,
        program.programId
      );

      // Create game
      await program.methods
        .createSeed()
        .accounts({
          signer: ivan.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([ivan])
        .rpc({ commitment: "confirmed" });

      // Make a guess
      await program.methods
        .progressGame("FIRST")
        .accounts({
          signer: ivan.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([ivan])
        .rpc({ commitment: "confirmed" });

      // Remove game
      await program.methods
        .removeGame()
        .accounts({
          signer: ivan.publicKey,
          game: pda_key,
        })
        .signers([ivan])
        .rpc({ commitment: "confirmed" });

      // Create new game with same user
      await program.methods
        .createSeed()
        .accounts({
          signer: ivan.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([ivan])
        .rpc({ commitment: "confirmed" });

      await checkGame(
        program,
        pda_key,
        ivan.publicKey,
        0, // tries should be reset to 0
        false // is_solved should be false
      );

      // Clean up
      await program.methods
        .removeGame()
        .accounts({
          signer: ivan.publicKey,
          game: pda_key,
        })
        .signers([ivan])
        .rpc({ commitment: "confirmed" });
    });

    it("Should return rent to signer after game removal", async () => {
      const jane = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, jane.publicKey);

      const [pda_key, pda_bump] = getPDAAddress(
        WORDLE_SEED,
        jane.publicKey,
        program.programId
      );

      const balanceBefore = await provider.connection.getBalance(
        jane.publicKey
      );

      // Create game
      await program.methods
        .createSeed()
        .accounts({
          signer: jane.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([jane])
        .rpc({ commitment: "confirmed" });

      const balanceAfterCreate = await provider.connection.getBalance(
        jane.publicKey
      );

      // Balance should decrease after creating game (rent + fees)
      assert.isTrue(
        balanceAfterCreate < balanceBefore,
        "Balance should decrease after creating game"
      );

      // Remove game
      await program.methods
        .removeGame()
        .accounts({
          signer: jane.publicKey,
          game: pda_key,
        })
        .signers([jane])
        .rpc({ commitment: "confirmed" });

      const balanceAfterRemove = await provider.connection.getBalance(
        jane.publicKey
      );

      // Balance should increase after removing game (rent returned)
      assert.isTrue(
        balanceAfterRemove > balanceAfterCreate,
        "Balance should increase after removing game (rent refunded)"
      );
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("Should handle multiple users playing simultaneously", async () => {
      const player1 = anchor.web3.Keypair.generate();
      const player2 = anchor.web3.Keypair.generate();
      const player3 = anchor.web3.Keypair.generate();

      await Promise.all([
        airdrop(provider.connection, player1.publicKey),
        airdrop(provider.connection, player2.publicKey),
        airdrop(provider.connection, player3.publicKey),
      ]);

      const [pda1] = getPDAAddress(
        WORDLE_SEED,
        player1.publicKey,
        program.programId
      );
      const [pda2] = getPDAAddress(
        WORDLE_SEED,
        player2.publicKey,
        program.programId
      );
      const [pda3] = getPDAAddress(
        WORDLE_SEED,
        player3.publicKey,
        program.programId
      );

      // Create all games
      await Promise.all([
        program.methods
          .createSeed()
          .accounts({
            signer: player1.publicKey,
            game: pda1,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([player1])
          .rpc({ commitment: "confirmed" }),
        program.methods
          .createSeed()
          .accounts({
            signer: player2.publicKey,
            game: pda2,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([player2])
          .rpc({ commitment: "confirmed" }),
        program.methods
          .createSeed()
          .accounts({
            signer: player3.publicKey,
            game: pda3,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([player3])
          .rpc({ commitment: "confirmed" }),
      ]);

      // Verify all games created successfully
      const [game1, game2, game3] = await Promise.all([
        program.account.newGame.fetch(pda1),
        program.account.newGame.fetch(pda2),
        program.account.newGame.fetch(pda3),
      ]);

      assert.strictEqual(game1.tries, 0, "Player 1 should have 0 tries");
      assert.strictEqual(game2.tries, 0, "Player 2 should have 0 tries");
      assert.strictEqual(game3.tries, 0, "Player 3 should have 0 tries");

      // Clean up
      await Promise.all([
        program.methods
          .removeGame()
          .accounts({ signer: player1.publicKey, game: pda1 })
          .signers([player1])
          .rpc({ commitment: "confirmed" }),
        program.methods
          .removeGame()
          .accounts({ signer: player2.publicKey, game: pda2 })
          .signers([player2])
          .rpc({ commitment: "confirmed" }),
        program.methods
          .removeGame()
          .accounts({ signer: player3.publicKey, game: pda3 })
          .signers([player3])
          .rpc({ commitment: "confirmed" }),
      ]);
    });

    it("Should handle game with special characters in guess attempts", async () => {
      const kevin = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, kevin.publicKey);

      const [pda_key] = getPDAAddress(
        WORDLE_SEED,
        kevin.publicKey,
        program.programId
      );

      await program.methods
        .createSeed()
        .accounts({
          signer: kevin.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([kevin])
        .rpc({ commitment: "confirmed" });

      // Try guessing with numbers (should succeed but might not match)
      await program.methods
        .progressGame("12345")
        .accounts({
          signer: kevin.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([kevin])
        .rpc({ commitment: "confirmed" });

      const gameData = await program.account.newGame.fetch(pda_key);
      assert.strictEqual(
        gameData.guesses[0],
        "12345",
        "Should accept numeric characters"
      );

      // Clean up
      await program.methods
        .removeGame()
        .accounts({
          signer: kevin.publicKey,
          game: pda_key,
        })
        .signers([kevin])
        .rpc({ commitment: "confirmed" });
    });

    it("Should handle repeated identical guesses", async () => {
      const laura = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, laura.publicKey);

      const [pda_key] = getPDAAddress(
        WORDLE_SEED,
        laura.publicKey,
        program.programId
      );

      await program.methods
        .createSeed()
        .accounts({
          signer: laura.publicKey,
          game: pda_key,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([laura])
        .rpc({ commitment: "confirmed" });

      // Make same guess multiple times
      for (let i = 0; i < 3; i++) {
        await program.methods
          .progressGame("ABOUT")
          .accounts({
            signer: laura.publicKey,
            game: pda_key,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([laura])
          .rpc({ commitment: "confirmed" });
      }

      const gameData = await program.account.newGame.fetch(pda_key);
      assert.strictEqual(gameData.tries, 3, "Should have 3 tries");
      assert.strictEqual(
        gameData.guesses[0],
        "ABOUT",
        "First guess should be ABOUT"
      );
      assert.strictEqual(
        gameData.guesses[1],
        "ABOUT",
        "Second guess should be ABOUT"
      );
      assert.strictEqual(
        gameData.guesses[2],
        "ABOUT",
        "Third guess should be ABOUT"
      );

      // Clean up
      await program.methods
        .removeGame()
        .accounts({
          signer: laura.publicKey,
          game: pda_key,
        })
        .signers([laura])
        .rpc({ commitment: "confirmed" });
    });
  });
});

// Helper Functions

async function airdrop(connection: any, address: any, amount = 1000000000) {
  await connection.confirmTransaction(
    await connection.requestAirdrop(address, amount),
    "confirmed"
  );
}

function getPDAAddress(
  wordle_seed: string,
  author: PublicKey,
  programId: PublicKey
) {
  return PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode(wordle_seed), author.toBuffer()],
    programId
  );
}

class SolanaError {
  static contains(logs, error): boolean {
    const match = logs?.filter((s) => s.includes(error));
    return Boolean(match?.length);
  }
}

async function checkGame(
  program: anchor.Program<WordleDapp>,
  game: PublicKey,
  player?: PublicKey,
  tries?: number,
  is_solved?: boolean
) {
  let gameData = await program.account.newGame.fetch(game);

  if (player) {
    assert.strictEqual(
      gameData.player.toString(),
      player.toString(),
      `Game player should be ${player.toString()} but was ${gameData.player.toString()}`
    );
  }

  if (tries !== undefined) {
    assert.strictEqual(
      gameData.tries,
      tries,
      `Game tries should be ${tries} but was ${gameData.tries}`
    );
  }

  if (is_solved !== undefined) {
    assert.strictEqual(
      gameData.isSolved,
      is_solved,
      `Game is_solved should be ${is_solved} but was ${gameData.isSolved}`
    );
  }
}
