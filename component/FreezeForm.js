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
  createFreezeAccountInstruction,
  createThawAccountInstruction,
} from "@solana/spl-token";
import toast from "react-hot-toast";
import { useSolToolAnchorProgram } from "@/utils/fetch_fee_config";

const FreezeForm = () => {
  const { language } = useLanguage();
  const { currentNetwork } = useNetwork();
  const { solToolProgram, feeConfigPda } = useSolToolAnchorProgram();
  const wallet = useWallet();

  const [loadingFees, setLoadingFees] = useState(true);
  const [fees, setFees] = useState({ freezeFee: 0, unfreezeFee: 0 }); // In SOL

  const t = {
    en: {
      tokenAddress: "Token Address:",
      enterAddress: "Enter Token Mint Address",
      check: "Check",
      userAddress: "User Address:",
      enterUserAddress: "Enter User Wallet Address",
      freeze: "Freeze",
      unfreeze: "Unfreeze",
      checkStatus: "Check Status",
      fee: "Fee:",
      ownershipConfirmed: "Ownership has not been Confirmed",
      invalidToken: "Invalid SPL Token address",
      notSPLToken: "This is not a valid SPL Token",
      notFreezeAuthority: "You are not the freeze authority for this token",
      invalidUserAddress: "Invalid user address",
      successFreeze: "Account frozen successfully",
      successUnfreeze: "Account unfrozen successfully",
      errorFreeze: "Failed to freeze account",
      errorUnfreeze: "Failed to unfreeze account",
      checking: "Checking...",
      freezing: "Freezing...",
      unfreezing: "Unfreezing...",
      checkingStatus: "Checking Status...",
      frozen: "This address is frozen.",
      notFrozen: "This address is not frozen.",
      noTokenAccount: "No token account found for this user.",
      connectWallet: "Please connect your wallet",
      pleaseWait: "Please wait",
      loadingFee: "Loading fee configuration...",
    },
    ko: {
      pleaseWait: "잠시만 기다려 주세요",
      loadingFee: "수수료 설정을 불러오는 중입니다...",
      tokenAddress: "토큰 주소:",
      enterAddress: "토큰 민트 주소 입력",
      check: "확인",
      userAddress: "사용자 주소:",
      enterUserAddress: "사용자 지갑 주소 입력",
      freeze: "동결",
      unfreeze: "해동",
      checkStatus: "상태 확인",
      fee: "수수료:",
      ownershipConfirmed: "소유권이 확인되지 않았습니다",
      invalidToken: "잘못된 SPL 토큰 주소",
      notSPLToken: "이것은 유효한 SPL 토큰이 아닙니다",
      notFreezeAuthority: "이 토큰의 동결 권한이 없습니다",
      invalidUserAddress: "잘못된 사용자 주소",
      successFreeze: "계정이 성공적으로 동결되었습니다",
      successUnfreeze: "계정이 성공적으로 해동되었습니다",
      errorFreeze: "계정 동결 실패",
      errorUnfreeze: "계정 해동 실패",
      checking: "확인 중...",
      freezing: "동결 중...",
      unfreezing: "해동 중...",
      checkingStatus: "상태 확인 중...",
      frozen: "이 주소는 동결되었습니다.",
      notFrozen: "이 주소는 동결되지 않았습니다.",
      noTokenAccount: "이 사용자에 대한 토큰 계정이 없습니다.",
      connectWallet: "지갑을 연결하세요",
    },
  }[language];

  // Load fees from on-chain config
  useEffect(() => {
    const fetchFees = async () => {
      try {
        const data = await solToolProgram.account.feeConfig.fetch(feeConfigPda);
        if (data) {
          const lamportsToSol = (lamports) => Number(lamports) / 1_000_000_000;
          setFees({
            freezeFee: lamportsToSol(data.freezeUserFee),
            unfreezeFee: lamportsToSol(data.unfreezeUserFee),
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
  const [isFreezeAuthority, setIsFreezeAuthority] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [userAddressFreeze, setUserAddressFreeze] = useState("");
  const [userAddressUnfreeze, setUserAddressUnfreeze] = useState("");
  const [userAddressCheck, setUserAddressCheck] = useState("");
  const [isFrozenStatus, setIsFrozenStatus] = useState(null); // null, true, false
  const [statusMessage, setStatusMessage] = useState("");

  const [updatingFreeze, setUpdatingFreeze] = useState(false);
  const [updatingUnfreeze, setUpdatingUnfreeze] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const connection = useMemo(() => {
    if (!wallet.connected) return null;
    return new Connection(currentNetwork.rpc, "confirmed");
  }, [wallet.connected, currentNetwork]);

  // Reset states on wallet or network change
  useEffect(() => {
    setTokenAddress("");
    setIsValidToken(false);
    setIsFreezeAuthority(false);
    setErrorMessage("");
    setUserAddressFreeze("");
    setUserAddressUnfreeze("");
    setUserAddressCheck("");
    setIsFrozenStatus(null);
    setStatusMessage("");
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
    setIsFreezeAuthority(false);

    try {
      const mintPubkey = validatePubkey(tokenAddress);
      const mint = await getMint(connection, mintPubkey);

      if (!mint.freezeAuthority) {
        throw new Error(t.notFreezeAuthority);
      }

      const isAuth = mint.freezeAuthority.equals(wallet.publicKey);
      if (!isAuth) {
        throw new Error(t.notFreezeAuthority);
      }

      setIsValidToken(true);
      setIsFreezeAuthority(true);
    } catch (error) {
      console.error("Token check error:", error);
      setErrorMessage(error.message || t.notSPLToken);
      toast.error(error.message || t.notSPLToken);
    } finally {
      setChecking(false);
    }
  };

  const getTokenAccount = async (userAddress) => {
    const userPubkey = validatePubkey(userAddress);
    const mintPubkey = new PublicKey(tokenAddress);
    const tokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      userPubkey
    );
    return { tokenAccount, userPubkey };
  };

  const performAction = async (userAddress, isFreeze) => {
    if (!wallet.connected || !connection || !isValidToken || !fees) return;

    if (!userAddress.trim()) {
      toast.error(t.invalidUserAddress);
      return;
    }

    const data = await solToolProgram.account.feeConfig.fetch(feeConfigPda);
    const feeLamports = BigInt(
      isFreeze ? data.freezeUserFee : data.unfreezeUserFee
    );

    try {
      const { tokenAccount } = await getTokenAccount(userAddress);
      const mintPubkey = new PublicKey(tokenAddress);

      // Check if token account exists
      await getAccount(connection, tokenAccount);

      const feeTransferInstr = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: feeConfigPda,
        lamports: feeLamports,
      });

      const actionInstr = isFreeze
        ? createFreezeAccountInstruction(
            tokenAccount,
            mintPubkey,
            wallet.publicKey
          )
        : createThawAccountInstruction(
            tokenAccount,
            mintPubkey,
            wallet.publicKey
          );

      const tx = new Transaction().add(feeTransferInstr).add(actionInstr);

      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      toast.success(isFreeze ? t.successFreeze : t.successUnfreeze);

      // Reset input
      if (isFreeze) setUserAddressFreeze("");
      else setUserAddressUnfreeze("");
    } catch (error) {
      console.error(`${isFreeze ? "Freeze" : "Unfreeze"} failed:`, error);
      if (error.message.includes("Account does not exist")) {
        toast.error(t.noTokenAccount);
      } else {
        toast.error(isFreeze ? t.errorFreeze : t.errorUnfreeze);
      }
    }
  };

  const freezeUser = async () => {
    setUpdatingFreeze(true);
    await performAction(userAddressFreeze, true);
    setUpdatingFreeze(false);
  };

  const unfreezeUser = async () => {
    setUpdatingUnfreeze(true);
    await performAction(userAddressUnfreeze, false);
    setUpdatingUnfreeze(false);
  };

  const checkUserStatus = async () => {
    if (!wallet.connected || !connection || !isValidToken) return;

    if (!userAddressCheck.trim()) {
      toast.error(t.invalidUserAddress);
      return;
    }

    setCheckingStatus(true);
    setIsFrozenStatus(null);
    setStatusMessage("");

    try {
      const { tokenAccount } = await getTokenAccount(userAddressCheck);
      const account = await getAccount(connection, tokenAccount);

      setIsFrozenStatus(account.isFrozen);
      setStatusMessage(account.isFrozen ? t.frozen : t.notFrozen);
    } catch (error) {
      console.error("Check status failed:", error);
      if (error.message.includes("Account does not exist")) {
        setStatusMessage(t.noTokenAccount);
      } else {
        setStatusMessage(t.errorCheck || "Failed to check status");
      }
      toast.error(t.errorCheck || "Failed to check status");
    } finally {
      setCheckingStatus(false);
    }
  };

  const LoadingPage = () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-[#02CCE6] mx-auto"></div>
        <p className="mt-6 text-lg font-medium text-gray-700">{t.loadingFee}</p>
        <p className="mt-1 text-sm text-gray-500">{t.pleaseWait}</p>
      </div>
    </div>
  );

  return (
    <>
      {loadingFees ? (
        <LoadingPage />
      ) : !wallet.connected ? (
        <section className="max-w-3xl mx-auto p-6 text-center">
          <p className="text-red-600 font-semibold">{t.connectWallet}</p>
        </section>
      ) : (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-10">
            {/* ================= Token Input Card ================= */}
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

            {/* ================= Freeze / Unfreeze / Status ================= */}
            {isValidToken && isFreezeAuthority && (
              <div>
                {/* ================= Freeze ================= */}
                <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 mb-4 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    ❄️ {t.freeze}
                  </h3>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      className="flex-1 border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
                      placeholder={t.enterUserAddress}
                      value={userAddressFreeze}
                      onChange={(e) => setUserAddressFreeze(e.target.value)}
                    />

                    <button
                      type="button"
                      onClick={freezeUser}
                      disabled={updatingFreeze || !userAddressFreeze.trim()}
                      className="w-full sm:w-auto bg-[#02CCE6] text-white px-8 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-cyan-600 transition disabled:cursor-not-allowed"
                    >
                      ❄️ {updatingFreeze ? t.freezing : t.freeze}
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-gray-600">
                    💰 {t.fee}{" "}
                    <span className="font-semibold text-gray-800">
                      {fees.freezeFee} SOL
                    </span>
                  </div>
                </div>

                {/* ================= Unfreeze ================= */}
                <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 mb-4 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    🔓 {t.unfreeze}
                  </h3>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      className="flex-1 border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
                      placeholder={t.enterUserAddress}
                      value={userAddressUnfreeze}
                      onChange={(e) => setUserAddressUnfreeze(e.target.value)}
                    />

                    <button
                      type="button"
                      onClick={unfreezeUser}
                      disabled={updatingUnfreeze || !userAddressUnfreeze.trim()}
                      className="w-full sm:w-auto bg-[#02CCE6] text-white px-8 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-cyan-600 transition disabled:cursor-not-allowed"
                    >
                      🔓 {updatingUnfreeze ? t.unfreezing : t.unfreeze}
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-gray-600">
                    💰 {t.fee}{" "}
                    <span className="font-semibold text-gray-800">
                      {fees.unfreezeFee} SOL
                    </span>
                  </div>
                </div>

                {/* ================= Status Check ================= */}
                <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    🔍 {t.checkStatus}
                  </h3>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      className="flex-1 border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
                      placeholder={t.enterUserAddress}
                      value={userAddressCheck}
                      onChange={(e) => setUserAddressCheck(e.target.value)}
                    />

                    <button
                      type="button"
                      onClick={checkUserStatus}
                      disabled={checkingStatus || !userAddressCheck.trim()}
                      className="w-full sm:w-auto bg-[#02CCE6] text-white px-8 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-cyan-600 transition disabled:cursor-not-allowed"
                    >
                      🔎 {checkingStatus ? t.checkingStatus : t.checkStatus}
                    </button>
                  </div>

                  {statusMessage && (
                    <p
                      className={`mt-4 text-sm font-semibold ${
                        isFrozenStatus === true
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {isFrozenStatus ? "❄️ " : "✅ "}
                      {statusMessage}
                    </p>
                  )}
                </div>
              </div>
            )}
          </form>
        </section>
      )}
    </>
  );
};

export default FreezeForm;
