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
        <div className="grid md:grid-cols-2 gap-6">
          {/* Token Name Input */}
          <div className="flex flex-col">
            <TooltipLabel
              label={translations[language]?.name}
              tooltip={translations[language]?.nameTooltip}
              required={true}
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
              className="border border-[#E6E8EC] p-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Token Symbol Input */}
          <div className="flex flex-col">
            <TooltipLabel
              label={translations[language]?.symbol}
              tooltip={translations[language]?.symbolTooltip}
              required={true}
            />
            <input
              type="text"
              value={symbol}
              onChange={(e) => {
                const value = e.target.value.trim();

                if (value.length > 10) {
                  toast.error(translations[language]?.symbolExceedLengthError);
                  return;
                }
                setSymbol(value);
              }}
              placeholder={translations[language]?.symbolplace}
              className="border border-[#E6E8EC] p-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Token Decimal Input */}
          <div className="flex flex-col">
            <TooltipLabel
              label={translations[language]?.decimals}
              tooltip={translations[language]?.decimalTooltip}
              required={true}
            />
            <input
              type="number"
              value={decimals}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value === 0 || value > 12) {
                  toast.error(translations[language]?.decimalError);
                  return;
                }
                setDecimals(Number(e.target.value));
              }}
              min={1}
              max={12}
              className="border border-[#E6E8EC] p-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <small className="text-gray-500">
              {translations[language]?.decimaldesc}
            </small>
          </div>

          {/* Token Supply Input */}
          <div className="flex flex-col">
            <TooltipLabel
              label={translations[language]?.supply}
              tooltip={translations[language]?.supplyTooltip}
              required={false}
            />
            <input
              type="number"
              value={supply}
              onChange={(e) => setSupply(Number(e.target.value))}
              className="border border-[#E6E8EC] p-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <small className="text-gray-500">
              {translations[language]?.supplydesc}
            </small>
          </div>
        </div>

        {/* Token Description & Image Input */}
        <div className="flex flex-col md:flex-row mt-5 justify-between gap-6">
          {/* Token Description Input */}
          <div className="flex flex-col flex-1/2">
            <TooltipLabel
              label={translations[language]?.description}
              tooltip={translations[language]?.descriptionTooltip}
              required={true}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={translations[language]?.descriptionDesc}
              className="border resize-none h-52 border-[#E6E8EC] p-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Token Image Input */}
          <div className="flex flex-col flex-1/2">
            <TooltipLabel
              label={translations[language]?.image}
              tooltip={translations[language]?.imageTooltip}
              required={true}
            />
            <div
              className="border h-52 border-[#E6E8EC] p-1.5 rounded-sm flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
              onClick={handleImageClick}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
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
                    alt="Uploaded Preview"
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
                        className="px-3 py-1 text-sm rounded bg-white text-black font-semibold hover:bg-gray-200"
                      >
                        {translations[language]?.Change}
                      </button>
                      <button
                        onClick={handleRemoveImage}
                        className="px-3 py-1 text-sm rounded bg-red-500 text-white font-semibold hover:bg-red-600"
                      >
                        {translations[language]?.Remove}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-3xl text-[#02CCE6]">
                    <MdOutlineFileUpload />
                  </div>
                  <div className="text-center">
                    {translations[language]?.uploadImage}
                  </div>
                </>
              )}
            </div>
            <small className="text-gray-500">
              {translations[language]?.uploadImageDesc}
            </small>
          </div>
        </div>

        {/* Token Metadata Social media links Input */}
        <div className="my-8 flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <h1 className="font-bold text-[16px]">
              {translations[language]?.addLinks}
            </h1>
            <div className="font-bold text-[20px]">
              <IoIosInformationCircle />
            </div>
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
              <small className="text-gray-500">
                {translations[language]?.addLinksDesc}
              </small>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex flex-col">
                  <label className="text-black mb-1">
                    {translations[language]?.website}
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder={translations[language]?.websitedesc}
                    className="border border-[#E6E8EC] p-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-black mb-1">
                    {translations[language]?.twitter}
                  </label>
                  <input
                    type="url"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder={translations[language]?.twitterdesc}
                    className="border border-[#E6E8EC] p-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-black mb-1">
                    {translations[language]?.telegram}
                  </label>
                  <input
                    type="url"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder={translations[language]?.telegramdesc}
                    className="border border-[#E6E8EC] p-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-black mb-1">
                    {translations[language]?.discord}
                  </label>
                  <input
                    type="url"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    placeholder={translations[language]?.discorddesc}
                    className="border border-[#E6E8EC] p-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Advances options */}
        <div className="my-8 flex flex-col gap-2">
          <div className="flex gap-3 items-center">
            <h1 className="gradient-text2 text-2xl">
              {translations[language]?.advancedOptions}
            </h1>
          </div>

          {/* Modify creator information on metadata */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 flex-wrap">
              <h1 className="font-bold text-[16px]">
                {translations[language]?.modifyCreator}
              </h1>
              <div className="font-bold text-[20px]">
                <IoIosInformationCircle />
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={advanceSwitch}
                  onChange={handleAdvanceSwitch}
                />
                <span className="slider"></span>
              </label>
              <span>(+0.1 SOL)</span>
            </div>

            {advanceSwitch && (
              <>
                <small className="text-gray-500">
                  {translations[language]?.modifyCreatorDesc}
                </small>
                <div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <label className="text-black mb-1">
                        {translations[language]?.creatorName}
                      </label>
                      <input
                        type="text"
                        value={creatorName}
                        disabled={removeCreator}
                        onChange={(e) => setCreatorName(e.target.value)}
                        placeholder={translations[language]?.createNamePlace}
                        className={`border border-[#E6E8EC] p-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400
  ${removeCreator ? "bg-gray-200 cursor-not-allowed" : "bg-white"}
`}
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-black mb-1">
                        {translations[language]?.creatorWeb}
                      </label>
                      <input
                        type="url"
                        value={creatorWeb}
                        disabled={removeCreator}
                        onChange={(e) => setCreatorWeb(e.target.value)}
                        placeholder={translations[language]?.createWebPlace}
                        className={`border border-[#E6E8EC] p-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400
  ${removeCreator ? "bg-gray-200 cursor-not-allowed" : "bg-white"}
`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col mt-4">
                    <label className="text-black mb-1">
                      {translations[language]?.creatorAddress}
                    </label>
                    <input
                      type="text"
                      disabled={removeCreator}
                      value={creatorAddress}
                      onChange={(e) => setCreatorAddress(e.target.value)}
                      placeholder={translations[language]?.enterAddress}
                      className={`border border-[#E6E8EC] p-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400
  ${removeCreator ? "bg-gray-200 cursor-not-allowed" : "bg-white"}
`}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={removeCreator}
                      onChange={(e) => setRemoveCreator(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                  <p className="text-sm font-semibold">
                    {translations[language]?.removeOption}
                  </p>
                  <div className="relative inline-block group">
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
                      {translations[language].removeCreatorTooltip}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="my-8 flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <h1 className="font-bold text-[16px]">
              {translations[language]?.revokeAuthorities}
            </h1>
          </div>
          <small className="text-gray-500">
            {translations[language]?.revokeAuthoritiesDesc}
          </small>

          {/* Revoke Authorities */}
          <div className="flex flex-col md:flex-row gap-6 my-6">
            {/* Revoke freeze */}
            <div
              className={`${
                freeze ? "border-grad" : ""
              } flex relative rounded gap-3 py-3 px-2 border-[#E6E8EC] border-2 bg-[#FCFCFD]`}
            >
              <div className="icon-grad">
                {freeze ? (
                  <FaRegSnowflake color="rgba(0, 181, 205, 1)" size={20} />
                ) : (
                  <FaRegSnowflake size={20} />
                )}
              </div>
              <div className="text-[14px] flex-1">
                <div className="flex justify-between items-center">
                  <span className={`${freeze ? "gradient-text2" : ""}`}>
                    {translations[language]?.revokeFreeze}
                  </span>
                  <div className="flex items-center gap-3">
                    <span>+0.1 SOL</span>
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
                <p className="text-[#777E90]">
                  {translations[language]?.revokeFreezeDesc}
                </p>
              </div>
            </div>

            {/* Revoke Mint */}
            <div
              className={`${
                mintAuth ? "border-grad" : ""
              } flex relative rounded gap-3 py-3 px-2 border-[#E6E8EC] border-2 bg-[#FCFCFD]`}
            >
              <div className="text-18px">
                {mintAuth ? (
                  <TiCancel size={24} color="rgba(0, 181, 205, 1)" />
                ) : (
                  <TiCancel size={24} />
                )}
              </div>
              <div className="text-[14px] flex-1">
                <div className="flex justify-between items-center">
                  <span className={`${mintAuth ? "gradient-text2" : ""}`}>
                    {translations[language]?.revokeMint}
                  </span>
                  <div className="flex items-center gap-3">
                    <span>+0.1 SOL</span>
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
                <p className="text-[#777E90]">
                  {translations[language]?.revokeMintDesc}
                </p>
              </div>
            </div>

            {/* Revoke update metadata */}
            <div
              className={`${
                update ? "border-grad" : ""
              } flex relative rounded gap-3 py-3 px-2 border-[#E6E8EC] border-2 bg-[#FCFCFD]`}
            >
              <div className="text-18px">
                {update ? (
                  <FaLock size={20} color="rgba(0, 181, 205, 1)" />
                ) : (
                  <FaLock size={20} />
                )}
              </div>
              <div className="text-[14px] flex-1">
                <div className="flex justify-between items-center">
                  <span className={`${update ? "gradient-text2" : ""}`}>
                    {translations[language]?.revokeUpdate}
                  </span>
                  <div className="flex items-center gap-3">
                    <span>+0.1 SOL</span>
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
                <p className="text-[#777E90]">
                  {translations[language]?.revokeUpdateDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Personalizied address */}
          <div className="my-4 flex flex-col gap-2">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <BsGlobe2 />
              <span>{translations[language]?.personalization}</span>
            </h1>
            <div className="flex items-center gap-1 flex-wrap">
              <h1 className="font-bold text-[16px]">
                {translations[language]?.claim}
              </h1>
              <div className="font-bold text-[20px]">
                <IoIosInformationCircle />
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showPersonal}
                  onChange={() => setShowPersonal((prev) => !prev)}
                />
                <span className="slider"></span>
              </label>
              <span>(+0.1 SOL)</span>
            </div>
            <p>{translations[language]?.personalize}</p>
            {showPersonal && (
              <>
                <div className="flex gap-5 flex-col md:flex-row justify-between md:items-center">
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="font-semibold">
                          {translations[language]?.prefix}
                        </label>
                        <span className="text-gray-500">
                          ({translations[language]?.max4})
                        </span>
                        <sup>*</sup>
                      </div>
                      <div className="flex gap-2 items-center">
                        <label className="switch-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => setIsChecked(!isChecked)}
                          />
                          <span className="slider"></span>
                        </label>
                        <span className="font-semibold">
                          {translations[language]?.enable}
                        </span>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={prefix}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value.length > 4) {
                          toast.error(translations[language]?.maxLength4);
                          return;
                        }
                        setPrefix(value);
                      }}
                      placeholder={translations[language]?.pumpfront}
                      disabled={!isChecked}
                      className={`border w-full mt-2 border-[#E6E8EC] p-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                        !isChecked
                          ? "bg-gray-200 cursor-not-allowed"
                          : "bg-white"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="font-semibold">
                          {translations[language]?.suffix}
                        </label>
                        <span className="text-gray-500">
                          ({translations[language]?.max4})
                        </span>
                        <sup>*</sup>
                      </div>
                      <div className="flex gap-2 items-center">
                        <label className="switch-2">
                          <input
                            type="checkbox"
                            checked={isCheck}
                            onChange={() => setIsCheck(!isCheck)}
                          />
                          <span className="slider"></span>
                        </label>
                        <span className="font-semibold">
                          {translations[language]?.enable}
                        </span>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={suffix}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value.length > 4) {
                          toast.error(translations[language]?.maxLength4);
                          return;
                        }
                        setSuffix(value);
                      }}
                      placeholder={translations[language]?.pump}
                      disabled={!isCheck}
                      className={`border w-full mt-2 border-[#E6E8EC] p-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                        !isCheck ? "bg-gray-200 cursor-not-allowed" : "bg-white"
                      }`}
                    />
                  </div>
                </div>
                <div className="flex border rounded-3xl border-gray-400 justify-between items-center my-4 p-3">
                  <p className="flex gap-2 items-center text-lg">
                    <span className="font-bold md:text-2xl">
                      <IoFlashOutline />
                    </span>
                    <span className="text-sm md:text-lg">
                      {translations[language]?.addGen}
                    </span>
                  </p>
                  <div
                    className="flex gap-2 text-xl cursor-pointer font-semibold text-[#00c8f8] items-center"
                    onClick={generateVanityAddress}
                  >
                    <LuRefreshCw
                      className={`${isGenerating ? "animate-spin" : ""}`}
                    />
                    <p className="text-sm md:text-lg font-normal">
                      {isGenerating
                        ? translations[language]?.generating
                        : translations[language]?.gend}
                    </p>
                  </div>
                </div>
                {generatedMint && (
                  <div className="bg-green-100 p-3 rounded-lg">
                    <strong>{translations[language]?.generatedAddress}</strong>{" "}
                    {generatedMint.publicKey.toString()}
                  </div>
                )}
                <div className="bg-[#fff9df] p-3 flex gap-3 items-center rounded-2xl">
                  <div>
                    <FaRegClock />
                  </div>
                  <div>{translations[language]?.paraprocess}</div>
                </div>
              </>
            )}
          </div>

          {/* Deleet account fee receiver */}
          <div className="flex flex-col my-4  gap-2">
            <div className="flex gap-2 items-center justify-between">
              <h1 className="text-xl font-semibold">
                <span>{translations[language].accdel}</span>
              </h1>
              <div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={deletion}
                    onChange={() => setDeletion((prev) => !prev)}
                  />
                  <span className="slider"></span>
                </label>
                <span className="ml-2">(0.1 SOL)</span>
              </div>
            </div>
            {deletion && (
              <>
                <p>{translations[language].accdesc}</p>
                <div className="flex my-2 justify-between flex-wrap">
                  {/* Sol Tool */}
                  <div className="flex items-center gap-3">
                    <div>{translations[language].soltool}</div>
                    <label className="switch-2">
                      <input
                        type="checkbox"
                        checked={activeOption === "sol"}
                        onChange={() =>
                          setActiveOption(activeOption === "sol" ? "" : "sol")
                        }
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  {/* Token Creator */}
                  <div className="flex items-center gap-3">
                    <div>{translations[language].tokenCreator}</div>
                    <label className="switch-2">
                      <input
                        type="checkbox"
                        checked={activeOption === "token"}
                        onChange={() =>
                          setActiveOption(
                            activeOption === "token" ? "" : "token"
                          )
                        }
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  {/* Account Owner */}
                  <div className="flex items-center gap-3">
                    <div>{translations[language].accOwner}</div>
                    <label className="switch-2">
                      <input
                        type="checkbox"
                        checked={activeOption === "owner"}
                        onChange={() =>
                          setActiveOption(
                            activeOption === "owner" ? "" : "owner"
                          )
                        }
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  {/* Custom Address */}
                  <div className="flex items-center gap-3">
                    <div>{translations[language].customAddress}</div>
                    <label className="switch-2">
                      <input
                        type="checkbox"
                        checked={activeOption === "custom"}
                        onChange={() =>
                          setActiveOption(
                            activeOption === "custom" ? "" : "custom"
                          )
                        }
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
                {activeOption === "custom" ? (
                  <div>
                    <input
                      type="text"
                      value={customRefundAddress}
                      onChange={(e) => setCustomRefundAddress(e.target.value)}
                      placeholder={translations[language].enadd}
                      className="border border-[#E6E8EC] p-1.5 rounded-sm focus:outline-none focus:ring-2 w-full md:w-[50%] focus:ring-blue-400"
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* Submit form*/}
          <div className="text-center">
            <div className="mt-3 text-sm py-2">
              {translations[language]?.totalFees}{" "}
              <span className="text-[#02CCE6]">{totalFee.toFixed(2)} SOL</span>
            </div>
            <button
              type="button"
              onClick={createSPLToken}
              disabled={
                !wallet.connected || !name || !symbol || !image || !description
              }
              className="bg-[#02CCE6] disabled:opacity-50 cursor-pointer px-4 rounded text-white py-2 disabled:cursor-not-allowed"
            >
              {creatingToken
                ? translations[language]?.tokenCreating
                : translations[language]?.createToken}
            </button>
          </div>
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
