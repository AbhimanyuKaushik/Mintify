"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { createSPLToken } from "../../utils/solana";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { useState } from "react";

export default function TokenCreator() {
    const wallet = useWallet();
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const [loading, setLoading] = useState(false);

    const handleCreateToken = async () => {
        if (!wallet.connected) {
            alert("Please connect your wallet first");
            return;
        }

        setLoading(true);
        try {
            const mintAddress = await createSPLToken(wallet, connection);
            alert(`Token Created! Mint Address: ${mintAddress}`);
        } catch (error) {
            console.error("Token creation failed:", error);
            alert(`Failed to create token: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleCreateToken}
            disabled={loading}
            className="ui-btn p-2 rounded disabled:opacity-50"
        >
            <span>
                Create Token
            </span>
        </button>
    );
}