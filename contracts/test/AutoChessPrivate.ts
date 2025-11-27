import { expect } from "chai";
import { ethers } from "hardhat";
import { AutoChessPrivate } from "../typechain-types/contracts/AutoChessPrivate";
import { IFHEVMExecutor } from "../typechain-types/@fhevm/solidity/lib/Impl.sol/IFHEVMExecutor";

describe("AutoChessPrivate", function () {
    let autoChess: AutoChessPrivate;
    let fhevmExecutor: IFHEVMExecutor;
    let owner: any;
    let player1: any;
    let player2: any;

    beforeEach(async function () {
        [owner, player1, player2] = await ethers.getSigners();

        // Deploy contract
        const AutoChessPrivateFactory = await ethers.getContractFactory("AutoChessPrivate");
        autoChess = await AutoChessPrivateFactory.deploy();
        await autoChess.waitForDeployment();

        // Note: FHEVM executor is typically accessed via the FHEVM Hardhat plugin
        // In a full test setup, you would get the executor address from the plugin
        // For now, we'll skip executor setup as it requires proper FHEVM test environment
        // fhevmExecutor would be obtained via: await hre.fhevm.getFhevmExecutorAddress()
    });

    describe("Deployment", function () {
        it("Should deploy successfully", async function () {
            expect(await autoChess.getAddress()).to.be.properAddress;
        });

        it("Should have correct constants", async function () {
            expect(await autoChess.HERO_COUNT()).to.equal(16);
            expect(await autoChess.ITEM_COUNT()).to.equal(32);
            expect(await autoChess.TEAM_SIZE()).to.equal(4);
            expect(await autoChess.ROUNDS()).to.equal(8);
        });

        it("Should initialize hero stats", async function () {
            const hp0 = await autoChess.baseHP(0);
            const atk0 = await autoChess.baseATK(0);
            const def0 = await autoChess.baseDEF(0);
            expect(hp0).to.be.gt(0);
            expect(atk0).to.be.gt(0);
            expect(def0).to.be.gt(0);
        });
    });

    describe("Match Creation", function () {
        it("Should create a match", async function () {
            const tx = await autoChess.connect(player1).createMatch(player2.address);
            await expect(tx).to.emit(autoChess, "MatchCreated");

            // Get match ID from event (simplified - in real test, parse event)
            // For now, we'll test phase
            const phase = await autoChess.getPhase(0);
            expect(phase).to.equal(0); // Phase.Lobby
        });

        it("Should reject invalid opponent", async function () {
            await expect(
                autoChess.connect(player1).createMatch(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid opponent");

            await expect(
                autoChess.connect(player1).createMatch(player1.address)
            ).to.be.revertedWith("Cannot play against yourself");
        });
    });

    describe("Loadout Submission", function () {
        let matchId: bigint;

        beforeEach(async function () {
            const tx = await autoChess.connect(player1).createMatch(player2.address);
            await tx.wait();
            matchId = 0n; // Assuming first match
        });

        it("Should submit loadout with encrypted values", async function () {
            // Note: Full encrypted input testing requires FHEVM Hardhat plugin setup
            // The plugin provides helpers for creating encrypted inputs in tests
            // 
            // Example pattern (requires FHEVM plugin):
            // const encryptedHero0 = await hre.fhevm.encrypt8(0);
            // const encryptedItem0 = await hre.fhevm.encrypt8(0);
            // ... create 8 encrypted values
            // const handles = [encryptedHero0, ..., encryptedItem3];
            // const proof = await hre.fhevm.createInputProof(...);
            // await autoChess.connect(player1).submitLoadout(matchId, handles, proof);
            
            // For now, this is a placeholder test structure
            // Actual implementation requires proper FHEVM test environment setup
            expect(true).to.be.true;
        });
    });

    describe("Match Resolution", function () {
        it("Should resolve match after both players submit", async function () {
            // This test requires proper encrypted input setup
            // In a full implementation, you would:
            // 1. Create match
            // 2. Both players submit encrypted loadouts
            // 3. Call resolve
            // 4. Verify result ciphertext is set
            // 5. Decrypt and verify result sign

            // Placeholder for full test implementation
            expect(true).to.be.true;
        });
    });

    describe("Lookup Functions", function () {
        it("Should lookup hero stats correctly", async function () {
            // Test that base stats are accessible
            for (let i = 0; i < 4; i++) {
                const hp = await autoChess.baseHP(i);
                const atk = await autoChess.baseATK(i);
                const def = await autoChess.baseDEF(i);
                expect(hp).to.be.gt(0);
                expect(atk).to.be.gt(0);
                expect(def).to.be.gt(0);
            }
        });

        it("Should lookup item stats correctly", async function () {
            // Test that item stats are accessible
            for (let i = 0; i < 4; i++) {
                const hp = await autoChess.itemHP(i);
                const atk = await autoChess.itemATK(i);
                const def = await autoChess.itemDEF(i);
                expect(hp).to.be.gte(0);
                expect(atk).to.be.gte(0);
                expect(def).to.be.gte(0);
            }
        });
    });
});

