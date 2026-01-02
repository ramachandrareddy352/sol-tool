"use client";

import Image from "next/image";
import {
  createV1,
  mplTokenMetadata,
  mintV1,
  updateV1,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  sol,
  createGenericFile,
  publicKey,
  percentAmount,
  some,
  none,
} from "@metaplex-foundation/umi";
import {
  transferSol,
  setAuthority,
  AuthorityType,
  findAssociatedTokenPda,
  createAssociatedToken,
} from "@metaplex-foundation/mpl-toolbox";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

import { Dialog, Transition } from "@headlessui/react";
import { HiCheckCircle } from "react-icons/hi";

import toast from "react-hot-toast";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import { tokenFormTranslations as translations } from "../utils/TokenFormLanguague";

import { IoInformationCircleOutline } from "react-icons/io5";
import { LuRefreshCw } from "react-icons/lu";
import { IoFlashOutline } from "react-icons/io5";
import { useState, useRef, useMemo, useEffect, Fragment } from "react";
import { TiCancel } from "react-icons/ti";
import { MdOutlineFileUpload } from "react-icons/md";
import { IoIosInformationCircle } from "react-icons/io";
import { FaRegSnowflake, FaLock } from "react-icons/fa";
import { BsGlobe2 } from "react-icons/bs";
import { FaRegClock } from "react-icons/fa6";

import { useLanguage } from "@/app/Context/LanguageContext";
import { useNetwork } from "@/app/Context/NetworkContext";
import { useSolToolAnchorProgram } from "@/utils/fetch_fee_config";

