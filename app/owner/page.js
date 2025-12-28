"use client";

import { useState, useMemo } from "react";
import Banner from "@/component/Banner";
import Header from "@/component/Header";
import Headline from "@/component/Headline";
import { useLanguage } from "../Context/LanguageContext";
import { useNetwork } from "../Context/NetworkContext";
import Footer from "@/component/Footer";
import { useWallet } from "@solana/wallet-adapter-react";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  mplTokenMetadata,
  fetchMetadata,
  findMetadataPda,
  updateV1,
} from "@metaplex-foundation/mpl-token-metadata";
import { publicKey as umiPublicKey, sol, some } from "@metaplex-foundation/umi";
import {
  setAuthority,
  AuthorityType,
  transferSol,
} from "@metaplex-foundation/mpl-toolbox";
import { Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import toast from "react-hot-toast";

const Page = () => {
  const { language } = useLanguage();
  const { currentNetwork } = useNetwork();

  const t = {
    en: {
      priorityFees: "Priority Fees",
      heading: "Ownership",
      tokenAddress: "Token Address:",
      enterAddress: "Enter Address",
      check: "Check",
      fee: "Fee 0.1SOL",
      updateOwn: "Update Ownership",
      lastdesc: "All rights to the token are transferred.",
      description:
        "Easily Create your own Solana SPL Token in just 7+1 steps without Coding.",
      invalidToken: "Invalid SPL Token address",
      notSPLToken: "This is not a valid SPL Token",
      mintAuthority: "Mint Authority",
      freezeAuthority: "Freeze Authority",
      updateAuthority: "Metadata Update Authority",
      revoked: "Revoked (Permanent)",
      current: "Current owner: ",
      revocable: "You can update this authority",
      notRevocable: "Cannot be updated (not your authority)",
      immutable: "Immutable (Frozen Permanently)",
      revokeMint: "Revoke Mint Authority",
      updateMint: "Update Mint Authority",
      revokeFreeze: "Revoke Freeze Authority",
      updateFreeze: "Update Freeze Authority",
      revokeUpdate: "Revoke Update Authority",
      updateUpdate: "Update Update Authority",
      newAddress: "Enter new address",
      successRevoke: "Authority revoked successfully",
      successUpdate: "Authority updated successfully",
      errorRevoke: "Failed to revoke authority",
      errorUpdate: "Failed to update authority",
      connectWallet: "Please connect your wallet",
      noAuthority: "No authority to update",
      feeRevoke: "Fee: 0.1 SOL",
      feeUpdate: "Fee: 0.1 SOL",
      checking: "Checking...",
      updating: "Updating...",
      invalidPubkey:
        "Invalid public key format. Must be a valid Solana address (32-44 characters, base58).",
    },
    ko: {
      priorityFees: "소유권",
      heading: "메타",
      tokenAddress: "토큰 주소:",
      enterAddress: "주소 입력",
      check: "확인",
      fee: "요금 0.1SOL",
      updateOwn: "소유권 업데이트",
      lastdesc: "토큰에 대한 모든 권리가 양도됩니다.",
      description:
        "코딩 없이 7+1단계 만으로 손쉽게 Solana SPL 토큰을 만들어보세요.",
      invalidToken: "잘못된 SPL 토큰 주소",
      notSPLToken: "이것은 유효한 SPL 토큰이 아닙니다",
      mintAuthority: "민트 권한",
      freezeAuthority: "동결 권한",
      updateAuthority: "메타데이터 업데이트 권한",
      revoked: "취소됨 (영구)",
      current: "현재 소유자:",
      revocable: "이 권한을 업데이트할 수 있습니다",
      notRevocable: "업데이트할 수 없음 (귀하의 권한이 아님)",
      immutable: "불변 (영구 동결됨)",
      revokeMint: "민트 권한 취소",
      updateMint: "민트 권한 업데이트",
      revokeFreeze: "동결 권한 취소",
      updateFreeze: "동결 권한 업데이트",
      revokeUpdate: "업데이트 권한 취소",
      updateUpdate: "업데이트 권한 업데이트",
      newAddress: "새 주소 입력",
      successRevoke: "권한이 성공적으로 취소되었습니다",
      successUpdate: "권한이 성공적으로 업데이트되었습니다",
      errorRevoke: "권한 취소 실패",
      errorUpdate: "권한 업데이트 실패",
      connectWallet: "지갑을 연결하세요",
      noAuthority: "업데이트할 권한 없음",
      feeRevoke: "수수료: 0.1 SOL",
      feeUpdate: "수수료: 0.1 SOL",
      checking: "확인 중...",
      updating: "업데이트 중...",
      invalidPubkey:
        "잘못된 공개 키 형식입니다. 유효한 Solana 주소여야 합니다 (32-44자, base58).",
    },
  }[language];

  const wallet = useWallet();

  const [tokenAddress, setTokenAddress] = useState("");
  const [checking, setChecking] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [mintAuthority, setMintAuthority] = useState(null);
  const [freezeAuthority, setFreezeAuthority] = useState(null);
  const [updateAuthority, setUpdateAuthority] = useState(null);
  const [isMutable, setIsMutable] = useState(true); // Tracks if metadata is mutable

  const [newMintAuth, setNewMintAuth] = useState("");
  const [newFreezeAuth, setNewFreezeAuth] = useState("");
  const [newUpdateAuth, setNewUpdateAuth] = useState("");

  const [updating, setUpdating] = useState(false);

  // Dedicated connection for SPL token queries
  const connection = useMemo(() => {
    if (!wallet.connected) return null;
    return new Connection(currentNetwork.rpc, "confirmed");
  }, [wallet.connected, currentNetwork]);

  const umi = useMemo(() => {
    if (!wallet.connected || !wallet.publicKey || !connection) return null;
    return createUmi(connection.rpcEndpoint)
      .use(walletAdapterIdentity(wallet))
      .use(mplTokenMetadata());
  }, [wallet.connected, wallet.publicKey, connection]);

  const validateAndCreatePubkey = (address) => {
    try {
      return new PublicKey(address.trim());
    } catch (error) {
      throw new Error(t.invalidPubkey);
    }
  };

  const checkToken = async () => {
    if (!umi || !connection) {
      toast.error(t.connectWallet);
      return;
    }
    if (!tokenAddress.trim()) {
      setErrorMessage(t.invalidToken);
      return;
    }

    setChecking(true);
    setIsValidToken(false);
    setErrorMessage("");
    setMintAuthority(null);
    setFreezeAuthority(null);
    setUpdateAuthority(null);
    setIsMutable(true);
    setNewMintAuth("");
    setNewFreezeAuth("");
    setNewUpdateAuth("");

    try {
      const mintPubkey = validateAndCreatePubkey(tokenAddress);

      // Fetch SPL Token Mint
      const mint = await getMint(connection, mintPubkey);

      setMintAuthority(
        mint.mintAuthority ? mint.mintAuthority.toBase58() : null
      );
      setFreezeAuthority(
        mint.freezeAuthority ? mint.freezeAuthority.toBase58() : null
      );

      // Fetch Metaplex Metadata (if exists)
      try {
        const umiMintKey = umiPublicKey(mintPubkey.toBase58());
        const metadataPda = findMetadataPda(umi, { mint: umiMintKey });
        const metadata = await fetchMetadata(umi, metadataPda);

        setUpdateAuthority(metadata.updateAuthority.toString());
        setIsMutable(metadata.isMutable === true); // Strict boolean check
      } catch (err) {
        console.log(
          "No Metaplex metadata found or error fetching:",
          err.message
        );
        setUpdateAuthority(null);
        setIsMutable(true); // No metadata → no immutability constraint
      }

      setIsValidToken(true);
    } catch (error) {
      console.error("Token check error:", error);
      setErrorMessage(error.message || t.notSPLToken);
      toast.error(error.message || t.notSPLToken);
    } finally {
      setChecking(false);
    }
  };

  const updateAuthorityFun = async (type, newAuth = null) => {
    if (!umi || !isValidToken || updating) return;

    let currentAuth = null;
    if (type === "mint") currentAuth = mintAuthority;
    else if (type === "freeze") currentAuth = freezeAuthority;
    else if (type === "update") currentAuth = updateAuthority;

    // Must be current authority
    if (!currentAuth || currentAuth !== wallet.publicKey?.toString()) {
      toast.error(t.noAuthority);
      return;
    }

    // Extra safety: cannot update/revoke if metadata is immutable
    if (type === "update" && !isMutable) {
      toast.error("Metadata is immutable — cannot modify update authority");
      return;
    }

    if (newAuth && !newAuth.trim()) {
      toast.error("Please enter a valid new address");
      return;
    }

    let newAuthKey = null;
    if (newAuth) {
      try {
        newAuthKey = validateAndCreatePubkey(newAuth);
      } catch (err) {
        toast.error(err.message);
        return;
      }
    }

    setUpdating(true);
    try {
      const mintPubkey = umiPublicKey(tokenAddress.trim());
      let txBuilder;

      if (type === "mint") {
        txBuilder = setAuthority(umi, {
          owned: mintPubkey,
          owner: umi.identity.publicKey,
          authorityType: AuthorityType.MintTokens,
          newAuthority: newAuthKey ? umiPublicKey(newAuthKey.toBase58()) : null,
        });
      } else if (type === "freeze") {
        txBuilder = setAuthority(umi, {
          owned: mintPubkey,
          owner: umi.identity.publicKey,
          authorityType: AuthorityType.FreezeAccount,
          newAuthority: newAuthKey ? umiPublicKey(newAuthKey.toBase58()) : null,
        });
      } else if (type === "update") {
        const metadataPda = findMetadataPda(umi, { mint: mintPubkey });
        txBuilder = updateV1(umi, {
          mint: mintPubkey,
          metadata: metadataPda,
          authority: umi.identity,
          newUpdateAuthority: newAuthKey
            ? umiPublicKey(newAuthKey.toBase58())
            : null,
          isMutable: some(newAuthKey ? true : false), // Freeze if revoking
        });
      }

      // Add service fee
      const feeAddress = new PublicKey(
        "Ezapurmy7RCgNo2F41xSsf6yk5mvtStkoqVQnw9fkaqN"
      );
      const feeAmount = sol(0.1);

      txBuilder = txBuilder.prepend(
        transferSol(umi, {
          source: umi.identity,
          destination: feeAddress,
          amount: feeAmount,
        })
      );

      await txBuilder.sendAndConfirm(umi);

      toast.success(newAuth ? t.successUpdate : t.successRevoke);

      // Clear inputs
      if (type === "mint") setNewMintAuth("");
      else if (type === "freeze") setNewFreezeAuth("");
      else if (type === "update") setNewUpdateAuth("");

      // Refresh token data
      await checkToken();
    } catch (error) {
      console.error("Update failed:", error);
      toast.error(newAuth ? t.errorUpdate : t.errorRevoke);
    } finally {
      setUpdating(false);
    }
  };

  const getAuthorityStatus = (auth) => {
    if (auth === null) return t.revoked;
    return t.current + auth;
  };

  const isRevocable = (auth) => {
    return auth && auth === wallet.publicKey?.toString();
  };

  // Only allow metadata authority changes if mutable AND you are authority
  const canModifyUpdateAuthority =
    updateAuthority &&
    updateAuthority === wallet.publicKey?.toString() &&
    isMutable;

  const renderAuthoritySection = (
    type,
    title,
    currentAuth,
    newAuthState,
    setNewAuthState,
    revokeLabel,
    updateLabel
  ) => {
    const showControls =
      type !== "update" ? isRevocable(currentAuth) : canModifyUpdateAuthority;

    return (
      <div className="border border-[#E6E8EC] rounded p-4">
        <h3 className="font-bold text-lg mb-2">{title}</h3>

        <p className="text-sm mb-2">
          {type === "update" && !isMutable
            ? t.immutable
            : getAuthorityStatus(currentAuth)}
        </p>

        {type === "update" && !isMutable ? (
          <p className="text-red-600 text-sm mb-2">{t.notRevocable}</p>
        ) : isRevocable(currentAuth) ? (
          <p className="text-green-600 text-sm mb-2">{t.revocable}</p>
        ) : (
          <p className="text-red-600 text-sm mb-2">{t.notRevocable}</p>
        )}

        {showControls && (
          <div className="space-y-3 mt-3">
            {/* Revoke Button */}
            <button
              type="button"
              onClick={() => updateAuthorityFun(type)}
              disabled={updating}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm disabled:opacity-50 w-full transition"
            >
              {updating ? t.updating : revokeLabel}
            </button>

            {/* Update with new address */}
            <div className="flex gap-2">
              <input
                className="border border-[#E6E8EC] rounded px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                type="text"
                placeholder={t.newAddress}
                value={newAuthState}
                onChange={(e) => setNewAuthState(e.target.value)}
              />
              <button
                type="button"
                onClick={() => updateAuthorityFun(type, newAuthState)}
                disabled={updating || !newAuthState.trim()}
                className="bg-[#02CCE6] hover:bg-cyan-600 text-white py-2 px-4 rounded text-sm disabled:opacity-50 transition"
              >
                {updating ? t.updating : updateLabel}
              </button>
            </div>
          </div>
        )}

        <small className="text-gray-500 block mt-3">
          {type === "update" ? t.feeUpdate : t.feeRevoke}
        </small>
      </div>
    );
  };

  return (
    <>
      <Header />
      <Banner />
      <Headline translations={{ [language]: t }} />

      <section className="max-w-3xl mx-auto p-6">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-8"
        >
          {/* Token Address Input */}
          <div>
            <label className="font-semibold block mb-2">{t.tokenAddress}</label>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  className="w-full border border-[#E6E8EC] rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                  type="text"
                  placeholder={t.enterAddress}
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={checkToken}
                disabled={checking || !tokenAddress.trim()}
                className="bg-[#02CCE6] text-white px-8 py-3 rounded font-medium disabled:opacity-50 hover:bg-cyan-600 transition"
              >
                {checking ? t.checking : t.check}
              </button>
            </div>
          </div>

          {errorMessage && (
            <p className="text-red-600 text-center text-sm mt-2 font-medium">
              {errorMessage}
            </p>
          )}

          {/* Authority Sections */}
          {isValidToken && (
            <div className="grid gap-6 md:grid-cols-1">
              {renderAuthoritySection(
                "mint",
                t.mintAuthority,
                mintAuthority,
                newMintAuth,
                setNewMintAuth,
                t.revokeMint,
                t.updateMint
              )}

              {renderAuthoritySection(
                "freeze",
                t.freezeAuthority,
                freezeAuthority,
                newFreezeAuth,
                setNewFreezeAuth,
                t.revokeFreeze,
                t.updateFreeze
              )}

              {renderAuthoritySection(
                "update",
                t.updateAuthority,
                updateAuthority,
                newUpdateAuth,
                setNewUpdateAuth,
                t.revokeUpdate,
                t.updateUpdate
              )}
            </div>
          )}
        </form>
      </section>

      <Footer />
    </>
  );
};

export default Page;
