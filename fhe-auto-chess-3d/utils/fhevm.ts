import { BrowserProvider } from "ethers";

let fheInstance: any = null;

export const initializeFheInstance = async () => {
    if (fheInstance) return fheInstance;

    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('Ethereum provider not found');
    }

    // @ts-ignore
    const sdk = window.RelayerSDK || window.relayerSDK;
    if (!sdk) {
        throw new Error('RelayerSDK not loaded');
    }

    const { initSDK, createInstance, SepoliaConfig } = sdk;

    await initSDK();

    const config = { ...SepoliaConfig, network: window.ethereum };

    try {
        fheInstance = await createInstance(config);
        return fheInstance;
    } catch (err) {
        console.error('FHEVM initialization failed:', err);
        throw err;
    }
};

export const getFheInstance = () => fheInstance;

export const createEncryptedInput = async (
    contractAddress: string, 
    userAddress: string, 
    values: number[]
) => {
    const instance = await initializeFheInstance();
    const inputHandle = instance.createEncryptedInput(contractAddress, userAddress);
    
    // Add all values as euint8 (for hero/item IDs)
    for (const value of values) {
        inputHandle.add8(BigInt(value));
    }
    
    return await inputHandle.encrypt();
};

// Extend Window interface
declare global {
    interface Window {
        ethereum?: any;
        RelayerSDK?: any;
        relayerSDK?: any;
    }
}

