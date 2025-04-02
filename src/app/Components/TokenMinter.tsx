"use client";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { mintSPLToken } from "../../utils/solana";
import { Connection, clusterApiUrl } from "@solana/web3.js";

export default function TokenMinter() {
    const wallet = useWallet();
    const [mintAddress, setMintAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    const handleMintToken = async () => {
        if (!wallet.connected) {
            alert("Please connect your wallet first");
            return;
        }

        if (!mintAddress) {
            alert("Please enter a mint address");
            return;
        }

        setLoading(true);
        try {
            const signature = await mintSPLToken(wallet, connection, mintAddress, 1);
            alert(`Tokens Minted! Transaction: ${signature}`);
        } catch (error) {
            console.error("Minting failed:", error);
            alert(`Failed to mint tokens: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 flex flex-col w-1/2 gap-2">
            <input
                type="text"
                placeholder="Mint Address"
                value={mintAddress}
                onChange={(e) => setMintAddress(e.target.value)}
                className="p-2 border w-full rounded text-black"
            />
            <button
                onClick={handleMintToken}
                disabled={loading}
                className="ui-btn p-2 border rounded disabled:opacity-50"
            >
                <span>
                    {loading ? "Minting..." : "Mint Token"}
                </span>
            </button>
        </div>
    );
}