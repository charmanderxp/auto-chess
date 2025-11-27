# FHE Auto-Chess 3D – Encrypted Loadouts on Zama FHEVM

Private auto-chess prototype where:

- **Loadouts (4 hero + 4 item IDs) are encrypted with FHE** on Sepolia (Zama FHEVM).
- Combat logic runs **off-chain** (frontend), and P1 submits a **plain signed result** on-chain.
- Both P1 and P2 read the **same on-chain result**, while the 3D scene is purely for **replay and visualization**

The system includes:

- Smart contract `AutoChessPrivate.sol` (Hardhat + FHEVM libraries).
- Frontend `fhe-auto-chess-3d` (Vite + React + ethers v6 + Three.js).
- FHE Relayer SDK in the browser to encrypt loadouts.

---

## 1. Contract & Deployment

### Contract address (Sepolia)

- **AutoChessPrivate (Sepolia)**: `0x337955b861C54901820589D46efb59711391ce0D`

The frontend reads the contract ABI & address from:

- `fhe-auto-chess-3d/deployments/AutoChessPrivate.json`

### Main contract structure

File: `contracts/contracts/AutoChessPrivate.sol`

- `createMatch(address opponent) returns (uint256 matchId)`
  - Creates a new match, caller is **P1**, `opponent` is **P2**.
  - Stores `matches[matchId] = { p1, p2, phase = Lobby }`.
  - Emit `MatchCreated(matchId, p1, p2)`.

- `submitLoadout(uint256 matchId, externalEuint8[] handles, bytes inputProof)`
  - Called by P1 or P2, sending 8 euint8 handles (4 heroes + 4 items).
  - `FHE.fromExternal` → stores encrypted loadout in `loadouts[matchId][msg.sender]`.
  - When **both** players have submitted: `phase = Phase.Submitted`.

- `hasSubmittedLoadout(uint256 matchId, address player) external view returns (bool)`
  - Quick submission check per player (used for frontend polling).

- `submitResultPlain(uint256 matchId, int16 signedResult)`
  - Called by **P1** when `phase == Submitted`.
  - `signedResult = hpSum1 - hpSum2` (computed off-chain).
  - Stores plain `resultSigned`, sets `phase = Resolved`, `resolved = true`.
  - Emits `MatchResolved(matchId, signedResult, msg.sender)`.

- `getResultPlain(uint256 matchId) external view returns (int16)`
  - Returns `resultSigned` once the match is resolved.

> FHE combat on-chain (`simulate`) still exists but is **not used** due to FHEVM constraints on Sepolia.  
> FHE is currently used for **input privacy** (encrypted loadouts), while the result is plain on-chain.

### Build & deploy contract

```bash
cd contracts
npm install
npx hardhat compile

# Deploy to Sepolia (MetaMask / private key must be configured in hardhat.config)
npx hardhat run scripts/deploy.ts --network sepolia
```

After deployment, if the contract address changes, make sure to:

- Update `fhe-auto-chess-3d/deployments/AutoChessPrivate.json`.
- Update the “Contract address” section above (if needed).

---

## 2. Frontend – `fhe-auto-chess-3d`

Main entry: `fhe-auto-chess-3d/App.tsx`

