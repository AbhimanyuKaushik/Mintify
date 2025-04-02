"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { useState } from "react";
import { transferSPLToken, getTransactionHistory } from "../../utils/solana";

export default function TokenTransfer() {
    const wallet = useWallet();
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const [loading, setLoading] = useState(false);
    const [mintAddress, setMintAddress] = useState("");
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState(1);
    const [transactions, setTransactions] = useState(getTransactionHistory());

    const handleTransfer = async () => {
        if (!wallet.connected) {
            alert("Please connect your wallet first");
            return;
        }

        if (!mintAddress || !recipient || amount <= 0) {
            alert("Please fill all fields correctly");
            return;
        }

        setLoading(true);
        try {
            const tx = await transferSPLToken(
                wallet,
                connection,
                mintAddress,
                recipient,
                amount
            );

            alert(`Transfer ${tx.status}: ${tx.signature}`);
            setTransactions(getTransactionHistory()); // Refresh history
        } catch (error) {
            console.error("Transfer failed:", error);
            alert(`Transfer failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-4 border rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4">Transfer Tokens</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Token Mint Address</label>
                        <input
                            type="text"
                            value={mintAddress}
                            onChange={(e) => setMintAddress(e.target.value)}
                            className="w-full p-2 border rounded text-black"
                            placeholder="Enter token mint address"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Recipient Address</label>
                        <input
                            type="text"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className="w-full p-2 border rounded text-black"
                            placeholder="Enter recipient wallet address"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Amount</label>
                        <input
                            type="number"
                            value={amount}
                            min="0.01"
                            step="0.01"
                            onChange={(e) => setAmount(parseFloat(e.target.value))}
                            className="w-full p-2 border rounded text-black"
                            placeholder="Enter amount to send"
                        />
                    </div>

                    <button
                        onClick={handleTransfer}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Transferring..." : "Transfer Tokens"}
                    </button>
                </div>
            </div>

            <div className="p-4 border rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4">Transaction History</h2>

                {transactions.length === 0 ? (
                    <p>No transactions yet</p>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((tx, index) => (
                            <div
                                key={index}
                                className={`p-3 border rounded-lg ${tx.status === 'success' ? 'bg-green-50' : 'bg-red-50'}`}
                            >
                                <div className="flex justify-between">
                                    <span className="font-medium">{tx.status === 'success' ? '✅' : '❌'} Transfer</span>
                                    <span className="text-sm">{new Date(tx.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-sm mt-1">Token: {tx.mintAddress.slice(0, 6)}...{tx.mintAddress.slice(-4)}</p>
                                <p className="text-sm">From: {tx.from.slice(0, 6)}...{tx.from.slice(-4)}</p>
                                <p className="text-sm">To: {tx.to.slice(0, 6)}...{tx.to.slice(-4)}</p>
                                <p className="text-sm">Amount: {tx.amount}</p>
                                <a
                                    href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 text-xs hover:underline"
                                >
                                    View on Explorer
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}