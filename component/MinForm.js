"use client";

import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "../app/Context/LanguageContext";
import { useNetwork } from "../app/Context/NetworkContext";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  getMint,
  getAssociatedTokenAddress,
  getAccount,
  mintTo,
  createMintToInstruction,
  createBurnInstruction,
} from "@solana/spl-token";
import toast from "react-hot-toast";
import { useSolToolAnchorProgram } from "@/utils/fetch_fee_config";

const MinForm = () => {
  const { language } = useLanguage();
  const { currentNetwork } = useNetwork();
  const { solToolProgram, feeConfigPda } = useSolToolAnchorProgram();
  const wallet = useWallet();

  const [loadingFees, setLoadingFees] = useState(true);
  const [fees, setFees] = useState({ mintFee: 0.1, burnFee: 0.1 }); // In SOL

  const t = {
    en: {
      /* -------- General -------- */
      tokenAddress: "Token Address:",
      enterAddress: "Enter Token Mint Address",
      check: "Check",
      checking: "Checking...",
      pleaseWait: "Please wait",
      loadingFee: "Loading fee configuration...",
      connectWallet: "Please connect your wallet",

      /* -------- User / Amount -------- */
      userAddress: "User Address:",
      enterUserAddress: "Enter User Wallet Address",
      amount: "Amount:",
      enterAmount: "Enter Amount",

      /* -------- Token Info -------- */
      tokenInfo: "Token Information",
      totalSupply: "Total Supply",
      decimals: "Decimals",
      supplyType: "Supply Type",
      fixedSupply: "Fixed Supply (Mint Authority Revoked)",
      variableSupply: "Variable Supply (Mint Authority Active)",
      userBalance: "Your Balance",

      /* -------- Mint -------- */
      mint: "Mint Tokens",
      mintTokens: "Mint Tokens",
      minting: "Minting...",
      notMintAuthority: "You are not the mint authority for this token",
      mintRestricted: "Minting Restricted",
      noMintAuthorityWarning: "You do not have mint authority for this token.",
      fixedSupplyWarning:
        "This token has a fixed supply. Minting is permanently disabled.",

      /* -------- Burn -------- */
      burn: "Burn Tokens",
      burnTokens: "Burn Tokens",
      burning: "Burning...",
      insufficientBalance: "Insufficient balance to burn",

      /* -------- Fees -------- */
      fee: "Fee:",

      /* -------- Status Check -------- */
      checkStatus: "Check Freeze Status",
      checkingStatus: "Checking status...",

      /* -------- Errors -------- */
      invalidToken: "Invalid SPL Token address",
      notSPLToken: "This is not a valid SPL Token",
      invalidUserAddress: "Invalid user address",
      invalidAmount: "Invalid amount",
      noTokenAccount: "No token account found.",

      /* -------- Success / Failure -------- */
      successMint: "Tokens minted successfully",
      successBurn: "Tokens burned successfully",
      errorMint: "Failed to mint tokens",
      errorBurn: "Failed to burn tokens",
    },

    ko: {
      /* -------- General -------- */
      tokenAddress: "토큰 주소:",
      enterAddress: "토큰 민트 주소 입력",
      check: "확인",
      checking: "확인 중...",
      pleaseWait: "잠시만 기다려 주세요",
      loadingFee: "수수료 설정을 불러오는 중입니다...",
      connectWallet: "지갑을 연결하세요",

      /* -------- User / Amount -------- */
      userAddress: "사용자 주소:",
      enterUserAddress: "사용자 지갑 주소 입력",
      amount: "수량:",
      enterAmount: "수량 입력",

      /* -------- Token Info -------- */
      tokenInfo: "토큰 정보",
      totalSupply: "총 공급량",
      decimals: "소수점",
      supplyType: "공급 유형",
      fixedSupply: "고정 공급 (민트 권한 취소됨)",
      variableSupply: "가변 공급 (민트 권한 활성)",
      userBalance: "내 잔액",

      /* -------- Mint -------- */
      mint: "토큰 민트",
      mintTokens: "토큰 민트",
      minting: "민트 중...",
      notMintAuthority: "이 토큰의 민트 권한이 없습니다",
      mintRestricted: "민트 제한됨",
      noMintAuthorityWarning: "이 토큰에 대한 민트 권한이 없습니다.",
      fixedSupplyWarning:
        "이 토큰은 고정 공급 토큰으로, 민트가 영구적으로 비활성화되어 있습니다.",

      /* -------- Burn -------- */
      burn: "토큰 소각",
      burnTokens: "토큰 소각",
      burning: "소각 중...",
      insufficientBalance: "소각할 잔액이 부족합니다",

      /* -------- Fees -------- */
      fee: "수수료:",

      /* -------- Status Check -------- */
      checkStatus: "동결 상태 확인",
      checkingStatus: "상태 확인 중...",

      /* -------- Errors -------- */
      invalidToken: "잘못된 SPL 토큰 주소",
      notSPLToken: "유효한 SPL 토큰이 아닙니다",
      invalidUserAddress: "잘못된 사용자 주소",
      invalidAmount: "잘못된 수량",
      noTokenAccount: "토큰 계정을 찾을 수 없습니다.",

      /* -------- Success / Failure -------- */
      successMint: "토큰이 성공적으로 민트되었습니다",
      successBurn: "토큰이 성공적으로 소각되었습니다",
      errorMint: "토큰 민트 실패",
      errorBurn: "토큰 소각 실패",
    },
  }[language];

  const LoadingPage = () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-[#02CCE6] mx-auto"></div>
        <p className="mt-6 text-lg font-medium text-gray-700">{t.loadingFee}</p>
        <p className="mt-1 text-sm text-gray-500">{t.pleaseWait}</p>
      </div>
    </div>
  );

  // Load fees from on-chain config
  useEffect(() => {
    const fetchFees = async () => {
      try {
        const data = await solToolProgram.account.feeConfig.fetch(feeConfigPda);
        if (data) {
          const lamportsToSol = (lamports) => Number(lamports) / 1_000_000_000;
          setFees({
            mintFee: lamportsToSol(data.mintTokensFee),
            burnFee: lamportsToSol(data.burnTokensFee),
          });
        }
      } catch (err) {
        console.error("Failed to load fees:", err);
        toast.error("Failed to load service fees");
      } finally {
        setLoadingFees(false);
      }
    };

    if (solToolProgram) {
      fetchFees();
    }
  }, [solToolProgram, feeConfigPda]);

  const [tokenAddress, setTokenAddress] = useState("");
  const [checking, setChecking] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isMintAuthority, setIsMintAuthority] = useState(false);
  const [totalSupply, setTotalSupply] = useState(0);
  const [decimals, setDecimals] = useState(0);
  const [isFixedSupply, setIsFixedSupply] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const [userAddressMint, setUserAddressMint] = useState("");
  const [amountMint, setAmountMint] = useState("");
  const [amountBurn, setAmountBurn] = useState("");

  const [updatingMint, setUpdatingMint] = useState(false);
  const [updatingBurn, setUpdatingBurn] = useState(false);

  const connection = useMemo(() => {
    if (!wallet.connected) return null;
    return new Connection(currentNetwork.rpc, "confirmed");
  }, [wallet.connected, currentNetwork]);

  // Reset states on wallet or network change
  useEffect(() => {
    setTokenAddress("");
    setIsValidToken(false);
    setIsMintAuthority(false);
    setTotalSupply(0);
    setDecimals(0);
    setIsFixedSupply(false);
    setUserBalance(0);
    setErrorMessage("");
    setUserAddressMint("");
    setAmountMint("");
    setAmountBurn("");
  }, [wallet.publicKey, currentNetwork]);

  const validatePubkey = (address) => {
    try {
      return new PublicKey(address.trim());
    } catch (error) {
      throw new Error(t.invalidPubkey || "Invalid public key");
    }
  };

  const checkToken = async () => {
    if (!wallet.connected || !connection) {
      toast.error(t.connectWallet);
      return;
    }
    if (!tokenAddress.trim()) {
      setErrorMessage(t.invalidToken);
      return;
    }

    setChecking(true);
    setErrorMessage("");
    setIsValidToken(false);
    setIsMintAuthority(false);
    setTotalSupply(0);
    setDecimals(0);
    setIsFixedSupply(false);
    setUserBalance(0);

    try {
      const mintPubkey = validatePubkey(tokenAddress);
      const mint = await getMint(connection, mintPubkey);

      const isAuth = mint.mintAuthority
        ? mint.mintAuthority.equals(wallet.publicKey)
        : false;
      const isRevoked = !mint.mintAuthority;

      setIsMintAuthority(isAuth);
      setIsFixedSupply(isRevoked);
      setTotalSupply(Number(mint.supply) / 10 ** mint.decimals);
      setDecimals(mint.decimals);

      // Get user balance
      try {
        const userATA = await getAssociatedTokenAddress(
          mintPubkey,
          wallet.publicKey
        );
        const account = await getAccount(connection, userATA);
        setUserBalance(Number(account.amount) / 10 ** mint.decimals);
      } catch (err) {
        setUserBalance(0); // No ATA or balance
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

  const performMint = async () => {
    if (
      !wallet.connected ||
      !connection ||
      !isValidToken ||
      !isMintAuthority ||
      !fees
    )
      return;

    if (!userAddressMint.trim()) {
      toast.error(t.invalidUserAddress);
      return;
    }
    if (
      !amountMint.trim() ||
      isNaN(Number(amountMint)) ||
      Number(amountMint) <= 0
    ) {
      toast.error(t.invalidAmount);
      return;
    }

    const data = await solToolProgram.account.feeConfig.fetch(feeConfigPda);
    const feeLamports = BigInt(data.mintTokensFee);

    setUpdatingMint(true);

    try {
      const userPubkey = validatePubkey(userAddressMint);
      const mintPubkey = new PublicKey(tokenAddress);
      const userATA = await getAssociatedTokenAddress(mintPubkey, userPubkey);

      const feeTransferInstr = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: feeConfigPda,
        lamports: feeLamports,
      });

      const mintInstr = createMintToInstruction(
        mintPubkey,
        userATA,
        wallet.publicKey,
        BigInt(Number(amountMint) * 10 ** decimals)
      );

      let tx = new Transaction().add(feeTransferInstr).add(mintInstr);
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");

      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;

      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      toast.success(t.successMint);

      setUserAddressMint("");
      setAmountMint("");

      // Refresh token data
      await checkToken();
    } catch (error) {
      console.error("Mint failed:", error);
      toast.error(t.errorMint);
    } finally {
      setUpdatingMint(false);
    }
  };

  const performBurn = async () => {
    if (!wallet.connected || !connection || !isValidToken || !fees) return;

    if (
      !amountBurn.trim() ||
      isNaN(Number(amountBurn)) ||
      Number(amountBurn) <= 0
    ) {
      toast.error(t.invalidAmount);
      return;
    }
    if (Number(amountBurn) > userBalance) {
      toast.error(t.insufficientBalance);
      return;
    }

    const data = await solToolProgram.account.feeConfig.fetch(feeConfigPda);
    const feeLamports = BigInt(data.burnTokensFee);

    setUpdatingBurn(true);

    try {
      const mintPubkey = new PublicKey();
      const userATA = await getAssociatedTokenAddress(
        mintPubkey,
        wallet.publicKey
      );

      // Check ATA exists
      await getAccount(connection, userATA);

      const feeTransferInstr = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: feeConfigPda,
        lamports: feeLamports,
      });

      const burnInstr = createBurnInstruction(
        userATA,
        mintPubkey,
        wallet.publicKey,
        BigInt(Number(amountBurn) * 10 ** decimals)
      );

      let tx = new Transaction().add(feeTransferInstr).add(burnInstr);
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");

      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;

      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      toast.success(t.successBurn);

      setAmountBurn("");

      // Refresh token data
      await checkToken();
    } catch (error) {
      console.error("Burn failed:", error);
      if (error.message.includes("Account does not exist")) {
        toast.error(t.noTokenAccount);
      } else {
        toast.error(t.errorBurn);
      }
    } finally {
      setUpdatingBurn(false);
    }
  };

  if (loadingFees) {
    return <LoadingPage />;
  }

  if (!wallet.connected) {
    return (
      <section className="max-w-3xl mx-auto p-6 text-center">
        <p className="text-red-600 font-semibold">{t.connectWallet}</p>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-10">
        {/* ================= Token Address ================= */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            🪙 {t.tokenAddress}
          </label>

          <div className="flex flex-col sm:flex-row gap-4">
            <input
              className="flex-1 border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
              type="text"
              placeholder={t.enterAddress}
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
            />

            <button
              type="button"
              onClick={checkToken}
              disabled={checking || !tokenAddress.trim()}
              className="w-full sm:w-auto bg-[#02CCE6] text-white px-8 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-cyan-600 transition disabled:cursor-not-allowed"
            >
              🔍 {checking ? t.checking : t.check}
            </button>
          </div>

          {errorMessage && (
            <p className="mt-3 text-sm font-medium text-red-600">
              ⚠️ {errorMessage}
            </p>
          )}
        </div>

        {/* ================= Token Info ================= */}
        {isValidToken && (
          <div className="grid gap-6">
            <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                📊 {t.tokenInfo}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                <p>
                  💰 <span className="font-semibold">{t.totalSupply}:</span>{" "}
                  {totalSupply.toFixed(2)}
                </p>
                <p>
                  🔢 <span className="font-semibold">{t.decimals}:</span>{" "}
                  {decimals}
                </p>
                <p>
                  🔒 <span className="font-semibold">{t.supplyType}:</span>{" "}
                  {isFixedSupply ? t.fixedSupply : t.variableSupply}
                </p>
                <p>
                  👤 <span className="font-semibold">{t.userBalance}:</span>{" "}
                  {userBalance.toFixed(2)}
                </p>
              </div>
            </div>

            {/* ================= Mint Section ================= */}
            {isMintAuthority && !isFixedSupply ? (
              <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  ➕ {t.mintTokens}
                </h3>

                <div className="space-y-4">
                  <input
                    className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
                    placeholder={t.enterUserAddress}
                    value={userAddressMint}
                    onChange={(e) => setUserAddressMint(e.target.value)}
                  />

                  <input
                    className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
                    placeholder={t.enterAmount}
                    value={amountMint}
                    onChange={(e) => setAmountMint(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={performMint}
                    disabled={
                      updatingMint ||
                      !userAddressMint.trim() ||
                      !amountMint.trim()
                    }
                    className="w-full bg-[#02CCE6] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-cyan-600 transition disabled:cursor-not-allowed"
                  >
                    🪙 {updatingMint ? t.minting : t.mint}
                  </button>

                  <div className="text-xs text-gray-600">
                    💰 {t.fee}{" "}
                    <span className="font-semibold text-gray-800">
                      {fees.mintFee} SOL
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= Mint Authority Warning ================= */
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                  ⚠️ {t.mintRestricted}
                </h3>
                <p className="text-sm text-yellow-700">
                  {isFixedSupply
                    ? t.fixedSupplyWarning
                    : t.noMintAuthorityWarning}
                </p>
              </div>
            )}

            {/* ================= Burn Section ================= */}
            <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🔥 {t.burnTokens}
              </h3>

              <input
                className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm mb-4 focus:ring-2 focus:ring-[#02CCE6]"
                placeholder={t.enterAmount}
                value={amountBurn}
                onChange={(e) => setAmountBurn(e.target.value)}
              />

              <button
                type="button"
                onClick={performBurn}
                disabled={
                  updatingBurn || !amountBurn.trim() || userBalance <= 0
                }
                className="w-full bg-[#02CCE6] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-cyan-600 transition disabled:cursor-not-allowed"
              >
                🔥 {updatingBurn ? t.burning : t.burn}
              </button>

              <div className="mt-2 text-xs text-gray-600">
                💰 {t.fee}{" "}
                <span className="font-semibold text-gray-800">
                  {fees.burnFee} SOL
                </span>
              </div>
            </div>
          </div>
        )}
      </form>
    </section>
  );
};

export default MinForm;
