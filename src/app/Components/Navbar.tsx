"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import dynamic from "next/dynamic";

// Dynamically import WalletMultiButton to disable SSR
const DynamicWalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Navbar() {
    const { connected, publicKey } = useWallet();
    const [balance, setBalance] = useState<number | null>(null);
    const [walletInstalled, setWalletInstalled] = useState<boolean>(false);
    const [isMounted, setIsMounted] = useState(false);

    // Check if component is mounted
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Check if a Solana wallet is installed (e.g., Phantom)
    useEffect(() => {
        if (isMounted && typeof window !== "undefined" && window.solana?.isPhantom) {
            setWalletInstalled(true);
        }
    }, [isMounted]);

    // Fetch Solana balance when connected
    useEffect(() => {
        const fetchBalance = async () => {
            if (!publicKey) return;
            try {
                const connection = new Connection("https://api.devnet.solana.com");
                const balanceInLamports = await connection.getBalance(publicKey);
                setBalance(balanceInLamports / LAMPORTS_PER_SOL); // Convert to SOL
            } catch (error) {
                console.error("Error fetching balance:", error);
            }
        };

        if (connected) fetchBalance();
    }, [connected, publicKey]);

    // Handle wallet installation
    const handleInstallWallet = () => {
        window.open("https://phantom.app/", "_blank");
    };

    if (!isMounted) {
        return (
            <nav className="flex sticky flex-row items-center w-full p-4 justify-between bg-[#0f101a] z-10 text-white">
                {/* Simplified version for SSR */}
                <div className="flex items-center gap-2">
                    <p className="text-5xl font-[Logo] font-500 font-semibold">Mintify</p>
                </div>
                <div className="flex flex-row border p-2 items-center gap-6 rounded-md">
                    <p>Balance: N/A</p>
                </div>
            </nav>
        );
    }

    return (
        <nav className="flex flex-row items-center w-full p-4 justify-between bg-[#0f101a] z-10 text-white">
            {/* Logo Section */}
            <div className="flex items-center gap-2 px-5">
                <p className="text-5xl font-semibold">Mintify</p>
            </div>

            {/* Wallet Section */}
            <div className="flex flex-row p-2 items-center gap-6 rounded-md">
                <p>Balance: {connected && balance !== null ? `${balance.toFixed(2)} SOL` : "N/A"}</p>

                {connected ? (
                    <p className="text-sm bg-gray-700 px-3 py-1 rounded-md">
                        {publicKey?.toBase58().slice(0, 6)}...{publicKey?.toBase58().slice(-6)}
                    </p>
                ) : !walletInstalled ? (
                    <button
                        onClick={handleInstallWallet}
                        className="border flex flex-row p-2 gap-2 items-center bg-blue-600 rounded-md hover:bg-blue-500 transition"
                    >
                        <svg fill="#fff" viewBox="0 0 969.486 969.486" width="20" height="20">
                            <g>
                                <g>
                                    <path d="M806.582,235.309L766.137,87.125l-137.434,37.51L571.451,9.072L114.798,235.309H0v725.105h907.137V764.973h62.35v-337.53 h-62.352V235.309H806.582z M718.441,170.63l17.654,64.68h-52.561h-75.887h-126.19l111.159-30.339l66.848-18.245L718.441,170.63z M839.135,892.414H68V522.062v-129.13v-10.233v-69.787v-9.602h35.181h27.538h101.592h409.025h75.889h37.43h35.242h35.244h13.994 v51.272v72.86h-15.357h-35.244h-87.85H547.508h-55.217v27.356v75.888v8.758v35.244v35.244v155.039h346.846v127.441H839.135z M901.486,696.973h-28.352h-34H560.291V591.375v-35.244v-35.244v-23.889v-1.555h3.139h90.086h129.129h56.492h34h4.445h23.904 V696.973z M540.707,100.191l21.15,42.688l-238.955,65.218L540.707,100.191z"></path>
                                    <polygon points="614.146,564.57 614.146,576.676 614.146,631.152 680.73,631.152 680.73,564.57 658.498,564.57"></polygon>
                                </g>
                            </g>
                        </svg>
                        Install Wallet
                    </button>
                ) : null}

                <DynamicWalletMultiButton />
            </div>
        </nav>
    );
}