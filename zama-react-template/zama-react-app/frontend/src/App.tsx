import { useState, useEffect } from 'react'
import { BrowserProvider, Contract } from 'ethers'
import { createEncryptedInput, getFheInstance, reencrypt } from './utils/fhevm'
import { useFhevm } from './components/FhevmProvider'

import FHECounter from './deployments/FHECounter.json';

const CONTRACT_ADDRESS = FHECounter.address;
const ABI = FHECounter.abi;

function App() {
    const { isInitialized, account, connect, error } = useFhevm();
    const [countHandle, setCountHandle] = useState<bigint | null>(null);
    const [decryptedValue, setDecryptedValue] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isInitialized && account) {
            refreshCount();
        }
    }, [isInitialized, account]);

    const refreshCount = async () => {
        if (!window.ethereum) return;
        try {
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);
            const handle = await contract.getCount();
            console.log("Count handle:", handle);
            setCountHandle(handle);
            // Reset decrypted value when handle changes (optional, keeps UI consistent)
            // setDecryptedValue(null); 
        } catch (error) {
            console.error("Error fetching count:", error);
        }
    };

    const handleDecrypt = async () => {
        if (!countHandle || !account) return;
        setLoading(true);
        try {
            const value = await reencrypt(countHandle, CONTRACT_ADDRESS, account);
            console.log("Decrypted value:", value);
            setDecryptedValue(Number(value));
        } catch (error: any) {
            console.error("Decryption error:", error);
            alert("Decryption failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTransaction = async (type: 'increment' | 'decrement') => {
        const instance = getFheInstance();
        if (!account || !instance) {
            console.error("SDK not initialized or wallet not connected");
            return;
        }

        setLoading(true);
        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);

            const value = 1;
            const { handles, inputProof } = await createEncryptedInput(CONTRACT_ADDRESS, account, value);

            const tx = type === 'increment'
                ? await contract.increment(handles[0], inputProof)
                : await contract.decrement(handles[0], inputProof);

            await tx.wait();
            await refreshCount();
        } catch (error: any) {
            console.error("Transaction error:", error);
            alert("Transaction failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Zama React Template</h1>
            <div>
                <p><strong>Account:</strong> {account || "Not connected"}</p>
                <p><strong>SDK Status:</strong> {isInitialized ? "✅ Initialized" : "❌ Not Initialized"}</p>
                {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            </div>

            {!account && (
                <button onClick={connect}>Connect Wallet</button>
            )}

            {isInitialized && (
                <>
                    <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                        <h2>Encrypted Handle: {countHandle ? countHandle.toString().slice(0, 15) + "..." : 'Loading...'}</h2>

                        <div style={{ marginTop: 10 }}>
                            <h3>Decrypted Value: {decryptedValue !== null ? decryptedValue : '???'}</h3>
                            <button
                                onClick={handleDecrypt}
                                disabled={loading || !countHandle}
                            >
                                🔐 Decrypt / View Value
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={() => handleTransaction('increment')}
                            disabled={loading}
                            style={{ padding: '10px 20px', cursor: loading ? 'not-allowed' : 'pointer' }}
                        >
                            {loading ? "Processing..." : "Increment (+1 Encrypted)"}
                        </button>
                        <button
                            onClick={() => handleTransaction('decrement')}
                            disabled={loading}
                            style={{ padding: '10px 20px', cursor: loading ? 'not-allowed' : 'pointer' }}
                        >
                            {loading ? "Processing..." : "Decrement (-1 Encrypted)"}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

export default App