export default function TokenForm() {
  const wallet = useWallet();
  const { solToolProgram, feeConfigPda } = useSolToolAnchorProgram();
  const { language } = useLanguage();
  const { currentNetwork } = useNetwork();
  const t = translations[language];

  const fileInputRef = useRef(null);

  const [loadingFees, setLoadingFees] = useState(true);
  const [fees, setFees] = useState({
    createTokenFee: 0.1,
    modifyCreatorInfoFee: 0.1,
    customTokenAddressFee: 0.1,
    accountDeleteRefundFee: 0.1,
    revokeMintAuthorityFee: 0.1,
    revokeFreezeAuthorityFee: 0.1,
    revokeMetadataAuthorityFee: 0.1,
  });

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdMintAddress, setCreatedMintAddress] = useState("");

  const [creatingToken, setCreatingToken] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(6);
  const [supply, setSupply] = useState(0);
  const [description, setDescription] = useState("");

  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [discord, setDiscord] = useState("");

  const [socialSwitch, setSocialSwitch] = useState(true);
  const [advanceSwitch, setAdvanceSwitch] = useState(false);
  const [freeze, setFreeze] = useState(false);
  const [mintAuth, setMintAuth] = useState(true);
  const [update, setUpdate] = useState(true);
  const [isChecked, setIsChecked] = useState(true);
  const [isCheck, setIsCheck] = useState(false);
  const [showPersonal, setShowPersonal] = useState(false);

  const [creatorName, setCreatorName] = useState("");
  const [creatorWeb, setCreatorWeb] = useState("");
  const [creatorAddress, setCreatorAddress] = useState("");
  const [removeCreator, setRemoveCreator] = useState(false);

  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMint, setGeneratedMint] = useState(null);

  const [deletion, setDeletion] = useState(true);
  const [activeOption, setActiveOption] = useState("owner");
  const [customRefundAddress, setCustomRefundAddress] = useState("");

  const resetAllStates = () => {
    // Image & basic token info
    setImage(null);
    setPreviewUrl(null);
    setName("");
    setSymbol("");
    setDecimals(6);
    setSupply(0);
    setDescription("");

    // Social links
    setWebsite("");
    setTwitter("");
    setTelegram("");
    setDiscord("");

    // Switches & authorities
    setSocialSwitch(true);
    setAdvanceSwitch(false);
    setFreeze(false);
    setMintAuth(true);
    setUpdate(true);
    setIsChecked(true);
    setIsCheck(false);
    setShowPersonal(false);

    // Creator metadata
    setCreatorName("");
    setCreatorWeb("");
    setCreatorAddress("");
    setRemoveCreator(false);

    // Vanity mint
    setPrefix("");
    setSuffix("");
    setIsGenerating(false);
    setGeneratedMint(null);

    // Close account options
    setDeletion(true);
    setActiveOption("owner");
    setCustomRefundAddress("");
  };

  // Dedicated connection for SPL token queries
  const connection = useMemo(() => {
    return new Connection(currentNetwork.rpc, "confirmed");
  }, [currentNetwork]);

  const umi = useMemo(() => {
    if (!wallet.connected || !wallet.publicKey || !connection) return null;
    return createUmi(connection.rpcEndpoint)
      .use(walletAdapterIdentity(wallet))
      .use(mplTokenMetadata())
      .use(irysUploader());
  }, [wallet.connected, wallet.publicKey, connection]);

  // Fetch fees from on-chain FeeConfig
  useEffect(() => {
    const fetchFees = async () => {
      if (!solToolProgram) {
        console.warn("SolTool program not loaded – using defaults");
        setLoadingFees(false);
        return;
      }
      try {
        const account = await solToolProgram.account.feeConfig.fetch(
          feeConfigPda
        );
        setFees({
          createTokenFee: Number(account.createTokenFee) / 1_000_000_000,
          modifyCreatorInfoFee:
            Number(account.modifyCreatorInfoFee) / 1_000_000_000,
          customTokenAddressFee:
            Number(account.customTokenAddressFee) / 1_000_000_000,
          accountDeleteRefundFee:
            Number(account.accountDeleteRefundFee) / 1_000_000_000,
          revokeMintAuthorityFee:
            Number(account.revokeMintAuthorityFee) / 1_000_000_000,
          revokeFreezeAuthorityFee:
            Number(account.revokeFreezeAuthorityFee) / 1_000_000_000,
          revokeMetadataAuthorityFee:
            Number(account.revokeMetadataAuthorityFee) / 1_000_000_000,
        });
      } catch (err) {
        console.error("Fee fetch error:", err);
      } finally {
        setLoadingFees(false);
      }
    };
    fetchFees();
  }, [solToolProgram]);

  const totalFee =
    fees.createTokenFee +
    (advanceSwitch ? fees.modifyCreatorInfoFee : 0) +
    (showPersonal ? fees.customTokenAddressFee : 0) +
    (deletion ? fees.accountDeleteRefundFee : 0) +
    (mintAuth ? fees.revokeMintAuthorityFee : 0) +
    (freeze ? fees.revokeFreezeAuthorityFee : 0) +
    (update ? fees.revokeMetadataAuthorityFee : 0);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error(t?.invalidImageFile);
        return;
      }
      if (file.size > 1024 * 1024) {
        toast.error(t?.imageTooLarge);
        return;
      }
      setImage(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleImageClick = () => fileInputRef.current?.click();

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const generateVanityAddress = async () => {
    if (!umi || !wallet.connected) {
      toast.error(t?.connectWalletFirst);
      return;
    }
    if (!showPersonal) return;

    const prefixStr = isChecked ? prefix.trim() : "";
    const suffixStr = isCheck ? suffix.trim() : "";

    if ((prefixStr + suffixStr).length > 8) {
      toast.error(t?.vanityLengthError);
      return;
    }

    setIsGenerating(true);
    setGeneratedMint(null);

    try {
      let attempts = 0;
      const maxAttempts = 1_000_000;
      while (attempts < maxAttempts) {
        const candidate = generateSigner(umi);
        const addr = candidate.publicKey.toString();
        if (
          (!prefixStr || addr.startsWith(prefixStr)) &&
          (!suffixStr || addr.endsWith(suffixStr))
        ) {
          setGeneratedMint(candidate);
          toast.success(t?.vanitySuccess);
          return;
        }
        attempts++;
        if (attempts % 10_000 === 0) await new Promise((r) => setTimeout(r, 0));
      }
      toast.error(t?.vanityTimeout);
    } catch (err) {
      toast.error(t?.vanityFailed);
    } finally {
      setIsGenerating(false);
    }
  };

  const createSPLToken = async () => {
    if (!umi || !wallet.connected) {
      toast.error(t?.connectWalletFirst);
      return;
    }
    if (!name.trim() || !symbol.trim() || !image || !description.trim()) {
      toast.error(t?.fillAllFields);
      return;
    }

    if (advanceSwitch && !removeCreator) {
      if (!creatorAddress.trim() || !creatorName.trim() || !creatorWeb.trim()) {
        toast.error(t?.invalidAdvancedCreator);
        return;
      }
      try {
        publicKey(creatorAddress.trim()); // Will throw if invalid
      } catch (err) {
        toast.error(t?.invalidCreatorAddress);
        return;
      }
    }

    setCreatingToken(true);
    try {
      const mintSigner =
        showPersonal && generatedMint ? generatedMint : generateSigner(umi);

      const imageBuffer = await image.arrayBuffer();
      const umiImage = createGenericFile(
        new Uint8Array(imageBuffer),
        image.name || "image.png",
        {
          contentType: image.type || "image/png",
        }
      );
      const [imageUri] = await umi.uploader.upload([umiImage]);

      let creators = [];
      if (advanceSwitch && !removeCreator) {
        const addr = publicKey(creatorAddress.trim());
        creators = [{ address: addr, verified: false, share: 100 }];
      } else if (!advanceSwitch) {
        creators = [{ address: feeConfigPda, verified: false, share: 100 }];
      }

      let externalUrl = socialSwitch && website.trim() ? website.trim() : "";

      const properties = {
        files: [{ uri: imageUri, type: image.type || "image/png" }],
        category: "image",
      };
      if (socialSwitch) {
        const links = {};
        if (twitter.trim()) links.twitter = twitter.trim();
        if (telegram.trim()) links.telegram = telegram.trim();
        if (discord.trim()) links.discord = discord.trim();
        if (Object.keys(links).length > 0) properties.links = links;
      }

      const metadataJson = {
        name: name.trim(),
        symbol: symbol.trim(),
        description: description.trim(),
        image: imageUri,
        external_url: externalUrl,
        properties,
      };

      // Add creator object if advanced creator info is enabled and at least one field is filled
      if (advanceSwitch && !removeCreator) {
        const creatorInfo = {};
        if (creatorName.trim()) creatorInfo.name = creatorName.trim();
        if (creatorWeb.trim()) creatorInfo.website = creatorWeb.trim();

        if (Object.keys(creatorInfo).length > 0) {
          metadataJson.creator = creatorInfo;
        }
      }

      const metadataUri = await umi.uploader.uploadJson(metadataJson);

      let txBuilder = createV1(umi, {
        mint: mintSigner,
        name: name.trim(),
        symbol: symbol.trim(),
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(0),
        decimals,
        tokenStandard: TokenStandard.Fungible,
        creators: advanceSwitch && removeCreator ? none() : some(creators),
        isMutable: some(!update),
      });

      // Pay service fee
      txBuilder = txBuilder.prepend(
        transferSol(umi, {
          source: umi.identity.publicKey,
          destination: feeConfigPda,
          amount: sol(totalFee),
        })
      );

      let tokenAccount = null;
      if (supply > 0) {
        tokenAccount = findAssociatedTokenPda(umi, {
          mint: mintSigner.publicKey,
          owner: umi.identity.publicKey,
        });

        txBuilder = txBuilder
          .add(
            createAssociatedToken(umi, {
              payer: umi.identity,
              ata: tokenAccount[0],
              owner: umi.identity.publicKey,
              mint: mintSigner.publicKey,
            })
          )
          .add(
            mintV1(umi, {
              mint: mintSigner.publicKey,
              authority: umi.identity,
              amount: BigInt(supply) * 10n ** BigInt(decimals),
              tokenOwner: umi.identity.publicKey,
              token: tokenAccount[0],
              tokenStandard: TokenStandard.Fungible,
            })
          );
      }

      if (mintAuth) {
        txBuilder = txBuilder.add(
          setAuthority(umi, {
            owned: mintSigner.publicKey,
            owner: umi.identity,
            authorityType: AuthorityType.MintTokens,
            newAuthority: null,
          })
        );
      }
      if (freeze) {
        txBuilder = txBuilder.add(
          setAuthority(umi, {
            owned: mintSigner.publicKey,
            owner: umi.identity,
            authorityType: AuthorityType.FreezeAccount,
            newAuthority: null,
          })
        );
      }
      if (update) {
        txBuilder = txBuilder.add(
          updateV1(umi, {
            mint: mintSigner.publicKey,
            authority: umi.identity,
            newUpdateAuthority: null,
            isMutable: some(false),
          })
        );
      }

      if (deletion && activeOption !== "owner" && supply > 0 && tokenAccount) {
        let closeAuth;
        if (activeOption === "sol") closeAuth = feeConfigPda;
        else if (activeOption === "token") {
          if (creators.length === 0)
            throw new Error("No creator for token refund");
          closeAuth = creators[0].address;
        } else if (activeOption === "custom") {
          closeAuth = publicKey(customRefundAddress.trim());
        }
        txBuilder.add(
          setAuthority(umi, {
            owned: tokenAccount[0],
            owner: umi.identity,
            authorityType: AuthorityType.CloseAccount,
            newAuthority: closeAuth,
          })
        );
      }

      await txBuilder.sendAndConfirm(umi);

      const mintAddress = mintSigner.publicKey.toString();
      setCreatedMintAddress(mintAddress);
      setSuccessModalOpen(true);
      toast.success(`Token created! Mint: ${mintAddress}`);
      resetAllStates();
    } catch (error) {
      console.error(error);
      toast.error(t?.tokenCreateFailed);
    } finally {
      setCreatingToken(false);
    }
  };

  // Loading screen
  if (loadingFees) {
    return (
      <div className="flex items-center justify-center min-h-400px">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-[#02CCE6] mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-gray-700">
            {translations[language].loadingFee}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {translations[language].pleaseWait}
          </p>
        </div>
      </div>
    );
  }

  if (!wallet.connected) {
    return (
      <div className="text-center py-20">
        <p className="text-2xl font-bold text-red-600">
          {t?.connectWalletFirst}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={(e) => e.preventDefault()} className="mt-8">
        {/* Token Details */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            🪙 {t?.tokenDetails}
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <TooltipLabel label={t?.name} tooltip={t?.nameTooltip} required />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v.length > 50) toast.error(t?.nameExceedLengthError);
                  else setName(v);
                }}
                placeholder={t?.nameplace}
                className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
              />
            </div>
            <div className="flex flex-col">
              <TooltipLabel
                label={t?.symbol}
                tooltip={t?.symbolTooltip}
                required
              />
              <input
                type="text"
                value={symbol}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v.length > 10) toast.error(t?.symbolExceedLengthError);
                  else setSymbol(v);
                }}
                placeholder={t?.symbolplace}
                className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
              />
            </div>
            <div className="flex flex-col">
              <TooltipLabel
                label={t?.decimals}
                tooltip={t?.decimalTooltip}
                required
              />
              <input
                type="number"
                value={decimals}
                min={1}
                max={12}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v < 1 || v > 12) toast.error(t?.decimalError);
                  else setDecimals(v);
                }}
                className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
              />
              <p className="text-xs text-gray-500 mt-1">{t?.decimaldesc}</p>
            </div>
            <div className="flex flex-col">
              <TooltipLabel label={t?.supply} tooltip={t?.supplyTooltip} />
              <input
                type="number"
                value={supply}
                onChange={(e) => setSupply(Number(e.target.value) || 0)}
                className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
              />
              <p className="text-xs text-gray-500 mt-1">{t?.supplydesc}</p>
            </div>
          </div>
        </div>

        {/* Description & Image */}
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <div className="bg-white border border-[#E6E8EC] rounded-2xl p-3 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📝 {t?.description}{" "}
              <sup className="text-red-500 font-bold">*</sup>
            </h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t?.descriptionDesc}
              rows={10}
              className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-[#02CCE6]"
            />
          </div>
          <div className="bg-white border border-[#E6E8EC] rounded-2xl p-3 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              🖼️ {t?.image}
              <sup className="text-red-500 font-bold">*</sup>
            </h3>
            <div
              onClick={handleImageClick}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className="relative border-2 border-dashed border-[#E6E8EC] rounded-xl h-56 cursor-pointer overflow-hidden hover:border-[#02CCE6] transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              {previewUrl ? (
                <>
                  <Image
                    src={previewUrl}
                    alt="Token"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                  {isHovering && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageClick();
                        }}
                        className="px-4 py-2 bg-white text-black rounded-lg font-semibold"
                      >
                        {t?.Change}
                      </button>
                      <button
                        onClick={handleRemoveImage}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold"
                      >
                        {t?.Remove}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MdOutlineFileUpload size={42} />
                  <p className="mt-2 text-sm font-medium">{t?.uploadImage}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">{t?.uploadImageDesc}</p>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 mt-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              🌐 {t?.addLinks}
            </h3>
            <label className="switch">
              <input
                type="checkbox"
                checked={socialSwitch}
                onChange={() => setSocialSwitch(!socialSwitch)}
              />
              <span className="slider"></span>
            </label>
          </div>
          {socialSwitch && (
            <>
              <p className="text-sm text-gray-500 mb-4">{t?.addLinksDesc}</p>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold">Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder={t?.websitedesc}
                    className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold">Twitter / X</label>
                  <input
                    type="url"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder={t?.twitterdesc}
                    className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold">Telegram</label>
                  <input
                    type="url"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder={t?.telegramdesc}
                    className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold">Discord</label>
                  <input
                    type="url"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    placeholder={t?.discorddesc}
                    className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Advanced Options – Modify Creator */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm my-8">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6 gradient-text2">
            ⚙️ {translations[language]?.advancedOptions}
          </h2>
          <div className="border border-[#E6E8EC] rounded-xl p-5 bg-[#FCFCFD]">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[16px] text-gray-800">
                  👤 {t?.modifyCreator}
                </h3>
                <div className="relative group">
                  <IoIosInformationCircle className="text-gray-400 cursor-pointer" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block w-64 text-xs text-white bg-black/80 px-3 py-2 rounded-lg shadow-lg z-50">
                    {t?.modifyCreatorDesc}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#02CCE6]">
                  +{fees.modifyCreatorInfoFee} SOL
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={advanceSwitch}
                    onChange={() => setAdvanceSwitch(!advanceSwitch)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
            {advanceSwitch && (
              <div className="mt-6 flex flex-col gap-5">
                <p className="text-sm text-gray-500">{t?.modifyCreatorDesc}</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">
                      🏷️ {t?.creatorName}
                    </label>
                    <input
                      type="text"
                      value={creatorName}
                      disabled={removeCreator}
                      onChange={(e) => setCreatorName(e.target.value)}
                      placeholder={t?.createNamePlace}
                      className={`border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6] ${
                        removeCreator ? "bg-gray-200 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">
                      🌐 {t?.creatorWeb}
                    </label>
                    <input
                      type="url"
                      value={creatorWeb}
                      disabled={removeCreator}
                      onChange={(e) => setCreatorWeb(e.target.value)}
                      placeholder={t?.createWebPlace}
                      className={`border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6] ${
                        removeCreator ? "bg-gray-200 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    🔑 {t?.creatorAddress}
                  </label>
                  <input
                    type="text"
                    value={creatorAddress}
                    disabled={removeCreator}
                    onChange={(e) => setCreatorAddress(e.target.value)}
                    placeholder={t?.enterAddress}
                    className={`border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6] ${
                      removeCreator ? "bg-gray-200 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={removeCreator}
                      onChange={(e) => setRemoveCreator(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                  <span className="text-sm font-semibold text-gray-700">
                    {t?.removeOption}
                  </span>
                  <div className="relative group">
                    <IoInformationCircleOutline
                      size={18}
                      className="text-gray-400 cursor-pointer"
                    />
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block w-64 text-xs text-white bg-black/80 px-3 py-2 rounded-lg shadow-lg z-50">
                      {t?.removeCreatorTooltip}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Revoke Authorities */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm my-8">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
            🔒 {t?.revokeAuthorities}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {t?.revokeAuthoritiesDesc}
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div
              className={`relative rounded-xl border-2 p-4 bg-[#FCFCFD] transition ${
                freeze ? "border-grad" : "border-[#E6E8EC]"
              }`}
            >
              <div className="flex items-start">
                <div className="icon-grad">
                  <FaRegSnowflake
                    size={20}
                    color={freeze ? "#00b5cd" : "#777"}
                  />
                </div>
                <div className="flex-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-semibold ${
                        freeze ? "gradient-text2" : ""
                      }`}
                    >
                      {t?.revokeFreeze}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-[#02CCE6]">
                        +{fees.revokeFreezeAuthorityFee} SOL
                      </span>
                      <label className="switch-2">
                        <input
                          type="checkbox"
                          checked={freeze}
                          onChange={() => setFreeze(!freeze)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                  <p className="text-[#777E90] mt-1">{t?.revokeFreezeDesc}</p>
                </div>
              </div>
            </div>

            <div
              className={`relative rounded-xl border-2 p-4 bg-[#FCFCFD] transition ${
                mintAuth ? "border-grad" : "border-[#E6E8EC]"
              }`}
            >
              <div className="flex items-start">
                <TiCancel size={22} color={mintAuth ? "#00b5cd" : "#777"} />
                <div className="flex-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-semibold ${
                        mintAuth ? "gradient-text2" : ""
                      }`}
                    >
                      {t?.revokeMint}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-[#02CCE6]">
                        +{fees.revokeMintAuthorityFee} SOL
                      </span>
                      <label className="switch-2">
                        <input
                          type="checkbox"
                          checked={mintAuth}
                          onChange={() => setMintAuth(!mintAuth)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                  <p className="text-[#777E90] mt-1">{t?.revokeMintDesc}</p>
                </div>
              </div>
            </div>

            <div
              className={`relative rounded-xl border-2 p-4 bg-[#FCFCFD] transition ${
                update ? "border-grad" : "border-[#E6E8EC]"
              }`}
            >
              <div className="flex items-start">
                <FaLock size={18} color={update ? "#00b5cd" : "#777"} />
                <div className="flex-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-semibold ${
                        update ? "gradient-text2" : ""
                      }`}
                    >
                      {t?.revokeUpdate}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-[#02CCE6]">
                        +{fees.revokeMetadataAuthorityFee} SOL
                      </span>
                      <label className="switch-2">
                        <input
                          type="checkbox"
                          checked={update}
                          onChange={() => setUpdate(!update)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                  <p className="text-[#777E90] mt-1">{t?.revokeUpdateDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personalization */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm my-8">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
            <BsGlobe2 /> {t?.personalization}
          </h2>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{t?.claim}</span>
              <IoIosInformationCircle className="text-gray-400" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#02CCE6]">
                +{fees.customTokenAddressFee} SOL
              </span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showPersonal}
                  onChange={() => setShowPersonal(!showPersonal)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{t?.personalize}</p>
          {showPersonal && (
            <>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <div className="flex justify-between items-center mb-1 mx-2">
                    <label className="font-semibold text-sm">
                      {t?.prefix}{" "}
                      <span className="text-gray-400 ml-1">({t?.max4})</span>
                    </label>
                    <label className="switch-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => setIsChecked(!isChecked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={prefix}
                    disabled={!isChecked}
                    onChange={(e) =>
                      e.target.value.length <= 4 && setPrefix(e.target.value)
                    }
                    placeholder={t?.pumpfront}
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6] ${
                      !isChecked ? "bg-gray-200 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-sm">
                      {t?.suffix}{" "}
                      <span className="text-gray-400 ml-1">({t?.max4})</span>
                    </label>
                    <label className="switch-2">
                      <input
                        type="checkbox"
                        checked={isCheck}
                        onChange={() => setIsCheck(!isCheck)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={suffix}
                    disabled={!isCheck}
                    onChange={(e) =>
                      e.target.value.length <= 4 && setSuffix(e.target.value)
                    }
                    placeholder={t?.pump}
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6] ${
                      !isCheck ? "bg-gray-200 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-6 border rounded-2xl p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <IoFlashOutline /> {t?.addGen}
                </div>
                <div
                  className="flex items-center gap-2 text-[#00c8f8] cursor-pointer"
                  onClick={generateVanityAddress}
                >
                  <LuRefreshCw className={isGenerating ? "animate-spin" : ""} />
                  {isGenerating ? t?.generating : t?.gend}
                </div>
              </div>
              {generatedMint && (
                <div className="bg-green-100 mt-4 p-3 rounded-xl text-sm max-h-24 overflow-y-auto">
                  <strong className="block mb-1">{t?.generatedAddress}</strong>
                  <span className="break-all">
                    {generatedMint.publicKey.toString()}
                  </span>
                </div>
              )}
              <div className="bg-[#fff9df] mt-4 p-3 rounded-xl flex gap-2 items-center text-sm">
                <FaRegClock /> {t?.paraprocess}
              </div>
            </>
          )}
        </div>

        {/* Account Deletion */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm my-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">🗑️ {t?.accdel}</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#02CCE6]">
                +{fees.accountDeleteRefundFee} SOL
              </span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={deletion}
                  onChange={() => setDeletion(!deletion)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          {deletion && (
            <>
              <p className="text-sm text-gray-600 mb-4">{t?.accdesc}</p>
              <div className="grid md:grid-cols-4 gap-4">
                {["sol", "token", "owner", "custom"].map((opt) => (
                  <div
                    key={opt}
                    className="flex items-center justify-between border rounded-xl p-3"
                  >
                    <span className="text-sm font-semibold">
                      {opt === "sol"
                        ? t?.soltool
                        : opt === "token"
                        ? t?.tokenCreator
                        : opt === "owner"
                        ? t?.accOwner
                        : t?.customAddress}
                    </span>
                    <label className="switch-2">
                      <input
                        type="checkbox"
                        checked={activeOption === opt}
                        onChange={() =>
                          setActiveOption(activeOption === opt ? "" : opt)
                        }
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                ))}
              </div>
              {activeOption === "custom" && (
                <input
                  type="text"
                  value={customRefundAddress}
                  onChange={(e) => setCustomRefundAddress(e.target.value)}
                  placeholder={t?.enadd}
                  className="mt-4 w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#02CCE6]"
                />
              )}
            </>
          )}
        </div>

        {/* Submit */}
        <div className="text-center my-10">
          <p className="text-sm mb-2">
            {t?.totalFees}{" "}
            <span className="text-[#02CCE6] font-bold text-xl">
              {totalFee.toFixed(4)} SOL
            </span>
          </p>
          <button
            type="button"
            onClick={createSPLToken}
            disabled={
              creatingToken || !name || !symbol || !image || !description
            }
            className="bg-[#02CCE6] px-10 py-4 rounded-2xl text-white text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-600 transition"
          >
            {creatingToken ? t?.tokenCreating : t?.createToken}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      <Transition appear show={successModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setSuccessModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-transparent backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                  <div className="flex flex-col items-center">
                    <HiCheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-bold text-gray-900 mb-4"
                    >
                      {t?.tokenCreated || "Token Created Successfully!"}
                    </Dialog.Title>

                    <div className="w-full bg-gray-100 rounded-xl p-4 mb-6">
                      <p className="text-sm text-gray-600 mb-2">
                        {t?.mintAddress || "Mint Address"}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-mono break-all text-gray-800">
                          {createdMintAddress}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(createdMintAddress);
                            toast.success(t?.copied || "Copied to clipboard!");
                          }}
                          className="ml-3 px-4 py-2 bg-[#02CCE6] text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition"
                        >
                          {t?.copy || "Copy"}
                        </button>
                      </div>
                    </div>

                    <a
                      href={
                        currentNetwork.name === "mainnet"
                          ? `https://solscan.io/token/${createdMintAddress}`
                          : `https://solscan.io/token/${createdMintAddress}?cluster=devnet`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#02CCE6] underline text-sm mb-6 hover:text-cyan-700"
                    >
                      {t?.viewOnExplorer || "View on Solscan Explorer"} ↗
                    </a>

                    <button
                      type="button"
                      className="px-8 py-3 bg-[#02CCE6] text-white font-bold rounded-xl hover:bg-cyan-600 transition"
                      onClick={() => setSuccessModalOpen(false)}
                    >
                      OK
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

function TooltipLabel({ label, tooltip, required = false }) {
  return (
    <label className="flex items-center gap-1 text-black mb-1">
      {required && <sup className="text-red-500 font-bold">*</sup>}
      <span>{label}</span>
      {tooltip && (
        <div className="relative group">
          <IoInformationCircleOutline
            size={18}
            className="text-gray-400 cursor-pointer"
          />
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block w-64 text-xs text-white bg-black/80 px-3 py-2 rounded-lg shadow-lg z-50">
            {tooltip}
          </div>
        </div>
      )}
    </label>
  );
}
