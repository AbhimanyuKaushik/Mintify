"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { useEffect, useState } from "react";

export default function TokenList() {
    const { publicKey } = useWallet();
    const [tokens, setTokens] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null); // State for clipboard feedback
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    const fetchTokens = async () => {
        if (!publicKey) return;

        setLoading(true);
        try {
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                publicKey,
                { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
            );

            const mintAddresses = tokenAccounts.value
                .map(account => ({
                    mintAddress: account.account.data.parsed.info.mint,
                    amount: account.account.data.parsed.info.tokenAmount.uiAmount,
                    decimals: account.account.data.parsed.info.tokenAmount.decimals
                }))
                .filter(token => token.amount > 0);

            setTokens(mintAddresses);
        } catch (error) {
            console.error("Error fetching tokens:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTokens();
    }, [publicKey]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(null), 2000); // Reset copied state after 2 sec
    };

    return (
        <div className="p-6 w-full gap-5 flex flex-col items-center justify-center mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg">
            {tokens.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300 text-center">
                    No tokens found. Create or receive some tokens to see them here.
                </p>
            ) : (
                <div className="space-y-4  w-1/2">
                    {tokens.map((token, index) => (
                        <div
                            key={index}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg 
                                       bg-gray-50 dark:bg-gray-800 hover:shadow-md transition-all duration-300"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-gray-200">
                                        Token #{index + 1}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Amount: <span className="font-semibold">{token.amount}</span>
                                        {" "} (Decimals: {token.decimals})
                                    </p>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(token.mintAddress)}
                                    className="px-3 py-1 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-300 
                                               rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300"
                                >
                                    {copied === token.mintAddress ? "Copied!" : "Copy"}
                                </button>
                            </div>
                            <p className="mt-2 text-sm break-all font-mono text-gray-700 dark:text-gray-400">
                                {token.mintAddress}
                            </p>
                        </div>
                    ))}
                </div>
            )}
            <button
                onClick={fetchTokens}
                disabled={loading}
                className="ui-btn mb-4 w-1/2 px-4 py-2 font-semibold bg-gray-600 text-white rounded-lg transition-all duration-300 
                           hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span>
                    {loading ? "Refreshing..." : "Refresh Tokens"}
                </span>
            </button>
        </div>

    );
}
