"use client";

import Image from "next/image";
import {
  createV1,
  findMetadataPda,
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

import toast from "react-hot-toast";
import { useWallet } from "@solana/wallet-adapter-react";

import { tokenFormTranslations as translations } from "../utils/TokenFormLanguague";

import { IoInformationCircleOutline } from "react-icons/io5";
import { LuRefreshCw } from "react-icons/lu";
import { IoFlashOutline } from "react-icons/io5";
import { useState, useRef, useMemo } from "react";
import { TiCancel } from "react-icons/ti";
import { MdOutlineFileUpload } from "react-icons/md";
import { IoIosInformationCircle } from "react-icons/io";
import { FaRegSnowflake, FaLock } from "react-icons/fa";
import { BsGlobe2 } from "react-icons/bs";
import { FaRegClock } from "react-icons/fa6";

import { useLanguage } from "@/app/Context/LanguageContext";

export default function TokenForm() {
  const wallet = useWallet();
  const fileInputRef = useRef(null);

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

  const { language } = useLanguage();

  const umi = useMemo(() => {
    if (!wallet.connected || !wallet.publicKey) return null;
    return createUmi("https://api.devnet.solana.com")
      .use(walletAdapterIdentity(wallet))
      .use(mplTokenMetadata())
      .use(irysUploader());
  }, [wallet]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };
  const handleSocialSwitch = () => {
    setSocialSwitch((prev) => !prev);
  };
  const handleAdvanceSwitch = () => {
    setAdvanceSwitch((prev) => !prev);
  };
  const handleFreeze = () => {
    setFreeze((prev) => !prev);
  };
  const handleMintAuth = () => {
    setMintAuth((prev) => !prev);
  };
  const handleUpdate = () => {
    setUpdate((prev) => !prev);
  };

  const generateVanityAddress = async () => {
    if (!umi || !wallet.connected) {
      toast.error(translations[language]?.connectWalletFirst);
      return;
    }

    if (!showPersonal) return;

    const prefixStr = isChecked ? prefix.trim() : "";
    const suffixStr = isCheck ? suffix.trim() : "";

    if ((prefixStr + suffixStr).length > 8) {
      toast.error(translations[language]?.vanityLengthError);
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
          toast.success(translations[language]?.vanitySuccess);
          return;
        }

        attempts++;

        if (attempts % 10_000 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      toast.error(translations[language]?.vanityTimeout);
    } catch (error) {
      console.error(translations[language]?.vanityGenError + error);
      toast.error(translations[language]?.vanityFailed);
    } finally {
      setIsGenerating(false);
    }
  };

  const createSPLToken = async () => {
    if (!wallet.connected || !wallet.publicKey || !umi) {
      toast.error(translations[language]?.connectWalletFirst);
      return;
    }
    if (!name || !symbol || !image || !description) {
      toast.error(translations[language]?.fillAllFields);
      return;
    }

    const feeAddress = publicKey(
      "Ezapurmy7RCgNo2F41xSsf6yk5mvtStkoqVQnw9fkaqN"
    );

    setCreatingToken(true);
    try {
      let mintSigner;
      if (showPersonal && generatedMint) {
        mintSigner = generatedMint;
      } else {
        mintSigner = generateSigner(umi);
      }

      const imageBuffer = await image.arrayBuffer();
      const umiImage = createGenericFile(
        new Uint8Array(imageBuffer),
        image.name || "image.png",
        { contentType: image.type || "image/png" }
      );

      const [imageUri] = await umi.uploader.upload([umiImage]);

      let externalUrl = socialSwitch ? website : "";
      let attributes = [];
      let properties = {
        files: [
          {
            uri: imageUri,
            type: image.type || "image/png",
          },
        ],
        category: "image",
      };
      let creators;
      if (advanceSwitch) {
        if (removeCreator) {
          creators = undefined;
        } else {
          const finalCreatorName = creatorName || "SolTool";
          const finalCreatorWeb = creatorWeb || "https://soltool.com";
          const finalCreatorAddress = creatorAddress;
          const creatorAddr = publicKey(finalCreatorAddress);
          creators = [
            {
              address: creatorAddr,
              verified: false,
              share: 100,
            },
          ];
          attributes.push({
            trait_type: "Creator",
            value: finalCreatorName,
          });
          if (!socialSwitch) {
            externalUrl = finalCreatorWeb;
          }
        }
      } else {
        creators = [
          {
            address: publicKey("Ezapurmy7RCgNo2F41xSsf6yk5mvtStkoqVQnw9fkaqN"),
            verified: false,
            share: 100,
          },
        ];
      }

      if (socialSwitch) {
        properties.links = {};
        if (twitter) {
          properties.links.twitter = twitter;
        }
        if (telegram) {
          properties.links.telegram = telegram;
        }
        if (discord) {
          properties.links.discord = discord;
        }
        if (Object.keys(properties.links).length === 0) {
          delete properties.links;
        }
      }

      const metadataJson = {
        name,
        symbol,
        description,
        image: imageUri,
        external_url: externalUrl,
        properties,
        ...(attributes.length > 0 && { attributes }),
      };

      const metadataUri = await umi.uploader.uploadJson(metadataJson);

      let txBuilder = createV1(umi, {
        mint: mintSigner,
        name,
        symbol,
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(100),
        decimals,
        tokenStandard: TokenStandard.Fungible,
        creators,
      }).setFeePayer(umi.identity);

      const feeAmount = sol(totalFee);

      txBuilder = txBuilder.prepend(
        transferSol(umi, {
          source: umi.identity,
          destination: feeAddress,
          amount: feeAmount,
        })
      );

      let tokenAccount = null;
      if (supply > 0) {
        tokenAccount = findAssociatedTokenPda(umi, {
          mint: mintSigner.publicKey,
          owner: umi.identity.publicKey,
        });

        txBuilder = txBuilder.add(
          createAssociatedToken(umi, {
            payer: umi.identity,
            ata: tokenAccount.publicKey,
            owner: umi.identity.publicKey,
            mint: mintSigner.publicKey,
          })
        );

        const amount = BigInt(supply) * 10n ** BigInt(decimals);

        txBuilder = txBuilder.add(
          mintV1(umi, {
            mint: mintSigner.publicKey,
            authority: umi.identity,
            tokenOwner: tokenAccount.publicKey,
            amount,
            tokenStandard: TokenStandard.Fungible,
          })
        );
      }

      if (mintAuth) {
        txBuilder = txBuilder.add(
          setAuthority(umi, {
            owned: mintSigner.publicKey,
            owner: umi.identity.publicKey,
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
        const metadataPda = findMetadataPda(umi, {
          mint: mintSigner.publicKey,
        });
        txBuilder = txBuilder.add(
          updateV1(umi, {
            mint: mintSigner.publicKey,
            metadata: metadataPda,
            newUpdateAuthority: null,
            isMutable: null,
          })
        );
      }

      if (deletion && activeOption && activeOption !== "owner" && supply > 0) {
        let closeAuth;
        if (activeOption === "sol") {
          closeAuth = feeAddress;
        } else if (activeOption === "token") {
          if (!creators || creators.length === 0) {
            toast.error(translations[language]?.noCloseAuthority);
            setCreatingToken(false);
            return;
          }
          closeAuth = creators[0].address;
        } else if (activeOption === "custom") {
          try {
            closeAuth = publicKey(customRefundAddress.trim());
          } catch (err) {
            toast.error(translations[language]?.invalidRefundAddress);
            setCreatingToken(false);
            return;
          }
        }
        if (closeAuth) {
          txBuilder = txBuilder.add(
            setAuthority(umi, {
              owned: tokenAccount,
              owner: umi.identity,
              authorityType: AuthorityType.CloseAccount,
              newAuthority: closeAuth,
            })
          );
        }
      }

      const result = await txBuilder.sendAndConfirm(umi);
      console.log("Transaction result:", result);

      const mintAddress = mintSigner.publicKey.toString();
      toast.success(
        `Token created successfully!\nMint address: ${mintAddress}\n\nCheck your wallet for the minted tokens.`
      );

      setName("");
      setSymbol("");
      setDescription("");
      setImage(null);
      setPreviewUrl(null);
      setSupply(0);
      setDecimals(6);
      setCreatingToken(false);
    } catch (error) {
      console.error(error);
      setCreatingToken(false);
      toast.error(translations[language]?.tokenCreateFailed);
    }
  };

  const baseFee = 0.2;
  const extraFees =
    (advanceSwitch ? 0.1 : 0) +
    (freeze ? 0.1 : 0) +
    (mintAuth ? 0.1 : 0) +
    (update ? 0.1 : 0) +
    (showPersonal ? 0.1 : 0) +
    (deletion ? 0.1 : 0);
  const totalFee = baseFee + extraFees;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="mt-8">
        {/* Token Name, Symbol, Decimals, Supply Input */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            🪙 Token Details
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Token Name */}
            <div className="flex flex-col">
              <TooltipLabel
                label={translations[language]?.name}
                tooltip={translations[language]?.nameTooltip}
                required
              />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  if (value.length > 50) {
                    toast.error(translations[language]?.nameExceedLengthError);
                    return;
                  }
                  setName(value);
                }}
                placeholder={translations[language]?.nameplace}
                className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
              />
            </div>

            {/* Token Symbol */}
            <div className="flex flex-col">
              <TooltipLabel
                label={translations[language]?.symbol}
                tooltip={translations[language]?.symbolTooltip}
                required
              />
              <input
                type="text"
                value={symbol}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  if (value.length > 10) {
                    toast.error(
                      translations[language]?.symbolExceedLengthError
                    );
                    return;
                  }
                  setSymbol(value);
                }}
                placeholder={translations[language]?.symbolplace}
                className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
              />
            </div>

            {/* Decimals */}
            <div className="flex flex-col">
              <TooltipLabel
                label={translations[language]?.decimals}
                tooltip={translations[language]?.decimalTooltip}
                required
              />
              <input
                type="number"
                value={decimals}
                min={1}
                max={12}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value === 0 || value > 12) {
                    toast.error(translations[language]?.decimalError);
                    return;
                  }
                  setDecimals(value);
                }}
                className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
              />
              <p className="text-xs text-gray-500 mt-1">
                {translations[language]?.decimaldesc}
              </p>
            </div>

            {/* Supply */}
            <div className="flex flex-col">
              <TooltipLabel
                label={translations[language]?.supply}
                tooltip={translations[language]?.supplyTooltip}
              />
              <input
                type="number"
                value={supply}
                onChange={(e) => setSupply(Number(e.target.value))}
                className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
              />
              <p className="text-xs text-gray-500 mt-1">
                {translations[language]?.supplydesc}
              </p>
            </div>
          </div>
        </div>

        {/* Token Description & Image Input */}
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          {/* Description */}
          <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📝 {translations[language]?.description}
            </h3>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={translations[language]?.descriptionDesc}
              rows={10}
              className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-[#02CCE6]"
            />
          </div>

          {/* Image */}
          <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              🖼️ {translations[language]?.image}
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
                    alt="Token Image"
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
                        {translations[language]?.Change}
                      </button>
                      <button
                        onClick={handleRemoveImage}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold"
                      >
                        {translations[language]?.Remove}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MdOutlineFileUpload size={42} />
                  <p className="mt-2 text-sm font-medium">
                    {translations[language]?.uploadImage}
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              {translations[language]?.uploadImageDesc}
            </p>
          </div>
        </div>

        {/* Token Metadata Social media links Input */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 mt-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              🌐 {translations[language]?.addLinks}
            </h3>

            <label className="switch">
              <input
                type="checkbox"
                checked={socialSwitch}
                onChange={handleSocialSwitch}
              />
              <span className="slider"></span>
            </label>
          </div>

          {socialSwitch && (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {translations[language]?.addLinksDesc}
              </p>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold">🌍 Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder={translations[language]?.websitedesc}
                    className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold">
                    🐦 Twitter / X
                  </label>
                  <input
                    type="url"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder={translations[language]?.twitterdesc}
                    className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold">✈️ Telegram</label>
                  <input
                    type="url"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder={translations[language]?.telegramdesc}
                    className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold">🎮 Discord</label>
                  <input
                    type="url"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    placeholder={translations[language]?.discorddesc}
                    className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Advances options */}
        {/* ================= ADVANCED OPTIONS ================= */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm my-8">
          {/* Header */}
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6 gradient-text2">
            ⚙️ {translations[language]?.advancedOptions}
          </h2>

          {/* ================= MODIFY CREATOR ================= */}
          <div className="border border-[#E6E8EC] rounded-xl p-5 bg-[#FCFCFD]">
            {/* Title + Toggle */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[16px] text-gray-800">
                  👤 {translations[language]?.modifyCreator}
                </h3>

                <div className="relative group">
                  <IoIosInformationCircle className="text-gray-400 cursor-pointer" />
                  <div
                    className="
              absolute left-1/2 -translate-x-1/2 top-full mt-2
              hidden group-hover:block
              w-64 text-xs text-white
              bg-black/80 px-3 py-2 rounded-lg
              shadow-lg z-50
            "
                  >
                    {translations[language]?.modifyCreatorDesc}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600">
                  +0.1 SOL
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={advanceSwitch}
                    onChange={handleAdvanceSwitch}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            {/* ================= CREATOR FORM ================= */}
            {advanceSwitch && (
              <div className="mt-6 flex flex-col gap-5">
                <p className="text-sm text-gray-500">
                  {translations[language]?.modifyCreatorDesc}
                </p>

                {/* Creator Name & Website */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">
                      🏷️ {translations[language]?.creatorName}
                    </label>
                    <input
                      type="text"
                      value={creatorName}
                      disabled={removeCreator}
                      onChange={(e) => setCreatorName(e.target.value)}
                      placeholder={translations[language]?.createNamePlace}
                      className={`border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]
                ${removeCreator ? "bg-gray-200 cursor-not-allowed" : "bg-white"}
              `}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">
                      🌐 {translations[language]?.creatorWeb}
                    </label>
                    <input
                      type="url"
                      value={creatorWeb}
                      disabled={removeCreator}
                      onChange={(e) => setCreatorWeb(e.target.value)}
                      placeholder={translations[language]?.createWebPlace}
                      className={`border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]
                ${removeCreator ? "bg-gray-200 cursor-not-allowed" : "bg-white"}
              `}
                    />
                  </div>
                </div>

                {/* Creator Address */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    🔑 {translations[language]?.creatorAddress}
                  </label>
                  <input
                    type="text"
                    value={creatorAddress}
                    disabled={removeCreator}
                    onChange={(e) => setCreatorAddress(e.target.value)}
                    placeholder={translations[language]?.enterAddress}
                    className={`border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]
              ${removeCreator ? "bg-gray-200 cursor-not-allowed" : "bg-white"}
            `}
                  />
                </div>

                {/* Remove Creator */}
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
                    {translations[language]?.removeOption}
                  </span>

                  <div className="relative group">
                    <IoInformationCircleOutline
                      size={18}
                      className="text-gray-400 cursor-pointer"
                    />
                    <div
                      className="
                absolute left-1/2 -translate-x-1/2 top-full mt-2
                hidden group-hover:block
                w-64 text-xs text-white
                bg-black/80 px-3 py-2 rounded-lg
                shadow-lg z-50
              "
                    >
                      {translations[language]?.removeCreatorTooltip}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= REVOKE AUTHORITIES ================= */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm my-8">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
            🔒 {translations[language]?.revokeAuthorities}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {translations[language]?.revokeAuthoritiesDesc}
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Freeze Authority */}
            <div
              className={`relative rounded-xl border-2 p-4 bg-[#FCFCFD] transition ${
                freeze ? "border-grad" : "border-[#E6E8EC]"
              }`}
            >
              <div className="flex gap-3 items-start">
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
                      {translations[language]?.revokeFreeze}
                    </span>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold">+0.1 SOL</span>
                      <label className="switch-2">
                        <input
                          type="checkbox"
                          checked={freeze}
                          onChange={handleFreeze}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <p className="text-[#777E90] mt-1">
                    {translations[language]?.revokeFreezeDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* Mint Authority */}
            <div
              className={`relative rounded-xl border-2 p-4 bg-[#FCFCFD] transition ${
                mintAuth ? "border-grad" : "border-[#E6E8EC]"
              }`}
            >
              <div className="flex gap-3 items-start">
                <TiCancel size={22} color={mintAuth ? "#00b5cd" : "#777"} />

                <div className="flex-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-semibold ${
                        mintAuth ? "gradient-text2" : ""
                      }`}
                    >
                      {translations[language]?.revokeMint}
                    </span>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold">+0.1 SOL</span>
                      <label className="switch-2">
                        <input
                          type="checkbox"
                          checked={mintAuth}
                          onChange={handleMintAuth}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <p className="text-[#777E90] mt-1">
                    {translations[language]?.revokeMintDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* Update Authority */}
            <div
              className={`relative rounded-xl border-2 p-4 bg-[#FCFCFD] transition ${
                update ? "border-grad" : "border-[#E6E8EC]"
              }`}
            >
              <div className="flex gap-3 items-start">
                <FaLock size={18} color={update ? "#00b5cd" : "#777"} />

                <div className="flex-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-semibold ${
                        update ? "gradient-text2" : ""
                      }`}
                    >
                      {translations[language]?.revokeUpdate}
                    </span>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold">+0.1 SOL</span>
                      <label className="switch-2">
                        <input
                          type="checkbox"
                          checked={update}
                          onChange={handleUpdate}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <p className="text-[#777E90] mt-1">
                    {translations[language]?.revokeUpdateDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= PERSONALIZATION ================= */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm my-8">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
            <BsGlobe2 /> {translations[language]?.personalization}
          </h2>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {translations[language]?.claim}
              </span>
              <IoIosInformationCircle className="text-gray-400" />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">+0.1 SOL</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showPersonal}
                  onChange={() => setShowPersonal((prev) => !prev)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-2">
            {translations[language]?.personalize}
          </p>

          {showPersonal && (
            <>
              {/* Prefix / Suffix */}
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {/* Prefix */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-sm">
                      {translations[language]?.prefix}
                      <span className="text-gray-400 ml-1">
                        ({translations[language]?.max4})
                      </span>
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
                    onChange={(e) => {
                      if (e.target.value.length > 4) {
                        toast.error(translations[language]?.maxLength4);
                        return;
                      }
                      setPrefix(e.target.value);
                    }}
                    placeholder={translations[language]?.pumpfront}
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]
              ${!isChecked ? "bg-gray-200 cursor-not-allowed" : "bg-white"}
            `}
                  />
                </div>

                {/* Suffix */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-sm">
                      {translations[language]?.suffix}
                      <span className="text-gray-400 ml-1">
                        ({translations[language]?.max4})
                      </span>
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
                    onChange={(e) => {
                      if (e.target.value.length > 4) {
                        toast.error(translations[language]?.maxLength4);
                        return;
                      }
                      setSuffix(e.target.value);
                    }}
                    placeholder={translations[language]?.pump}
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#02CCE6]
              ${!isCheck ? "bg-gray-200 cursor-not-allowed" : "bg-white"}
            `}
                  />
                </div>
              </div>

              {/* Generate */}
              <div className="flex justify-between items-center mt-6 border rounded-2xl p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <IoFlashOutline /> {translations[language]?.addGen}
                </div>
                <div
                  className="flex items-center gap-2 text-[#00c8f8] cursor-pointer"
                  onClick={generateVanityAddress}
                >
                  <LuRefreshCw className={isGenerating ? "animate-spin" : ""} />
                  {isGenerating
                    ? translations[language]?.generating
                    : translations[language]?.gend}
                </div>
              </div>

              {generatedMint && (
                <div className="bg-green-100 mt-4 p-3 rounded-xl text-sm max-h-24 overflow-y-auto">
                  <strong className="block mb-1">
                    {translations[language]?.generatedAddress}
                  </strong>
                  <span className="break-all">
                    {generatedMint.publicKey.toString()}
                  </span>
                </div>
              )}

              <div className="bg-[#fff9df] mt-4 p-3 rounded-xl flex gap-2 items-center text-sm">
                <FaRegClock /> {translations[language]?.paraprocess}
              </div>
            </>
          )}
        </div>

        {/* ================= ACCOUNT DELETION ================= */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm my-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">
              🗑️ {translations[language].accdel}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">0.1 SOL</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={deletion}
                  onChange={() => setDeletion((prev) => !prev)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {deletion && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                {translations[language].accdesc}
              </p>

              <div className="grid md:grid-cols-4 gap-4">
                {["sol", "token", "owner", "custom"].map((opt) => (
                  <div
                    key={opt}
                    className="flex items-center justify-between border rounded-xl p-3"
                  >
                    <span className="text-sm font-semibold">
                      {
                        translations[language][
                          opt === "sol"
                            ? "soltool"
                            : opt === "token"
                            ? "tokenCreator"
                            : opt === "owner"
                            ? "accOwner"
                            : "customAddress"
                        ]
                      }
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
                  placeholder={translations[language].enadd}
                  className="mt-4 w-full md:w-1/2 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#02CCE6]"
                />
              )}
            </>
          )}
        </div>

        <div className="text-center my-10">
          <p className="text-sm mb-2">
            {translations[language]?.totalFees}{" "}
            <span className="text-[#02CCE6] font-bold">
              {totalFee.toFixed(2)} SOL
            </span>
          </p>

          <button
            type="button"
            onClick={createSPLToken}
            disabled={
              !wallet.connected || !name || !symbol || !image || !description
            }
            className="bg-[#02CCE6] px-8 py-3 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-600 transition"
          >
            {creatingToken
              ? translations[language]?.tokenCreating
              : translations[language]?.createToken}
          </button>
        </div>
      </form>
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

          {/* Tooltip */}
          <div
            className="
              absolute left-1/2 -translate-x-1/2 top-full mt-2
              hidden group-hover:block
              w-64 text-xs text-white
              bg-black/80 px-3 py-2 rounded-lg
              shadow-lg z-50
            "
          >
            {tooltip}
          </div>
        </div>
      )}
    </label>
  );
}
