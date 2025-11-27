import { ethers, BrowserProvider, Contract } from 'ethers';
import { createEncryptedInput, createEncryptedResult, getFheInstance, reencrypt } from '../utils/fhevm';
import { Loadout } from '../types';
import deploymentData from '../deployments/AutoChessPrivate.json';

// Contract ABI and address
const CONTRACT_ADDRESS = deploymentData.address;
const CONTRACT_ABI = deploymentData.abi;

export class FheService {
  private contract: Contract | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private provider: BrowserProvider | null = null;
  private isInitialized = false;

  /**
   * Initialize FHE service with wallet connection
   * Note: FHEVM instance should be initialized via FhevmProvider
   */
  private initializing = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializing) {
      // Already initializing, wait a bit and return
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.isInitialized) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 5000); // Timeout after 5s
      });
    }

    this.initializing = true;

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Check if FHEVM instance is initialized
      const instance = getFheInstance();
      if (!instance) {
        throw new Error('FHEVM instance not initialized. Please connect wallet first.');
      }

      // Connect to wallet (getSigner doesn't trigger popup if already connected)
      this.provider = new BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
    const userAddress = await this.signer.getAddress();
    const network = await this.provider.getNetwork();

    console.log('Connected to wallet:', userAddress);
    console.log('Network:', network.chainId.toString());
    console.log('Contract address:', CONTRACT_ADDRESS);

    // Verify network is Sepolia
    if (network.chainId !== BigInt(11155111)) {
      throw new Error(`Please switch to Sepolia testnet (Chain ID: 11155111). Current: ${network.chainId}`);
    }

    // Initialize contract
    this.contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
    
    // Verify contract exists by calling a view function
    try {
      await this.contract.HERO_COUNT();
      console.log('Contract verified at:', CONTRACT_ADDRESS);
    } catch (err) {
      console.error('Contract verification failed:', err);
      throw new Error(`Contract not found at ${CONTRACT_ADDRESS}. Please check deployment.`);
    }

      this.isInitialized = true;
      console.log('FHE Service initialized');
    } finally {
      this.initializing = false;
    }
  }

  /**
   * Create a new match
   */
  async createMatch(opponentAddress: string): Promise<bigint> {
    if (!this.contract || !this.signer) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    const tx = await this.contract.createMatch(opponentAddress);
    const receipt = await tx.wait();

    // Parse MatchCreated event to get match ID
    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }

    // Find MatchCreated event in logs
    // In ethers v6, we can use parseLog or filter by event signature
    let matchId: bigint | null = null;
    let p1: string | null = null;
    let p2: string | null = null;

    for (const log of receipt.logs) {
      try {
        // Try to parse the log as MatchCreated event
        const parsed = this.contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data
        });
        
        if (parsed && parsed.name === 'MatchCreated') {
          matchId = parsed.args.matchId;
          p1 = parsed.args.p1;
          p2 = parsed.args.p2;
          break;
        }
      } catch (err) {
        // Not the event we're looking for, continue
        continue;
      }
    }

    if (matchId === null) {
      throw new Error('MatchCreated event not found in transaction receipt');
    }

    // Verify that caller is p1
    const caller = await this.signer.getAddress();
    console.log('[createMatch] Match created:', {
      matchId: matchId.toString(),
      p1: p1,
      p2: p2,
      caller: caller
    });

    if (p1 && p1.toLowerCase() !== caller.toLowerCase()) {
      console.warn('[createMatch] Warning: Caller is not p1. Caller:', caller, 'P1:', p1);
    }

    return matchId;
  }

  /**
   * Submit encrypted loadout
   */
  async submitLoadout(matchId: bigint, loadout: Loadout): Promise<void> {
    if (!this.contract || !this.signer) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    const userAddress = await this.signer.getAddress();

    // Prepare values: 4 heroes + 4 items
    const values: number[] = [];
    for (let i = 0; i < 4; i++) {
      values.push(loadout[i].heroId ?? 0);
      values.push(loadout[i].itemId ?? 0);
    }

    // Create encrypted input
    const { handles, inputProof } = await createEncryptedInput(
      CONTRACT_ADDRESS,
      userAddress,
      values
    );

    // Submit to contract
    const tx = await this.contract.submitLoadout(
      matchId,
      handles,
      inputProof
    );
    await tx.wait();

    console.log('Loadout submitted successfully');
  }

  /**
   * Submit plain signed result (hpSum1 - hpSum2) computed off-chain
   * Only P1 is allowed to call this (enforced in the contract).
   */
  async submitResultPlain(matchId: bigint, signedResult: number): Promise<void> {
    if (!this.contract || !this.signer) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    const tx = await this.contract.submitResultPlain(matchId, signedResult);
    await tx.wait();

    console.log('[submitResultPlain] Result submitted:', signedResult);
  }

  /**
   * Get plain signed result for a match
   */
  async getResultPlain(matchId: bigint): Promise<number> {
    if (!this.contract) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    const result = await this.contract.getResultPlain(matchId);
    return Number(result);
  }

  /**
   * Get match phase
   */
  async getPhase(matchId: bigint): Promise<number> {
    if (!this.contract) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    return await this.contract.getPhase(matchId);
  }

  /**
   * Check if a player has submitted their loadout
   */
  async hasSubmittedLoadout(matchId: bigint, playerAddress: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Service not initialized. Call initialize() first.');
    }
    
    try {
      return await this.contract.hasSubmittedLoadout(matchId, playerAddress);
    } catch (err: any) {
      console.error('[hasSubmittedLoadout] Error:', err);
      return false;
    }
  }

  /**
   * Get match info (p1, p2, phase)
   */
  async getMatchInfo(matchId: bigint): Promise<{p1: string, p2: string, phase: number, resolved: boolean, p1Submitted?: boolean, p2Submitted?: boolean}> {
    if (!this.contract) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    const matchState = await this.contract.matches(matchId);
    // Convert phase to number (it might be bigint)
    const phase = typeof matchState.phase === 'bigint' ? Number(matchState.phase) : matchState.phase;
    
    // Check if both loadouts are submitted
    let p1Submitted = false;
    let p2Submitted = false;
    try {
      p1Submitted = await this.hasSubmittedLoadout(matchId, matchState.p1);
      p2Submitted = await this.hasSubmittedLoadout(matchId, matchState.p2);
    } catch (err: any) {
      console.error('[getMatchInfo] Error checking loadout submission:', err);
    }
    
    console.log('[getMatchInfo] Match state:', {
      p1: matchState.p1,
      p2: matchState.p2,
      phase: phase,
      resolved: matchState.resolved,
      p1Submitted,
      p2Submitted
    });
    return {
      p1: matchState.p1,
      p2: matchState.p2,
      phase: phase,
      resolved: matchState.resolved,
      p1Submitted,
      p2Submitted
    };
  }


  /**
   * Check if wallet is connected
   */
  async isConnected(): Promise<boolean> {
    return this.isInitialized && this.signer !== null;
  }

  /**
   * Get current user address
   */
  async getAddress(): Promise<string> {
    if (!this.signer) {
      throw new Error('Not connected. Call initialize() first.');
    }
    return await this.signer.getAddress();
  }

  /**
   * Get contract instance
   */
  getContract() {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first.');
    }
    return this.contract;
  }
}

// Export singleton instance
export const fheService = new FheService();

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

