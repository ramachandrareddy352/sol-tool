/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from "react";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import solToolIdl from "./sol_tool.json";

export const SOL_TOOL_PROGRAM_ID = new PublicKey(solToolIdl.address);

export function useSolToolAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  // Browser-safe provider from wallet adapter
  const provider = useMemo(() => {
    if (!connection) return null;

    return new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
  }, [connection, wallet]);

  // Anchor program instance
  const solToolProgram = useMemo(() => {
    if (!provider) return null;

    return new anchor.Program(solToolIdl, provider);
  }, [provider]);

  // PDA for fee_config
  const feeConfigPda = useMemo(() => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("fee_config")],
      SOL_TOOL_PROGRAM_ID
    )[0];
  }, []);

  return {
    solToolProgram,
    feeConfigPda,
  };
}