- **Live demo (Vercel)**: [https://auto-chess-eosin.vercel.app/](https://auto-chess-eosin.vercel.app/)

### Install & run

```bash
cd fhe-auto-chess-3d
npm install
npm run dev   # Vite dev server, typically http://localhost:3001
```

Requirements:

- Browser with MetaMask, connected to **Sepolia (chainId 11155111)**.
- FHE Relayer SDK loaded via `<script>` in `index.html` (per Zama docs).

### FhevmProvider & FHE Service

- `components/FhevmProvider.tsx`
  - Initializes the FHEVM instance from `window.RelayerSDK`.
  - Checks current network and exposes `isInitialized`, `account`, `connect()` to the app.

- `services/fheService.ts`
  - Wraps `BrowserProvider` + `ethers.Contract`.
  - Main methods:
    - `createMatch(opponentAddress)`
    - `submitLoadout(matchId, loadout)` → uses `createEncryptedInput` (Relayer SDK).
    - `getMatchInfo(matchId)` → `{ p1, p2, phase, resolved, p1Submitted, p2Submitted }`.
    - `submitResultPlain(matchId, signedResult)`.
    - `getResultPlain(matchId)`.

---

## 3. Game Flow

### 3.1 Create & join a match

1. **P1**:
   - In `LOBBY`: enter opponent address (P2) → click **CREATE MATCH**.
   - Receives `matchId`, switches to `MATCH_LOBBY` showing P1/P2 addresses.

2. **P2**:
   - In `LOBBY`: enter `matchId` → click **JOIN**.
   - If P2 matches `matches[matchId].p2`, they enter `MATCH_LOBBY`.

### 3.2 Configure loadout (Encrypted Loadout)

Component: `components/LoadoutEditor.tsx`

- Each `Unit` has:
  - Hero dropdown (`HEROES[0..15]`).
  - Item dropdown (`ITEMS[0..31]`).
  - Hero preview image: `public/models/0.png` → `15.png`  
    (rendered with `<img src="/models/{heroId}.png" />`).
- Once all 4 slots are complete, click **Encrypt & Submit**:
  - Frontend:
    - Calls `createEncryptedInput(contractAddress, userAddress, [heroIds + itemIds])`.
  - Contract:
    - Receives handles + proof → `submitLoadout`.
    - When both P1 & P2 have submitted → `phase = Submitted`.

### 3.3 Resolve & view result

When `phase === Submitted`:

1. **P1** clicks **RESOLVE MATCH**:
   - Frontend:
     - Runs mock combat off-chain via `simulateMatch(loadout, randomOpponentLoadout)` to generate a 3D log.
     - Computes `localSigned = hpSum1 - hpSum2` (sign based on winner).
     - Calls `submitResultPlain(matchId, localSigned)`.
   - Contract:
     - Stores `resultSigned = localSigned`, sets `phase = Resolved`.

2. **P2** clicks **RESOLVE MATCH** (after P1 resolved):
   - Calls `getResultPlain(matchId)` → gets the same `signedResult` from chain.
   - Both P1 & P2 use `signedResult` to derive:
     - `winner` (`0 = P1`, `1 = P2`, `-1 = draw`).
     - `margin = |signedResult|`.

UI:

- `StatusPanel`:
  - Shows `VICTORY/DEFEAT`, margin, winner, and whether you are P1 or P2.
  - Displays **On-chain result** label when using `getResultPlain`.
- `App.tsx`:
  - Polls `getMatchInfo` to update phase & submission status.
  - Blocks P2 from resolving before P1 submits the official result (shows “wait for P1” instead of falling back to mock).

---

## 4. 3D Battle Scene

File: `fhe-auto-chess-3d/components/BattleScene.tsx`

- Tech:
  - `@react-three/fiber`, `@react-three/drei`.
- Main features:
  - Each hero on your side (`owner === 0`) loads a GLB from:
    - `public/models/heroes/Unit-XX.glb` (mapped from `HEROES[heroId].name`).
  - The enemy side uses a shared `public/models/enemy/Enemy-Encrypted.glb`, cloned per unit.
  - Idle animation (hover + subtle tilt), lunge on attack, shake on hit, fall over on death.
  - Cyber arena:
    - Neon grid (`Grid`), starry sky (`Stars`).
    - Two large halo rings under each half of the board (green / orange).
    - Four hologram pillars in the corners with slowly rotating rings.

You can switch between showing the enemy’s real models vs. a generic encrypted model by:

- Using `HeroModel` for both `owner === 0` and `owner === 1` (full loadout visible).
- Or keeping `EnemyModel` for `owner === 1` to hide the opponent’s composition.

---

## 5. Extensibility & customization

- To change hero models:
  - Drop new GLBs into `public/models/heroes/Unit-XX.glb`.
  - Keep the pivot at the feet, facing +Z, around 2 units tall.
- To change the enemy skin:
  - Replace `public/models/enemy/Enemy-Encrypted.glb`.
- To re-enable full FHE on-chain results:
  - You would need to optimize `simulate` and re-integrate the `resolve + getResult` FHE flow with the Relayer SDK (currently disabled due to Sepolia constraints).

---

## 6. Security / limitations

- This is a **demo prototype**:
  - No anti-cheat on off-chain combat (P1 can theoretically submit any `signedResultPlain`).
  - No dispute or verification mechanism for the combat log.
- For production:
  - You’d want FHEVM/zk infrastructure strong enough to run combat on-chain or verify an off-chain combat proof.
  - Add rate limiting, fees, and anti-spam / match-making logic.

---

