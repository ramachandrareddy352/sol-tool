/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "../app/Context/LanguageContext";
import { useNetwork } from "../app/Context/NetworkContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { HiCheckCircle } from "react-icons/hi";
import { TiCancel } from "react-icons/ti";
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
  createMintToInstruction,
  createBurnInstruction,
  createCloseAccountInstruction,
} from "@solana/spl-token";
import toast from "react-hot-toast";
import { useSolToolAnchorProgram } from "@/utils/fetch_fee_config";

const shortSig = (sig) => (sig ? `${sig.slice(0, 8)}...${sig.slice(-8)}` : "");

const MinForm = () => {
  const { language } = useLanguage();
  const { currentNetwork } = useNetwork();
  const { solToolProgram, feeConfigPda } = useSolToolAnchorProgram();
  const wallet = useWallet();

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [txSignature, setTxSignature] = useState("");
  const [modalErrorMessage, setModalErrorMessage] = useState("");

  const [loadingFees, setLoadingFees] = useState(true);
  const [fees, setFees] = useState({
    mintFee: 0.1,
    burnFee: 0.1,
    closeAccountFee: 0.1,
  });

  // Unified translations for both languages
  const t = {
    en: {
      // General
      tokenAddress: "Token Address:",
      enterAddress: "Enter Token Mint Address",
      check: "Check",
      checking: "Checking...",
      pleaseWait: "Please wait",
      loadingFee: "Loading fee configuration...",
      connectWallet: "Please connect your wallet",

      // Token Info
      tokenInfo: "Token Information",
      totalSupply: "Total Supply",
      decimals: "Decimals",
      supplyType: "Supply Type",
      fixedSupply: "Fixed Supply (Mint Authority Revoked)",
      variableSupply: "Variable Supply (Mint Authority Active)",
      userBalance: "Your Balance",

      // Mint
      mintTokens: "Mint Tokens",
      userAddress: "Recipient Address:",
      enterUserAddress: "Enter recipient wallet address",
      amount: "Amount:",
      enterAmount: "Enter amount to mint",
      minting: "Minting...",
      notMintAuthority: "You are not the mint authority",
      mintRestricted: "Minting Restricted",
      noMintAuthorityWarning: "You do not have mint authority for this token.",
      fixedSupplyWarning: "This token has fixed supply. Minting is disabled.",

      // Burn
      burnTokens: "Burn Tokens",
      burning: "Burning...",
      insufficientBalance: "Insufficient balance",

      // Close Account
      closeAccount: "Close Token Account",
      closeAccountDesc: "Close your token account and reclaim rent SOL",
      balanceWarning:
        "Your balance is greater than 0. You must burn tokens first to close the account.",
      burnAndClose: "Burn All & Close Account",
      burnAndCloseDesc:
        "Burn your entire balance and close the account in one transaction",
      refundAddress: "Rent Refund Address:",
      refundAddressPlaceholder:
        "Enter address to receive rent-exempt SOL (default: your wallet)",
      closing: "Closing account...",

      // Fees
      fee: "Fee:",

      // Errors
      invalidToken: "Invalid SPL Token address",
      notSPLToken: "Not a valid SPL Token",
      invalidAddress: "Invalid wallet address",
      invalidAmount: "Invalid amount",
      noTokenAccount: "No token account found for this mint",

      // Success
      successMint: "Tokens minted successfully!",
      successBurn: "Tokens burned successfully!",
      successClose: "Token account closed successfully!",
      successBurnAndClose: "All tokens burned and account closed!",

      // Failure
      errorMint: "Failed to mint tokens",
      errorBurn: "Failed to burn tokens",
      errorClose: "Failed to close account",

      copy: "Copy",
      copied: "Copied to clipboard!",
      viewOnExplorer: "View on Solscan Explorer",
      txSuccess: "Transaction Successful",
      txFailed: "Transaction Failed",
      txSignature: "Transaction Signature",
      ok: "OK",
    },
    ko: {
      txSuccess: "거래가 성공적으로 완료되었습니다",
      txFailed: "거래에 실패했습니다",
      txSignature: "트랜잭션 해시",
      ok: "확인",
      copy: "복사",
      copied: "클립보드에 복사되었습니다!",
      viewOnExplorer: "Solscan 탐색기에서 보기",
      // General
      tokenAddress: "토큰 주소:",
      enterAddress: "토큰 민트 주소 입력",
      check: "확인",
      checking: "확인 중...",
      pleaseWait: "잠시만 기다려 주세요",
      loadingFee: "수수료 설정 로드 중...",
      connectWallet: "지갑을 연결해주세요",

      // Token Info
      tokenInfo: "토큰 정보",
      totalSupply: "총 공급량",
      decimals: "소수점",
      supplyType: "공급 유형",
      fixedSupply: "고정 공급 (민트 권한 취소됨)",
      variableSupply: "가변 공급 (민트 권한 유지됨)",
      userBalance: "내 잔액",

      // Mint
      mintTokens: "토큰 민트",
      userAddress: "수령자 주소:",
      enterUserAddress: "수령할 지갑 주소 입력",
      amount: "수량:",
      enterAmount: "민트할 수량 입력",
      minting: "민트 중...",
      notMintAuthority: "민트 권한이 없습니다",
      mintRestricted: "민트 제한됨",
      noMintAuthorityWarning: "이 토큰의 민트 권한이 없습니다.",
      fixedSupplyWarning: "고정 공급 토큰으로 민트가 불가능합니다.",

      // Burn
      burnTokens: "토큰 소각",
      burning: "소각 중...",
      insufficientBalance: "잔액 부족",

      // Close Account
      closeAccount: "토큰 계정 닫기",
      closeAccountDesc: "토큰 계정을 닫고 렌트 SOL을 회수하세요",
      balanceWarning:
        "잔액이 0보다 큽니다. 계정 닫기 전 토큰을 먼저 소각해야 합니다.",
      burnAndClose: "전체 소각 후 계정 닫기",
      burnAndCloseDesc: "잔액 전체를 소각하고 계정을 한 번에 닫습니다",
      refundAddress: "렌트 환급 주소:",
      refundAddressPlaceholder: "렌트 SOL을 받을 주소 (기본: 내 지갑)",
      closing: "계정 닫는 중...",

      // Fees
      fee: "수수료:",

      // Errors
      invalidToken: "유효하지 않은 SPL 토큰 주소",
      notSPLToken: "유효한 SPL 토큰이 아닙니다",
      invalidAddress: "잘못된 지갑 주소",
      invalidAmount: "잘못된 수량",
      noTokenAccount: "이 민트에 대한 토큰 계정이 없습니다",

      // Success
      successMint: "토큰 민트 성공!",
      successBurn: "토큰 소각 성공!",
      successClose: "토큰 계정 닫기 성공!",
      successBurnAndClose: "전체 소각 후 계정 닫기 성공!",

      // Failure
      errorMint: "토큰 민트 실패",
      errorBurn: "토큰 소각 실패",
      errorClose: "계정 닫기 실패",
    },
  }[language];

  const LoadingPage = () => (
    <div className="flex items-center justify-center min-h-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-[#02CCE6] mx-auto"></div>
        <p className="mt-6 text-lg font-medium text-gray-700">{t.loadingFee}</p>
        <p className="mt-1 text-sm text-gray-500">{t.pleaseWait}</p>
      </div>
    </div>
  );

  // Load fees
  useEffect(() => {
    const fetchFees = async () => {
      try {
        const data = await solToolProgram.account.feeConfig.fetch(feeConfigPda);
        const lamportsToSol = (lamports) => Number(lamports) / 1_000_000_000;
        setFees({
          mintFee: lamportsToSol(data.mintTokensFee),
          burnFee: lamportsToSol(data.burnTokensFee),
          closeAccountFee: lamportsToSol(data.accountDeleteRefundFee),
        });
      } catch (err) {
        console.error("Failed to load fees:", err);
        toast.error("Failed to load fees");
      } finally {
        setLoadingFees(false);
      }
    };
    if (solToolProgram) fetchFees();
  }, []);

  const [tokenAddress, setTokenAddress] = useState("");
  const [checking, setChecking] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isMintAuthority, setIsMintAuthority] = useState(false);
  const [totalSupply, setTotalSupply] = useState(0);
  const [decimals, setDecimals] = useState(0);
  const [isFixedSupply, setIsFixedSupply] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [userATA, setUserATA] = useState(null);
  const [mintPubkey, setMintPubkey] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Mint inputs
  const [userAddressMint, setUserAddressMint] = useState("");
  const [amountMint, setAmountMint] = useState("");

  // Burn input
  const [amountBurn, setAmountBurn] = useState("");
  const [hasTokenAccount, setHasTokenAccount] = useState(false);

  // Close account inputs
  const [refundAddress, setRefundAddress] = useState();
  const [closing, setClosing] = useState(false);
  const [burnAndClosing, setBurnAndClosing] = useState(false);

  const connection = useMemo(() => {
    if (!wallet.connected) return null;
    return new Connection(currentNetwork.rpc, "confirmed");
  }, [wallet.connected, currentNetwork]);

  // Reset on wallet/network change
  useEffect(() => {
    setTokenAddress("");
    setIsValidToken(false);
    setUserATA(null);
    setMintPubkey(null);
    setErrorMessage("");
    setUserAddressMint("");
    setAmountMint("");
    setAmountBurn("");
    setRefundAddress();
  }, [wallet.publicKey, currentNetwork]);

  const validatePubkey = (addr) => {
    try {
      return new PublicKey(addr.trim());
    } catch {
      throw new Error(t.invalidAddress);
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
    setHasTokenAccount(false); // Reset

    try {
      const mintPk = validatePubkey(tokenAddress);
      setMintPubkey(mintPk);

      const mint = await getMint(connection, mintPk);
      const hasMintAuth = mint.mintAuthority?.equals(wallet.publicKey) || false;
      const revoked = mint.mintAuthority === null;

      setIsMintAuthority(hasMintAuth);
      setIsFixedSupply(revoked);
      setDecimals(mint.decimals);
      setTotalSupply(Number(mint.supply) / 10 ** mint.decimals);

      // Check for user's ATA
      const ata = await getAssociatedTokenAddress(mintPk, wallet.publicKey);
      setUserATA(ata);

      try {
        const account = await getAccount(connection, ata);
        setUserBalance(Number(account.amount) / 10 ** mint.decimals);
        setHasTokenAccount(true); // ATA exists and has data
      } catch (err) {
        // No ATA or closed
        setUserBalance(0);
        setHasTokenAccount(false);
      }

      setIsValidToken(true);
    } catch (error) {
      setErrorMessage(error.message || t.notSPLToken);
      toast.error(error.message || t.notSPLToken);
    } finally {
      setChecking(false);
    }
  };

  const performMint = async () => {
    if (!isValidToken || !isMintAuthority || !mintPubkey || !connection) return;
    if (!userAddressMint.trim()) return toast.error(t.invalidAddress);
    if (!amountMint || Number(amountMint) <= 0)
      return toast.error(t.invalidAmount);

    setUpdatingMint(true);
    try {
      const recipient = validatePubkey(userAddressMint);
      const recipientATA = await getAssociatedTokenAddress(
        mintPubkey,
        recipient,
      );

      const data = await solToolProgram.account.feeConfig.fetch(feeConfigPda);
      const feeLamports = data.mintTokensFee;

      const tx = new Transaction()
        .add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: feeConfigPda,
            lamports: feeLamports,
          }),
        )
        .add(
          createMintToInstruction(
            mintPubkey,
            recipientATA,
            wallet.publicKey,
            BigInt(Number(amountMint) * 10 ** decimals),
          ),
        );

      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = wallet.publicKey;

      const sig = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");

      setTxSignature(sig);
      setSuccessModalOpen(true);

      setUserAddressMint("");
      setAmountMint("");
      await checkToken();
    } catch (err) {
      console.error(err);
      setModalErrorMessage(t.errorMint);
      setErrorModalOpen(true);
    } finally {
      setUpdatingMint(false);
    }
  };

  const performBurn = async () => {
    if (!isValidToken || !mintPubkey || !userATA || userBalance <= 0) return;
    if (
      !amountBurn ||
      Number(amountBurn) <= 0 ||
      Number(amountBurn) > userBalance
    ) {
      return toast.error(t.insufficientBalance);
    }

    setUpdatingBurn(true);
    try {
      const data = await solToolProgram.account.feeConfig.fetch(feeConfigPda);
      const feeLamports = data.burnTokensFee;

      const tx = new Transaction()
        .add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: feeConfigPda,
            lamports: feeLamports,
          }),
        )
        .add(
          createBurnInstruction(
            userATA,
            mintPubkey,
            wallet.publicKey,
            BigInt(Number(amountBurn) * 10 ** decimals),
          ),
        );

      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = wallet.publicKey;

      const sig = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(sig);

      setTxSignature(sig);
      setSuccessModalOpen(true);
      setAmountBurn("");
      await checkToken();
    } catch (err) {
      setModalErrorMessage(t.errorBurn);
      setErrorModalOpen(true);
    } finally {
      setUpdatingBurn(false);
    }
  };

  const performCloseAccount = async (burnAll = false) => {
    if (
      !isValidToken ||
      !mintPubkey ||
      !userATA ||
      !connection ||
      !hasTokenAccount
    ) {
      toast.error(t.noTokenAccount);
      return;
    }

    if (!burnAll && userBalance > 0) {
      toast.error(t.balanceWarning);
      return;
    }

    const isBurnAndClose = burnAll && userBalance > 0;
    const action = isBurnAndClose ? setBurnAndClosing : setClosing;
    action(true);

    try {
      const data = await solToolProgram.account.feeConfig.fetch(feeConfigPda);

      // Correct fee calculation
      let feeLamports = BigInt(data.accountDeleteRefundFee); // Always charge close fee

      if (isBurnAndClose) {
        feeLamports += BigInt(data.burnTokensFee); // Add burn fee only when burning
      }

      // Safe handling of refund address
      const refundStr = (refundAddress || "").toString().trim();
      const refundPubkey = refundStr
        ? validatePubkey(refundStr)
        : wallet.publicKey;

      // Build transaction
      const tx = new Transaction();

      // 1. Pay service fee(s)
      tx.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: feeConfigPda,
          lamports: feeLamports,
        }),
      );

      // 2. Burn all tokens if needed
      if (isBurnAndClose) {
        tx.add(
          createBurnInstruction(
            userATA,
            mintPubkey,
            wallet.publicKey,
            BigInt(Math.round(userBalance * 10 ** decimals)), // Safe integer conversion
          ),
        );
      }

      // 3. Close the token account (rent goes to refundPubkey)
      tx.add(
        createCloseAccountInstruction(userATA, refundPubkey, wallet.publicKey),
      );

      // Send transaction
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = wallet.publicKey;

      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      setTxSignature(signature);
      setSuccessModalOpen(true);

      // Reset form and refresh token info
      setRefundAddress("");
      await checkToken(); // Will detect closed account → update UI correctly
    } catch (err) {
      console.error("Close account failed:", err);
      setModalErrorMessage(err.message || t.errorClose);
      setErrorModalOpen(true);
    } finally {
      action(false);
    }
  };

  const [updatingMint, setUpdatingMint] = useState(false);
  const [updatingBurn, setUpdatingBurn] = useState(false);

  if (loadingFees) return <LoadingPage />;

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-10">
        {/* Token Address */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            🪙 {t.tokenAddress}
          </label>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              className="flex-1 border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
              placeholder={t.enterAddress}
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
            />
            <button
              onClick={checkToken}
              disabled={checking || !tokenAddress.trim()}
              className="w-full sm:w-auto bg-[#02CCE6] text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-cyan-600 disabled:cursor-not-allowed"
            >
              {checking ? t.checking : t.check}
            </button>
          </div>
          {errorMessage && (
            <p className="mt-3 text-sm text-red-600 font-medium">
              {errorMessage}
            </p>
          )}
        </div>

        {isValidToken && (
          <>
            {/* Token Info */}
            <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📊 {t.tokenInfo}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <p>
                  <strong>{t.totalSupply}:</strong>{" "}
                  {totalSupply.toLocaleString()}
                </p>
                <p>
                  <strong>{t.decimals}:</strong> {decimals}
                </p>
                <p>
                  <strong>{t.supplyType}:</strong>{" "}
                  {isFixedSupply ? t.fixedSupply : t.variableSupply}
                </p>
                <p>
                  <strong>{t.userBalance}:</strong> {userBalance.toFixed(4)}
                </p>
              </div>
            </div>

            {/* Mint Section */}
            {isMintAuthority && !isFixedSupply && (
              <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  ➕ {t.mintTokens}
                </h3>
                <div className="space-y-4">
                  <input
                    placeholder={t.enterUserAddress}
                    value={userAddressMint}
                    onChange={(e) => setUserAddressMint(e.target.value)}
                    className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
                  />
                  <input
                    type="number"
                    placeholder={t.enterAmount}
                    value={amountMint}
                    onChange={(e) => setAmountMint(e.target.value)}
                    className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
                  />
                  <button
                    onClick={performMint}
                    disabled={updatingMint || !userAddressMint || !amountMint}
                    className="w-full bg-[#02CCE6] text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-cyan-600"
                  >
                    {updatingMint ? t.minting : t.mintTokens}
                  </button>
                  <p className="text-xs text-gray-600">
                    {t.fee} <strong>{fees.mintFee} SOL</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Mint Warning */}
            {(!isMintAuthority || isFixedSupply) && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-6">
                <p className="text-yellow-800 font-medium">
                  {isFixedSupply
                    ? t.fixedSupplyWarning
                    : t.noMintAuthorityWarning}
                </p>
              </div>
            )}

            {/* Burn Section */}
            <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🔥 {t.burnTokens}
              </h3>
              <input
                type="number"
                placeholder={t.enterAmount}
                value={amountBurn}
                onChange={(e) => setAmountBurn(e.target.value)}
                className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 mb-4 text-sm focus:ring-2 focus:ring-[#02CCE6]"
              />
              <button
                onClick={performBurn}
                disabled={
                  updatingBurn ||
                  !amountBurn ||
                  Number(amountBurn) > userBalance
                }
                className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-red-600"
              >
                {updatingBurn ? t.burning : t.burnTokens}
              </button>
              <p className="mt-2 text-xs text-gray-600">
                {t.fee} <strong>{fees.burnFee} SOL</strong>
              </p>
            </div>

            {/* Close Account Section */}
            <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🗑️ {t.closeAccount}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{t.closeAccountDesc}</p>

              {userBalance > 0 ? (
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-300 rounded-xl p-4">
                    <p className="text-orange-800 text-sm font-medium">
                      ⚠️ {t.balanceWarning}
                    </p>
                  </div>

                  <input
                    placeholder={t.refundAddressPlaceholder}
                    value={refundAddress}
                    onChange={(e) => setRefundAddress(e.target.value)}
                    className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
                  />

                  <button
                    onClick={() => performCloseAccount(true)}
                    disabled={burnAndClosing}
                    className="w-full bg-linear-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-50"
                  >
                    {burnAndClosing ? t.closing : t.burnAndClose}
                  </button>
                </div>
              ) : (
                <>
                  {hasTokenAccount && (
                    <input
                      placeholder={t.refundAddressPlaceholder}
                      value={refundAddress}
                      onChange={(e) => setRefundAddress(e.target.value)}
                      className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6] mb-3"
                    />
                  )}
                  {!hasTokenAccount && (
                    <div className="bg-gray-50 border border-gray-300 rounded-2xl p-2 mb-3">
                      <p className="text-gray-700 text-center font-medium">
                        ℹ️ {t.noTokenAccount}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => performCloseAccount(false)}
                    disabled={closing || !hasTokenAccount}
                    className="w-full bg-[#02CCE6] text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-cyan-600"
                  >
                    {closing ? t.closing : t.closeAccount}
                  </button>
                </>
              )}

              <p className="mt-4 text-xs text-gray-600 ">
                {t.fee}{" "}
                <strong>
                  {userBalance > 0
                    ? fees.closeAccountFee + fees.burnFee
                    : fees.closeAccountFee}{" "}
                  SOL
                </strong>
              </p>
            </div>
          </>
        )}
      </form>

      {/* ERROR */}
      <Transition appear show={errorModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setErrorModalOpen(false)}
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
              <div className="flex flex-col items-center">
                <TiCancel className="h-16 w-16 text-red-500 mb-4" />
                <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">
                  {t.txFailed}
                </Dialog.Title>

                <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-700 wrap-break-word">
                    {modalErrorMessage}
                  </p>
                </div>

                <button
                  onClick={() => setErrorModalOpen(false)}
                  className="px-8 py-3 bg-red-500 text-white font-bold rounded-xl"
                >
                  {t.ok}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      {/* SUCCESS */}
      <Transition appear show={successModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setSuccessModalOpen(false)}
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
              <div className="flex flex-col items-center">
                <HiCheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">
                  {t.txSuccess}
                </Dialog.Title>

                <div className="w-full bg-gray-100 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-2">{t.txSignature}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-mono text-gray-800">
                      {shortSig(txSignature)}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(txSignature);
                        toast.success(t.copied);
                      }}
                      className="ml-3 px-4 py-2 bg-[#02CCE6] text-white rounded-lg text-sm"
                    >
                      {t.copy}
                    </button>
                  </div>
                </div>

                <a
                  href={
                    currentNetwork.name === "devnet"
                      ? `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`
                      : `https://explorer.solana.com/tx/${txSignature}`
                  }
                  target="_blank"
                  className="text-[#02CCE6] underline text-sm mb-6"
                >
                  {t.viewOnExplorer} ↗
                </a>

                <button
                  onClick={() => setSuccessModalOpen(false)}
                  className="px-8 py-3 bg-[#02CCE6] text-white font-bold rounded-xl"
                >
                  {t.ok}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </section>
  );
};

export default MinForm;
