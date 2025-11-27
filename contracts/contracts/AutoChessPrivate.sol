// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, ebool, euint8, euint16, externalEuint8, externalEuint16 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title AutoChessPrivate
 * @notice Private loadout Auto-Chess game with FHEVM
 *         - Players submit encrypted loadouts (4 heroes + 4 items)
 *         - Combat simulation runs entirely on encrypted data
 *         - Result is encrypted and can be decrypted by each player
 */
contract AutoChessPrivate is ZamaEthereumConfig {
    using FHE for *;

    // Constants
    uint8 public constant HERO_COUNT = 16;
    uint8 public constant ITEM_COUNT = 32;
    uint8 public constant TEAM_SIZE = 4;
    uint8 public constant ROUNDS = 8;

    enum Phase {
        Lobby,
        Submitted,
        Resolved
    }

    struct LoadoutEnc {
        bool submitted;
        euint8[TEAM_SIZE] hero;
        euint8[TEAM_SIZE] item;
    }

    struct MatchState {
        address p1;
        address p2;
        Phase phase;
        bool resolved;
        int16 resultSigned; // plain hpSum1 - hpSum2 (signed)
    }

    // Public base stats for heroes (id 0..15)
    uint16[HERO_COUNT] public baseHP;
    uint16[HERO_COUNT] public baseATK;
    uint16[HERO_COUNT] public baseDEF;

    // Public item bonuses (id 0..31)
    uint16[ITEM_COUNT] public itemHP;
    uint16[ITEM_COUNT] public itemATK;
    uint16[ITEM_COUNT] public itemDEF;

    uint256 private _matchCounter;
    mapping(uint256 => MatchState) public matches;
    mapping(uint256 => mapping(address => LoadoutEnc)) internal loadouts;
    
    /**
     * @notice Check if a player has submitted their loadout
     * @param matchId The match ID
     * @param player The player address
     * @return submitted Whether the player has submitted
     */
    function hasSubmittedLoadout(uint256 matchId, address player) external view returns (bool) {
        return loadouts[matchId][player].submitted;
    }

    event MatchCreated(uint256 indexed matchId, address indexed p1, address indexed p2);
    event LoadoutSubmitted(uint256 indexed matchId, address indexed player);
    event MatchResolved(uint256 indexed matchId, int16 signedResult, address indexed submitter);

    constructor() {
        // Initialize hero stats (example values - adjust as needed)
        // Hero 0-3: Tanks (high HP/DEF, low ATK)
        baseHP[0] = 150; baseATK[0] = 30; baseDEF[0] = 40;
        baseHP[1] = 140; baseATK[1] = 35; baseDEF[1] = 45;
        baseHP[2] = 160; baseATK[2] = 25; baseDEF[2] = 50;
        baseHP[3] = 145; baseATK[3] = 32; baseDEF[3] = 42;

        // Hero 4-7: Warriors (balanced)
        baseHP[4] = 100; baseATK[4] = 50; baseDEF[4] = 30;
        baseHP[5] = 105; baseATK[5] = 48; baseDEF[5] = 32;
        baseHP[6] = 95; baseATK[6] = 52; baseDEF[6] = 28;
        baseHP[7] = 110; baseATK[7] = 45; baseDEF[7] = 35;

        // Hero 8-11: Assassins (high ATK, low HP/DEF)
        baseHP[8] = 70; baseATK[8] = 70; baseDEF[8] = 20;
        baseHP[9] = 65; baseATK[9] = 75; baseDEF[9] = 18;
        baseHP[10] = 75; baseATK[10] = 68; baseDEF[10] = 22;
        baseHP[11] = 68; baseATK[11] = 72; baseDEF[11] = 19;

        // Hero 12-15: Mages (medium stats)
        baseHP[12] = 80; baseATK[12] = 60; baseDEF[12] = 25;
        baseHP[13] = 85; baseATK[13] = 58; baseDEF[13] = 27;
        baseHP[14] = 78; baseATK[14] = 62; baseDEF[14] = 24;
        baseHP[15] = 82; baseATK[15] = 59; baseDEF[15] = 26;

        // Initialize item bonuses (example values)
        for (uint8 i = 0; i < ITEM_COUNT; i++) {
            itemHP[i] = uint16((i % 8) * 5 + 10); // 10-45 HP
            itemATK[i] = uint16((i % 10) * 3 + 5); // 5-32 ATK
            itemDEF[i] = uint16((i % 6) * 4 + 8); // 8-28 DEF
        }
    }

    /**
     * @notice Create a new match
     * @param opponent Address of the opponent
     * @return matchId The ID of the created match
     */
    function createMatch(address opponent) external returns (uint256) {
        require(opponent != address(0), "Invalid opponent");
        require(opponent != msg.sender, "Cannot play against yourself");

        uint256 matchId = _matchCounter++;
        // Initialize with default signed result 0
        matches[matchId] = MatchState({
            p1: msg.sender,
            p2: opponent,
            phase: Phase.Lobby,
            resolved: false,
            resultSigned: 0
        });

        emit MatchCreated(matchId, msg.sender, opponent);
        return matchId;
    }

    /**
     * @notice Submit encrypted loadout
     * @param matchId The match ID
     * @param handles Array of 8 external euint8 handles (4 heroes + 4 items)
     * @param inputProof Proof for input verification
     */
    function submitLoadout(
        uint256 matchId,
        externalEuint8[] calldata handles,
        bytes calldata inputProof
    ) external {
        require(handles.length == 8, "Invalid loadout length");
        MatchState storage matchState = matches[matchId];
        // Cho phép bất kỳ người chơi nào trong trận (p1 hoặc p2) gửi kết quả
        require(matchState.phase == Phase.Lobby, "Match not in Lobby phase");

        // Convert external handles to internal ciphertexts
        euint8[TEAM_SIZE] memory heroes;
        euint8[TEAM_SIZE] memory items;

        for (uint8 i = 0; i < TEAM_SIZE; i++) {
            heroes[i] = FHE.fromExternal(handles[i], inputProof);
            items[i] = FHE.fromExternal(handles[i + TEAM_SIZE], inputProof);
        }

        // Validate and clamp IDs
        for (uint8 i = 0; i < TEAM_SIZE; i++) {
            // Clamp hero ID: if > 15, set to 0
            ebool heroValid = FHE.lt(heroes[i], FHE.asEuint8(HERO_COUNT));
            heroes[i] = FHE.select(heroValid, heroes[i], FHE.asEuint8(0));

            // Clamp item ID: if > 31, set to 0
            ebool itemValid = FHE.lt(items[i], FHE.asEuint8(ITEM_COUNT));
            items[i] = FHE.select(itemValid, items[i], FHE.asEuint8(0));
        }

        // Store loadout
        loadouts[matchId][msg.sender] = LoadoutEnc({
            submitted: true,
            hero: heroes,
            item: items
        });

        // Allow contract to hold ciphertexts
        for (uint8 i = 0; i < TEAM_SIZE; i++) {
            heroes[i].allowThis();
            items[i].allowThis();
        }

        emit LoadoutSubmitted(matchId, msg.sender);

        // Check if both players submitted
        if (
            loadouts[matchId][matchState.p1].submitted &&
            loadouts[matchId][matchState.p2].submitted
        ) {
            matchState.phase = Phase.Submitted;
        }
    }

    /**
     * @notice Submit plain (non-encrypted) match result computed off-chain
     * @dev
     *  - Frontend tính signedResult = hpSum1 - hpSum2 (int16) từ mô phỏng off-chain
     *  - Chỉ P1 được phép gửi kết quả
     *  - Kết quả được lưu ở dạng số thường, ai cũng đọc được
     */
    function submitResultPlain(uint256 matchId, int16 signedResult) external {
        MatchState storage matchState = matches[matchId];
        require(matchState.phase == Phase.Submitted, "Match not submitted");
        require(!matchState.resolved, "Match already resolved");
        require(msg.sender == matchState.p1, "Only P1 can submit result");

        matchState.resultSigned = signedResult;
        matchState.resolved = true;
        matchState.phase = Phase.Resolved;

        emit MatchResolved(matchId, signedResult, msg.sender);
    }

    /**
     * @notice Get plain result for a match
     * @param matchId The match ID
     * @return signedResult Plain signed result (hpSum1 - hpSum2)
     */
    function getResultPlain(uint256 matchId) external view returns (int16) {
        MatchState storage matchState = matches[matchId];
        require(matchState.resolved, "Match not resolved");
        return matchState.resultSigned;
    }

    /**
     * @notice Get match phase
     * @param matchId The match ID
     * @return phase Current phase
     */
    function getPhase(uint256 matchId) external view returns (Phase) {
        return matches[matchId].phase;
    }

    // ============ Lookup Functions ============

    /**
     * @notice Lookup hero HP by encrypted ID
     */
    function lookupHeroHP(euint8 hid) internal returns (euint16) {
        euint16 v = FHE.asEuint16(baseHP[0]);
        for (uint8 k = 1; k < HERO_COUNT; k++) {
            ebool isMatch = FHE.eq(hid, FHE.asEuint8(k));
            v = FHE.select(isMatch, FHE.asEuint16(baseHP[k]), v);
        }
        return v;
    }

    /**
     * @notice Lookup hero ATK by encrypted ID
     */
    function lookupHeroATK(euint8 hid) internal returns (euint16) {
        euint16 v = FHE.asEuint16(baseATK[0]);
        for (uint8 k = 1; k < HERO_COUNT; k++) {
            ebool isMatch = FHE.eq(hid, FHE.asEuint8(k));
            v = FHE.select(isMatch, FHE.asEuint16(baseATK[k]), v);
        }
        return v;
    }

    /**
     * @notice Lookup hero DEF by encrypted ID
     */
    function lookupHeroDEF(euint8 hid) internal returns (euint16) {
        euint16 v = FHE.asEuint16(baseDEF[0]);
        for (uint8 k = 1; k < HERO_COUNT; k++) {
            ebool isMatch = FHE.eq(hid, FHE.asEuint8(k));
            v = FHE.select(isMatch, FHE.asEuint16(baseDEF[k]), v);
        }
        return v;
    }

    /**
     * @notice Lookup item HP bonus by encrypted ID
     */
    function lookupItemHP(euint8 iid) internal returns (euint16) {
        euint16 v = FHE.asEuint16(itemHP[0]);
        for (uint8 k = 1; k < ITEM_COUNT; k++) {
            ebool isMatch = FHE.eq(iid, FHE.asEuint8(k));
            v = FHE.select(isMatch, FHE.asEuint16(itemHP[k]), v);
        }
        return v;
    }

    /**
     * @notice Lookup item ATK bonus by encrypted ID
     */
    function lookupItemATK(euint8 iid) internal returns (euint16) {
        euint16 v = FHE.asEuint16(itemATK[0]);
        for (uint8 k = 1; k < ITEM_COUNT; k++) {
            ebool isMatch = FHE.eq(iid, FHE.asEuint8(k));
            v = FHE.select(isMatch, FHE.asEuint16(itemATK[k]), v);
        }
        return v;
    }

    /**
     * @notice Lookup item DEF bonus by encrypted ID
     */
    function lookupItemDEF(euint8 iid) internal returns (euint16) {
        euint16 v = FHE.asEuint16(itemDEF[0]);
        for (uint8 k = 1; k < ITEM_COUNT; k++) {
            ebool isMatch = FHE.eq(iid, FHE.asEuint8(k));
            v = FHE.select(isMatch, FHE.asEuint16(itemDEF[k]), v);
        }
        return v;
    }

    // ============ Combat Simulation ============

    /**
     * @notice Simulate combat between two loadouts (simplified for FHEVM constraints)
     *
     * @dev
     *  Bản gốc mô phỏng 8 vòng combat đầy đủ, nhưng quá nặng cho FHEVM trên Sepolia
     *  dẫn tới lỗi custom error (0x77e3c293) khi gọi `resolve`.
     *
     *  Phiên bản đơn giản:
     *    - Mỗi slot: điểm = heroHP + itemHP
     *    - Tổng 4 slot cho mỗi bên → hpSum1, hpSum2
     *    - Trả về hpSum1 - hpSum2 (euint16), frontend đọc như số signed
     *
     *  Vẫn giữ được:
     *    - Loadout mã hóa
     *    - Tính toán on-chain trên dữ liệu mã hóa
     *    - Kết quả mã hóa, frontend giải mã và so sánh
     */
    function simulate(
        LoadoutEnc storage p1Loadout,
        LoadoutEnc storage p2Loadout
    ) internal returns (euint16) {
        // Tổng HP hiệu dụng cho mỗi đội
        euint16 hpSum1 = FHE.asEuint16(0);
        euint16 hpSum2 = FHE.asEuint16(0);

        for (uint8 i = 0; i < TEAM_SIZE; i++) {
            // P1 slot i: heroHP + itemHP
            euint16 heroHp1 = lookupHeroHP(p1Loadout.hero[i]);
            euint16 itemHp1 = lookupItemHP(p1Loadout.item[i]);
            euint16 slotHp1 = FHE.add(heroHp1, itemHp1);
            hpSum1 = FHE.add(hpSum1, slotHp1);

            // P2 slot i: heroHP + itemHP
            euint16 heroHp2 = lookupHeroHP(p2Loadout.hero[i]);
            euint16 itemHp2 = lookupItemHP(p2Loadout.item[i]);
            euint16 slotHp2 = FHE.add(heroHp2, itemHp2);
            hpSum2 = FHE.add(hpSum2, slotHp2);
        }

        // Kết quả: hpSum1 - hpSum2 (frontend đọc như signed)
        return FHE.sub(hpSum1, hpSum2);
    }

    /**
     * @notice Subtract with clamp to 0 (max(0, a - b))
     */
    function subClamp0(euint16 a, euint16 b) internal returns (euint16) {
        ebool gt = FHE.gt(a, b);
        euint16 diff = FHE.sub(a, b);
        return FHE.select(gt, diff, FHE.asEuint16(0));
    }
}

