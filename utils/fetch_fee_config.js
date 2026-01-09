/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from "react";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useNetwork } from "@/app/Context/NetworkContext";

import solToolIdl from "./sol_tool.json";

/**
 * Resolve Program ID based on cluster
 */
export function getSolToolProgramId(cluster) {
  switch (cluster) {
    case "devnet":
    case "testnet":
      return new PublicKey("3gAEMPB7deboau3r7CUxF2om3ZYkMq9TddLVzpV1pVFt");
    case "mainnet":
    default:
      return new PublicKey("3gAEMPB7deboau3r7CUxF2om3ZYkMq9TddLVzpV1pVFt");
  }
}

export function useSolToolAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { network } = useNetwork(); // devnet / mainnet

  /**
   * Program ID derived from selected network
   */
  const programId = useMemo(() => {
    return getSolToolProgramId(network);
  }, [network]);

  /**
   * Browser-safe Anchor provider
   */
  const provider = useMemo(() => {
    if (!connection) return null;

    return new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
  }, [connection, wallet]);

  /**
   * Anchor Program (re-created when network changes)
   */
  const solToolProgram = useMemo(() => {
    if (!provider) return null;

    return new anchor.Program(solToolIdl, provider);
  }, [provider, programId]);

  /**
   * PDA: fee_config (depends on program ID!)
   */
  const feeConfigPda = useMemo(() => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("fee_config")],
      programId
    )[0];
  }, [programId]);

  return {
    solToolProgram,
    programId,
    feeConfigPda,
  };
}
