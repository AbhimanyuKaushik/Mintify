import {
    Connection,
    PublicKey,
    Keypair,
    SystemProgram,
    Transaction,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";
import {
    createInitializeMintInstruction,
    createAssociatedTokenAccountInstruction,
    createMintToCheckedInstruction,
    createTransferCheckedInstruction,
    getAssociatedTokenAddress,
    getAccount,
    TOKEN_PROGRAM_ID,
    MINT_SIZE,
} from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";

// Interface for transaction history
export interface TokenTransaction {
    signature: string;
    mintAddress: string;
    from: string;
    to: string;
    amount: number;
    timestamp: number;
    status: 'success' | 'failed';
    type: 'mint' | 'transfer' | 'create';
}

// Store transactions in memory (replace with database in production)
const transactionHistory: TokenTransaction[] = [];

async function checkTransactionStatus(connection: Connection, signature: string, timeout = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const status = await connection.getSignatureStatus(signature);

        if (status.value?.confirmationStatus === "confirmed") {
            return true;
        }

        if (status.value?.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000)); // Check every 2 seconds
    }

    throw new Error(`Transaction not confirmed within ${timeout / 1000} seconds`);
}

function recordTransaction(tx: TokenTransaction) {
    transactionHistory.unshift(tx); // Add to beginning of array
    // In a real app, you'd also save to localStorage or a database here
}

export const createSPLToken = async (
    wallet: WalletContextState,
    connection: Connection
): Promise<string> => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
        throw new Error("Wallet not connected or doesn't support transactions");
    }

    const mintKeypair = Keypair.generate();
    const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
            mintKeypair.publicKey,
            9,
            wallet.publicKey,
            wallet.publicKey
        )
    );

    const signature = await wallet.sendTransaction(transaction, connection, {
        signers: [mintKeypair],
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
    });

    try {
        await checkTransactionStatus(connection, signature);

        recordTransaction({
            signature,
            mintAddress: mintKeypair.publicKey.toString(),
            from: wallet.publicKey.toString(),
            to: '',
            amount: 0,
            timestamp: Date.now(),
            status: 'success',
            type: 'create'
        });

        return mintKeypair.publicKey.toString();
    } catch (error) {
        let errorMessage = `Failed to confirm token creation: ${error instanceof Error ? error.message : String(error)}`;
        if (error instanceof Error && error.message.includes("signature")) {
            errorMessage += `\n\nCheck transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`;
        }
        throw new Error(errorMessage);
    }
};

export const mintSPLToken = async (
    wallet: WalletContextState,
    connection: Connection,
    mintAddress: string,
    amount: number
): Promise<string> => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
        throw new Error("Wallet not connected or doesn't support transactions");
    }

    const mintPubkey = new PublicKey(mintAddress);
    const associatedToken = await getAssociatedTokenAddress(
        mintPubkey,
        wallet.publicKey
    );

    const accountInfo = await connection.getAccountInfo(associatedToken);
    const transaction = new Transaction();

    if (!accountInfo) {
        transaction.add(
            createAssociatedTokenAccountInstruction(
                wallet.publicKey,
                associatedToken,
                wallet.publicKey,
                mintPubkey
            )
        );
    }

    transaction.add(
        createMintToCheckedInstruction(
            mintPubkey,
            associatedToken,
            wallet.publicKey,
            amount * (10 ** 9),
            9
        )
    );

    const signature = await wallet.sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
    });

    try {
        await checkTransactionStatus(connection, signature);

        recordTransaction({
            signature,
            mintAddress,
            from: wallet.publicKey.toString(),
            to: wallet.publicKey.toString(), // Minting to self
            amount,
            timestamp: Date.now(),
            status: 'success',
            type: 'mint'
        });

        return signature;
    } catch (error) {
        let errorMessage = `Failed to confirm minting: ${error instanceof Error ? error.message : String(error)}`;
        if (error instanceof Error && error.message.includes("signature")) {
            errorMessage += `\n\nCheck transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`;
        }
        throw new Error(errorMessage);
    }
};

export const transferSPLToken = async (
    wallet: WalletContextState,
    connection: Connection,
    mintAddress: string,
    recipientAddress: string,
    amount: number
): Promise<TokenTransaction> => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
        throw new Error("Wallet not connected or doesn't support transactions");
    }

    try {
        const mintPubkey = new PublicKey(mintAddress);
        const recipientPubkey = new PublicKey(recipientAddress);

        const senderTokenAccount = await getAssociatedTokenAddress(
            mintPubkey,
            wallet.publicKey
        );

        const recipientTokenAccount = await getAssociatedTokenAddress(
            mintPubkey,
            recipientPubkey
        );

        // Check if recipient token account exists, create if not
        let transaction = new Transaction();
        const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount);
        if (!recipientAccountInfo) {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    recipientTokenAccount,
                    recipientPubkey,
                    mintPubkey
                )
            );
        }

        // Add transfer instruction
        transaction.add(
            createTransferCheckedInstruction(
                senderTokenAccount,
                mintPubkey,
                recipientTokenAccount,
                wallet.publicKey,
                BigInt(amount * (10 ** 9)),
                9
            )
        );

        const signature = await wallet.sendTransaction(transaction, connection);
        const confirmation = await checkTransactionStatus(connection, signature);

        const txRecord: TokenTransaction = {
            signature,
            mintAddress,
            from: wallet.publicKey.toString(),
            to: recipientAddress,
            amount,
            timestamp: Date.now(),
            status: 'success',
            type: 'transfer'
        };

        recordTransaction(txRecord);
        return txRecord;

    } catch (error) {
        console.error("Transfer failed:", error);

        const txRecord: TokenTransaction = {
            signature: '',
            mintAddress,
            from: wallet.publicKey.toString(),
            to: recipientAddress,
            amount,
            timestamp: Date.now(),
            status: 'failed',
            type: 'transfer'
        };

        if (error instanceof Error && error.message.includes("signature")) {
            const signatureMatch = error.message.match(/signature\s([\w\d]+)/);
            if (signatureMatch && signatureMatch[1]) {
                txRecord.signature = signatureMatch[1];
            }
        }

        recordTransaction(txRecord);
        throw error;
    }
};

export const getTransactionHistory = (): TokenTransaction[] => {
    return [...transactionHistory]; // Return a copy
};