/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useSolToolAnchorProgram } from "@/utils/fetch_fee_config";
import { useLanguage } from "@/app/Context/LanguageContext";

import Banner from "@/component/Banner";
import Header from "@/component/Header";
import Footer from "@/component/Footer";

import { IoWalletOutline, IoShieldCheckmarkOutline } from "react-icons/io5";
import { LuArrowDownToLine, LuRefreshCw } from "react-icons/lu";

export default function AdminPage() {
  const { solToolProgram, feeConfigPda } = useSolToolAnchorProgram();
  const { publicKey } = useWallet();
  const { language } = useLanguage();

  // This ensures t always uses the current language
  const t = useMemo(
    () => adminTranslations[language] || adminTranslations.en,
    [language],
  );

  const [feeConfig, setFeeConfig] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [newOwner, setNewOwner] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [fees, setFees] = useState({
    create_token_fee: 0,
    modify_creator_info_fee: 0,
    custom_token_address_fee: 0,
    account_delete_refund_fee: 0,
    revoke_mint_authority_fee: 0,
    revoke_freeze_authority_fee: 0,
    revoke_metadata_authority_fee: 0,
    update_mint_authority_fee: 0,
    update_freeze_authority_fee: 0,
    update_metadata_authority_fee: 0,
    mint_tokens_fee: 0,
    burn_tokens_fee: 0,
    freeze_user_fee: 0,
    unfreeze_user_fee: 0,
    update_metadata_fee: 0,
  });

  const connection = new anchor.web3.Connection(
    process.env.NEXT_PUBLIC_MAINNET_RPC,
    "confirmed",
  );

  const fetchData = async () => {
    if (!solToolProgram || !feeConfigPda) return;

    setRefreshing(true);
    try {
      const account =
        await solToolProgram.account.feeConfig.fetch(feeConfigPda);
      setFeeConfig(account);

      const accountInfo = await connection.getAccountInfo(feeConfigPda);

      if (accountInfo) {
        const balanceLamports = accountInfo.lamports;
        const accountSize = accountInfo.data.length;

        // Get minimum rent-exempt balance for this account size
        const rentExemption =
          await connection.getMinimumBalanceForRentExemption(accountSize);

        const withdrawableLamports = Math.max(
          0,
          balanceLamports - rentExemption,
        );

        setBalance(withdrawableLamports / LAMPORTS_PER_SOL);
      }

      setFees({
        create_token_fee: Number(account.createTokenFee) / LAMPORTS_PER_SOL,
        modify_creator_info_fee:
          Number(account.modifyCreatorInfoFee) / LAMPORTS_PER_SOL,
        custom_token_address_fee:
          Number(account.customTokenAddressFee) / LAMPORTS_PER_SOL,
        account_delete_refund_fee:
          Number(account.accountDeleteRefundFee) / LAMPORTS_PER_SOL,
        revoke_mint_authority_fee:
          Number(account.revokeMintAuthorityFee) / LAMPORTS_PER_SOL,
        revoke_freeze_authority_fee:
          Number(account.revokeFreezeAuthorityFee) / LAMPORTS_PER_SOL,
        revoke_metadata_authority_fee:
          Number(account.revokeMetadataAuthorityFee) / LAMPORTS_PER_SOL,
        update_mint_authority_fee:
          Number(account.updateMintAuthorityFee) / LAMPORTS_PER_SOL,
        update_freeze_authority_fee:
          Number(account.updateFreezeAuthorityFee) / LAMPORTS_PER_SOL,
        update_metadata_authority_fee:
          Number(account.updateMetadataAuthorityFee) / LAMPORTS_PER_SOL,
        mint_tokens_fee: Number(account.mintTokensFee) / LAMPORTS_PER_SOL,
        burn_tokens_fee: Number(account.burnTokensFee) / LAMPORTS_PER_SOL,
        freeze_user_fee: Number(account.freezeUserFee) / LAMPORTS_PER_SOL,
        unfreeze_user_fee: Number(account.unfreezeUserFee) / LAMPORTS_PER_SOL,
        update_metadata_fee:
          Number(account.updateMetadataFee) / LAMPORTS_PER_SOL,
      });
    } catch (err) {
      console.error(err);
      toast.error(t.failedToLoadConfig || "Failed to load fee config");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  function solToLamportsBN(sol) {
    return new BN(Math.round(sol * LAMPORTS_PER_SOL));
  }

  useEffect(() => {
    if (solToolProgram && feeConfigPda) {
      fetchData();
    }
  }, []);

  const isOwner = useMemo(() => {
    return (
      publicKey &&
      feeConfig &&
      publicKey.toString() === feeConfig.owner.toString()
    );
  }, [publicKey, feeConfig]);

  const handleUpdateFees = async () => {
    if (!solToolProgram || !isOwner) return;

    setUpdating(true);
    try {
      const tx = await solToolProgram.methods
        .updateFeeConfig({
          createTokenFee: solToLamportsBN(fees.create_token_fee),
          modifyCreatorInfoFee: solToLamportsBN(fees.modify_creator_info_fee),
          customTokenAddressFee: solToLamportsBN(fees.custom_token_address_fee),
          accountDeleteRefundFee: solToLamportsBN(
            fees.account_delete_refund_fee,
          ),
          revokeMintAuthorityFee: solToLamportsBN(
            fees.revoke_mint_authority_fee,
          ),
          revokeFreezeAuthorityFee: solToLamportsBN(
            fees.revoke_freeze_authority_fee,
          ),
          revokeMetadataAuthorityFee: solToLamportsBN(
            fees.revoke_metadata_authority_fee,
          ),
          updateMintAuthorityFee: solToLamportsBN(
            fees.update_mint_authority_fee,
          ),
          updateFreezeAuthorityFee: solToLamportsBN(
            fees.update_freeze_authority_fee,
          ),
          updateMetadataAuthorityFee: solToLamportsBN(
            fees.update_metadata_authority_fee,
          ),
          mintTokensFee: solToLamportsBN(fees.mint_tokens_fee),
          burnTokensFee: solToLamportsBN(fees.burn_tokens_fee),
          freezeUserFee: solToLamportsBN(fees.freeze_user_fee),
          unfreezeUserFee: solToLamportsBN(fees.unfreeze_user_fee),
          updateMetadataFee: solToLamportsBN(fees.update_metadata_fee),
        })
        .accounts({
          owner: publicKey,
          feeConfig: feeConfigPda,
        })
        .rpc();

      toast.success(t.feesUpdatedSuccess);
      console.log(tx);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || t.transactionFailed);
    } finally {
      setUpdating(false);
    }
  };

  const handleChangeOwner = async () => {
    if (!solToolProgram || !isOwner || !newOwner) return;

    try {
      new PublicKey(newOwner);
    } catch {
      toast.error(t.invalidNewOwnerAddress);
      return;
    }

    setUpdating(true);
    try {
      const tx = await solToolProgram.methods
        .changeOwner(new PublicKey(newOwner))
        .accounts({ currentOwner: publicKey, feeConfig: feeConfigPda })
        .rpc();

      toast.success(t.ownershipTransferred);
      setNewOwner("");
      fetchData();
      console.log(tx);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || t.transactionFailed);
    } finally {
      setUpdating(false);
    }
  };

  const handleWithdraw = async () => {
    if (!solToolProgram || !isOwner) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > balance) {
      toast.error(t.invalidWithdrawAmount);
      return;
    }

    setWithdrawing(true);
    try {
      const lamports = solToLamportsBN(amount);
      const tx = await solToolProgram.methods
        .withdrawFees(new BN(lamports)) // ← Wrap in BN
        .accounts({
          owner: publicKey,
          feeConfig: feeConfigPda,
          receiver: publicKey,
        })
        .rpc();

      toast.success(t.withdrawSuccess.replace("{amount}", amount.toString()));
      setWithdrawAmount("");
      fetchData();
      console.log(tx);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || t.transactionFailed);
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <>
      <Header />
      <Banner />

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#02CCE6] mx-auto"></div>
            <p className="mt-6 text-lg">{t.loadingAdminPanel}</p>
          </div>
        </div>
      )}

      {/* ================= WALLET NOT CONNECTED ================= */}
      {!loading && !publicKey && (
        <div className="text-center py-20">
          <p className="text-2xl text-red-600">{t.connectWalletFirst}</p>
        </div>
      )}

      {/* ================= NOT OWNER ================= */}
      {!loading && publicKey && !isOwner && (
        <div className="max-w-2xl mx-auto text-center py-20">
          <IoShieldCheckmarkOutline className="mx-auto text-6xl text-gray-400 mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {t.accessDenied}
          </h1>
          <p className="text-lg text-gray-600">{t.onlyAdminAccess}</p>
          <p className="mt-4 text-sm text-gray-500 break-all">
            {t.currentOwner}:{" "}
            <span className="font-mono">{feeConfig?.owner.toString()}</span>
          </p>
        </div>
      )}

      {!loading && publicKey && isOwner && (
        <div className="max-w-5xl mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <IoWalletOutline size={36} />
              {t.solToolAdminPanel}
            </h1>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="px-4 py-2 bg-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-300 transition"
            >
              <LuRefreshCw className={refreshing ? "animate-spin" : ""} />
              {t.refresh}
            </button>
          </div>

          {/* Balance Card */}
          <div className="bg-linear-to-r from-cyan-500 to-blue-600 text-white rounded-2xl p-8 mb-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-2">{t.collectedFees}</h2>
            <p className="text-5xl font-bold">{balance.toFixed(4)} SOL</p>
            <p className="text-sm opacity-90 mt-2">
              {t.feeConfigPda}:{" "}
              <span className="font-mono text-xs break-all">
                {feeConfigPda.toString()}
              </span>
            </p>
          </div>

          {/* Update Fees */}
          <div className="bg-white border rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold mb-2">{t.updateFees}</h2>
            <p className="text-sm text-gray-600 mb-6">{t.updateFeesDesc}</p>
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(fees).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t[key.replace(/_/g, "")] || // Try direct key first
                      key
                        .replace(/_/g, " ")
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={value}
                    onChange={(e) =>
                      setFees({
                        ...fees,
                        [key]: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#02CCE6]"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleUpdateFees}
              disabled={updating}
              className="mt-8 px-8 py-4 bg-[#02CCE6] text-white font-bold rounded-xl hover:bg-cyan-600 disabled:opacity-50 transition"
            >
              {updating ? t.updatingFees : t.updateAllFees}
            </button>
          </div>

          {/* ================= Transfer Ownership ================= */}
          <div className="bg-white border rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
              {t.transferOwnership}
            </h2>

            <p className="text-gray-600 mb-4 break-all">
              {t.currentOwner}:{" "}
              <span className="font-mono text-sm sm:text-base">
                {feeConfig.owner.toString()}
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder={t.newOwnerAddress}
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value.trim())}
                className="
        w-full
        border rounded-xl
        px-4 py-3
        text-sm sm:text-base
        focus:outline-none focus:ring-2 focus:ring-orange-400
      "
              />

              <button
                onClick={handleChangeOwner}
                disabled={updating || !newOwner}
                className="
        w-full sm:w-auto
        px-6 py-3
        bg-orange-500 text-white
        font-bold rounded-xl
        hover:bg-orange-600
        disabled:opacity-50
        disabled:cursor-not-allowed
        transition
      "
              >
                {updating ? t.transferringOwnership : t.transferAdmin}
              </button>
            </div>
          </div>

          {/* ================= Withdraw Fees ================= */}
          <div className="bg-white border rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-3">
              <LuArrowDownToLine size={24} className="sm:size-28px" />
              {t.withdrawFees}
            </h2>

            <p className="text-gray-600 mb-4">
              {t.availableBalance}:{" "}
              <span className="font-semibold">{balance.toFixed(4)} SOL</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="number"
                step="0.01"
                min="0"
                max={balance}
                placeholder={t.withdrawAmount}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="
        w-full
        border rounded-xl
        px-4 py-3
        text-sm sm:text-base
        focus:outline-none focus:ring-2 focus:ring-green-400
      "
              />

              <button
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawAmount}
                className="
        w-full sm:w-auto
        px-8 py-3 sm:py-4
        bg-green-600 text-white
        font-bold rounded-xl
        hover:bg-green-700
        disabled:opacity-50
        disabled:cursor-not-allowed
        transition
      "
              >
                {withdrawing ? t.withdrawing : t.withdrawSol}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

const adminTranslations = {
  en: {
    adminPanel: "Admin Panel",
    solToolAdminPanel: "SOL Maker Admin Panel",
    collectedFees: "Collected Fees",
    availableBalance: "Available Balance",
    feeConfigPda: "Fee Config PDA",
    updateFees: "Update Service Fees",
    updateFeesDesc: "All fees are in SOL (e.g., 0.1 = 0.1 SOL)",
    updateAllFees: "Update All Fees",
    updatingFees: "Updating fees...",
    createTokenFee: "Create Token Fee",
    modifyCreatorInfoFee: "Modify Creator Info Fee",
    customTokenAddressFee: "Custom Token Address Fee",
    accountDeleteRefundFee: "Account Delete Refund Fee",
    revokeMintAuthorityFee: "Revoke Mint Authority Fee",
    revokeFreezeAuthorityFee: "Revoke Freeze Authority Fee",
    revokeMetadataAuthorityFee: "Revoke Metadata Authority Fee",
    updateMintAuthorityFee: "Update Mint Authority Fee",
    updateFreezeAuthorityFee: "Update Freeze Authority Fee",
    updateMetadataAuthorityFee: "Update Metadata Authority Fee",
    mintTokensFee: "Mint Tokens Fee",
    burnTokensFee: "Burn Tokens Fee",
    freezeUserFee: "Freeze User Fee",
    unfreezeUserFee: "Unfreeze User Fee",
    updateMetadataFee: "Update Metadata Fee",
    transferOwnership: "Transfer Ownership",
    currentOwner: "Current Owner",
    newOwnerAddress: "New Owner Wallet Address",
    transferAdmin: "Transfer Admin Rights",
    transferringOwnership: "Transferring ownership...",
    withdrawFees: "Withdraw Collected Fees",
    withdrawAmount: "Amount in SOL",
    withdrawSol: "Withdraw SOL",
    withdrawing: "Withdrawing...",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    accessDenied: "Access Denied",
    onlyAdminAccess: "Only the current admin can access this page.",
    connectWalletFirst: "Please connect your wallet first.",
    loadingAdminPanel: "Loading admin panel...",
    feesUpdatedSuccess: "Fees updated successfully!",
    ownershipTransferred: "Ownership transferred successfully!",
    withdrawSuccess: "SOL withdrawn successfully!",
    invalidWithdrawAmount: "Invalid withdraw amount",
    invalidNewOwnerAddress: "Invalid new owner address",
    failedToLoadConfig: "Failed to load fee configuration",
    transactionFailed: "Transaction failed",
    copiedToClipboard: "Copied to clipboard!",
  },
  ko: {
    adminPanel: "관리자 패널",
    solToolAdminPanel: "SOL Maker 관리자 패널",
    collectedFees: "수집된 수수료",
    availableBalance: "사용 가능한 잔액",
    feeConfigPda: "수수료 설정 PDA",
    updateFees: "서비스 수수료 업데이트",
    updateFeesDesc: "모든 수수료는 SOL 단위입니다 (예: 0.1 = 0.1 SOL)",
    updateAllFees: "모든 수수료 업데이트",
    updatingFees: "수수료 업데이트 중...",
    createTokenFee: "토큰 생성 수수료",
    modifyCreatorInfoFee: "창작자 정보 수정 수수료",
    customTokenAddressFee: "사용자 정의 주소 수수료",
    accountDeleteRefundFee: "계정 삭제 환불 수수료",
    revokeMintAuthorityFee: "민트 권한 취소 수수료",
    revokeFreezeAuthorityFee: "프리즈 권한 취소 수수료",
    revokeMetadataAuthorityFee: "메타데이터 권한 취소 수수료",
    updateMintAuthorityFee: "민트 권한 업데이트 수수료",
    updateFreezeAuthorityFee: "프리즈 권한 업데이트 수수료",
    updateMetadataAuthorityFee: "메타데이터 권한 업데이트 수수료",
    mintTokensFee: "토큰 민팅 수수료",
    burnTokensFee: "토큰 소각 수수료",
    freezeUserFee: "사용자 동결 수수료",
    unfreezeUserFee: "사용자 동결 해제 수수료",
    updateMetadataFee: "메타데이터 업데이트 수수료",
    transferOwnership: "소유권 이전",
    currentOwner: "현재 소유자",
    newOwnerAddress: "새 소유자 지갑 주소",
    transferAdmin: "관리자 권한 이전",
    transferringOwnership: "소유권 이전 중...",
    withdrawFees: "수집된 수수료 인출",
    withdrawAmount: "인출 금액 (SOL)",
    withdrawSol: "SOL 인출",
    withdrawing: "인출 중...",
    refresh: "새로고침",
    refreshing: "새로고침 중...",
    accessDenied: "접근 거부",
    onlyAdminAccess: "현재 관리자만 이 페이지에 접근할 수 있습니다.",
    connectWalletFirst: "먼저 지갑을 연결해 주세요.",
    loadingAdminPanel: "관리자 패널 로딩 중...",
    feesUpdatedSuccess: "수수료가 성공적으로 업데이트되었습니다!",
    ownershipTransferred: "소유권이 성공적으로 이전되었습니다!",
    withdrawSuccess: "SOL이 성공적으로 인출되었습니다!",
    invalidWithdrawAmount: "유효하지 않은 인출 금액",
    invalidNewOwnerAddress: "유효하지 않은 새 소유자 주소",
    failedToLoadConfig: "수수료 설정을 불러오지 못했습니다",
    transactionFailed: "트랜잭션 실패",
    copiedToClipboard: "클립보드에 복사되었습니다!",
  },
};
