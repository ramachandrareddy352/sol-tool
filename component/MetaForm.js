"use client";
import { useState, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import { MdOutlineFileUpload } from "react-icons/md";
import { TiCancel } from "react-icons/ti";
import { useLanguage } from "@/app/Context/LanguageContext";
import { useNetwork } from "@/app/Context/NetworkContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { MetaFormTranslations as translations } from "../utils/MetaFormLanguague";
import toast from "react-hot-toast";
import { useSolToolAnchorProgram } from "@/utils/fetch_fee_config";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import {
  fetchMetadata,
  findMetadataPda,
  updateV1,
  createMetadataAccountV3,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  publicKey,
  createGenericFile,
  sol,
  percentAmount,
} from "@metaplex-foundation/umi";
import { transferSol, fetchMint } from "@metaplex-foundation/mpl-toolbox";

const MetaForm = () => {
  const { language } = useLanguage();
  const { currentNetwork } = useNetwork();
  const { solToolProgram, feeConfigPda } = useSolToolAnchorProgram();
  const wallet = useWallet();
  const t = translations[language];

  const [loadingFees, setLoadingFees] = useState(true);
  const [updateFee, setUpdateFee] = useState(0.1);

  const fileInputRef = useRef(null);

  const [tokenAddress, setTokenAddress] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [existingImageUri, setExistingImageUri] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [discord, setDiscord] = useState("");
  const [socialEnabled, setSocialEnabled] = useState(false);

  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const [currentMetadata, setCurrentMetadata] = useState(null);
  const [originalOffchainMetadata, setOriginalOffchainMetadata] =
    useState(null);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [hasMetadata, setHasMetadata] = useState(false);

  // Load update metadata fee
  useEffect(() => {
    const fetchFee = async () => {
      try {
        const data = await solToolProgram.account.feeConfig.fetch(feeConfigPda);
        if (data?.updateMetadataFee) {
          setUpdateFee(Number(data.updateMetadataFee) / 1_000_000_000);
        }
      } catch (err) {
        console.error("Fee load error:", err);
        toast.error("Using default fee: 0.1 SOL");
      } finally {
        setLoadingFees(false);
      }
    };
    if (solToolProgram) fetchFee();
  }, [solToolProgram, feeConfigPda]);

  const umi = useMemo(() => {
    if (!wallet.connected || !wallet.publicKey) return null;
    return createUmi(currentNetwork.rpc)
      .use(walletAdapterIdentity(wallet))
      .use(mplTokenMetadata())
      .use(irysUploader());
  }, [wallet.connected, wallet.publicKey, currentNetwork]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid image file");
      return;
    }
    if (file.size > 1000 * 1024) {
      toast.error("Image must be ≤1MB");
      return;
    }
    setImageFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const checkTokenMetadata = async () => {
    if (!umi) {
      toast.error("Connect wallet first");
      return;
    }
    if (!tokenAddress.trim()) {
      toast.error("Enter token address");
      return;
    }

    setChecking(true);
    setVerificationStatus(null);
    setCurrentMetadata(null);
    setOriginalOffchainMetadata(null);
    setExistingImageUri("");
    setDescription("");
    setName("");
    setSymbol("");
    setWebsite("");
    setTwitter("");
    setTelegram("");
    setDiscord("");
    setSocialEnabled(false);
    setHasMetadata(false);
    removeImage();

    try {
      const mintKey = publicKey(tokenAddress.trim());
      const mintInfo = await fetchMint(umi, mintKey);
      const metadataPda = findMetadataPda(umi, { mint: mintKey });

      let metadata;
      let metadataExists = true;

      try {
        metadata = await fetchMetadata(umi, metadataPda);
      } catch (err) {
        metadataExists = false;
      }

      if (metadataExists) {
        // === METADATA EXISTS ===
        setHasMetadata(true);
        setCurrentMetadata(metadata);
        setName(metadata.name || "");
        setSymbol(metadata.symbol || "");

        // Check if metadata is immutable
        if (!metadata.isMutable) {
          throw new Error("Metadata is immutable – cannot be updated");
        }

        // Check update authority
        if (
          metadata.updateAuthority.toString() !==
          umi.identity.publicKey.toString()
        ) {
          throw new Error("You are not the update authority for this metadata");
        }

        // Load off-chain metadata
        if (metadata.uri?.trim()) {
          try {
            const res = await fetch(metadata.uri.trim());
            if (res.ok) {
              const json = await res.json();
              setOriginalOffchainMetadata(json);
              setDescription(json.description || "");
              setWebsite(json.external_url || "");
              setExistingImageUri(json.image || "");

              const links = json.properties?.links || json.links || {};
              setTwitter(links.twitter || links.x || "");
              setTelegram(links.telegram || "");
              setDiscord(links.discord || "");
              if (Object.keys(links).length > 0) setSocialEnabled(true);
            }
          } catch (err) {
            console.log("Off-chain metadata not accessible:", err);
          }
        }

        setVerificationStatus("success");
        setStatusMessage("Verified – ready to update metadata");
      } else {
        // === NO METADATA EXISTS ===
        setHasMetadata(false);

        // Check if mint authority exists
        if (!mintInfo.mintAuthority) {
          throw new Error(
            "Mint authority has been revoked – cannot create metadata"
          );
        }

        // Check if connected wallet is mint authority
        if (
          mintInfo.mintAuthority.toString() !==
          umi.identity.publicKey.toString()
        ) {
          throw new Error(
            "Your connected wallet is not the mint authority – cannot create metadata"
          );
        }

        setVerificationStatus("success");
        setStatusMessage("No metadata found – ready to create metadata");
      }
    } catch (error) {
      setVerificationStatus("error");
      setStatusMessage(error.message || "Invalid token or authority mismatch");
      toast.error(error.message || "Verification failed");
    } finally {
      setChecking(false);
    }
  };

  const submitMetadata = async () => {
    if (!umi || verificationStatus !== "success") {
      toast.error("Verify token first");
      return;
    }
    if (!description.trim()) {
      toast.error("Description required");
      return;
    }

    // Validation for creation
    if (!hasMetadata) {
      if (!name.trim() || !symbol.trim()) {
        toast.error("Name and symbol required for creation");
        return;
      }
      if (!imageFile) {
        toast.error("Image required for creation");
        return;
      }
    }

    setUpdating(true);
    try {
      let imageUri = hasMetadata ? existingImageUri : "";

      if (imageFile) {
        const imageBuffer = await imageFile.arrayBuffer();
        const file = createGenericFile(
          new Uint8Array(imageBuffer),
          imageFile.name,
          { contentType: imageFile.type }
        );
        [imageUri] = await umi.uploader.upload([file]);
        toast.success("Image uploaded");
      }

      const mintKey = publicKey(tokenAddress.trim());
      const metadataPda = findMetadataPda(umi, { mint: mintKey });

      let newJson;

      if (hasMetadata) {
        newJson = {
          ...(originalOffchainMetadata || {}),
          name: currentMetadata.name.trim(),
          symbol: currentMetadata.symbol.trim(),
          description: description.trim(),
          image: imageUri,
          external_url:
            socialEnabled && website.trim()
              ? website.trim()
              : originalOffchainMetadata?.external_url || "",
        };

        if (!newJson.properties) newJson.properties = {};
        newJson.properties.files = [
          {
            uri: imageUri,
            type: imageFile?.type || "image/png",
          },
        ];

        if (socialEnabled) {
          const links = {
            ...(originalOffchainMetadata?.properties?.links || {}),
          };
          if (website.trim()) links.website = website.trim();
          if (twitter.trim()) links.twitter = twitter.trim();
          if (telegram.trim()) links.telegram = telegram.trim();
          if (discord.trim()) links.discord = discord.trim();
          if (Object.keys(links).length > 0) {
            newJson.properties.links = links;
          }
        }
      } else {
        newJson = {
          name: name.trim(),
          symbol: symbol.trim(),
          description: description.trim(),
          image: imageUri,
          external_url: socialEnabled && website.trim() ? website.trim() : "",
          properties: {
            files: [
              {
                uri: imageUri,
                type: imageFile?.type || "image/png",
              },
            ],
            category: "image",
          },
        };

        if (socialEnabled) {
          const links = {};
          if (website.trim()) links.website = website.trim();
          if (twitter.trim()) links.twitter = twitter.trim();
          if (telegram.trim()) links.telegram = telegram.trim();
          if (discord.trim()) links.discord = discord.trim();
          if (Object.keys(links).length > 0) {
            newJson.properties.links = links;
          }
        }
      }

      const newUri = await umi.uploader.uploadJson(newJson);
      toast.success("Metadata JSON uploaded");

      let txBuilder;

      if (hasMetadata) {
        const preservedData = {
          name: currentMetadata.name,
          symbol: currentMetadata.symbol,
          uri: newUri,
          sellerFeeBasisPoints: currentMetadata.sellerFeeBasisPoints,
          creators: currentMetadata.creators,
          primarySaleHappened: currentMetadata.primarySaleHappened,
          isMutable: true,
          editionNonce: currentMetadata.editionNonce,
          tokenStandard: currentMetadata.tokenStandard,
          collection: currentMetadata.collection,
          uses: currentMetadata.uses,
          collectionDetails: currentMetadata.collectionDetails,
          programmableConfig: currentMetadata.programmableConfig,
        };

        txBuilder = updateV1(umi, {
          mint: mintKey,
          authority: umi.identity,
          data: preservedData,
        });
      } else {
        const data = {
          name: name.trim(),
          symbol: symbol.trim(),
          uri: newUri,
          sellerFeeBasisPoints: percentAmount(0),
          creators: [],
          primarySaleHappened: false,
          isMutable: true,
          tokenStandard: TokenStandard.Fungible,
          collection: null,
          uses: null,
          collectionDetails: null,
          ruleSet: null,
        };

        txBuilder = createMetadataAccountV3(umi, {
          metadata: metadataPda,
          mintAccount: mintKey,
          mintAuthority: umi.identity,
          payer: umi.identity,
          updateAuthority: umi.identity,
          data,
          isMutable: true,
        });
      }

      txBuilder = txBuilder.prepend(
        transferSol(umi, {
          source: umi.identity,
          destination: feeConfigPda,
          amount: sol(updateFee),
        })
      );

      await txBuilder.sendAndConfirm(umi);
      toast.success(
        `Metadata ${hasMetadata ? "updated" : "created"}! Fee: ${updateFee} SOL`
      );
      setStatusMessage(`${hasMetadata ? "Update" : "Creation"} successful!`);
    } catch (error) {
      console.error("Operation failed:", error);
      toast.error("Operation failed – see console");
    } finally {
      setUpdating(false);
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

  if (loadingFees) return <LoadingPage />;

  if (!wallet.connected) {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 text-center">
        <p className="text-red-600 font-semibold">Please connect your wallet</p>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-10">
        {/* ================= Token Address ================= */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            🪙 Token Mint Address
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
              onClick={checkTokenMetadata}
              disabled={checking || !tokenAddress.trim()}
              className="w-full sm:w-auto bg-[#02CCE6] text-white px-8 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-cyan-600 transition disabled:cursor-not-allowed"
            >
              🔍 {checking ? "Checking..." : "Check"}
            </button>
          </div>
          {verificationStatus && (
            <p
              className={`mt-4 flex items-center gap-2 text-sm font-semibold ${
                verificationStatus === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {verificationStatus === "success" ? "✅ Success" : "❌ Error"}{" "}
              {statusMessage}
            </p>
          )}
        </div>

        {/* ================= UPDATE/CREATE METADATA FORM ================= */}
        {verificationStatus === "success" && (
          <>
            {/* Name & Symbol - Only editable when creating */}
            {!hasMetadata && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    📛 Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter token name"
                    className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                  />
                </div>
                <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    🔣 Symbol <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="Enter token symbol"
                    className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                  />
                </div>
              </div>
            )}

            {/* Display existing Name & Symbol when updating */}
            {hasMetadata && currentMetadata && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    📛 Name (Cannot Update)
                  </label>
                  <p className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm bg-gray-100">
                    {currentMetadata.name}
                  </p>
                </div>
                <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    🔣 Symbol (Cannot Update)
                  </label>
                  <p className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm bg-gray-100">
                    {currentMetadata.symbol}
                  </p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              {/* Image Upload */}
              <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  🖼️ Token Image{" "}
                  {!hasMetadata && <span className="text-red-500">*</span>}
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={() => setIsHoveringImage(true)}
                  onMouseLeave={() => setIsHoveringImage(false)}
                  className="relative border-2 border-dashed border-[#E6E8EC] rounded-xl h-72 cursor-pointer overflow-hidden hover:border-[#02CCE6] transition"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  {previewUrl || (hasMetadata && existingImageUri) ? (
                    <>
                      <Image
                        src={previewUrl || existingImageUri}
                        alt="Token"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                      {isHoveringImage && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage();
                            }}
                            className="bg-red-600 text-white rounded-full p-4 hover:bg-red-700 transition"
                          >
                            <TiCancel size={40} />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <MdOutlineFileUpload size={48} />
                      <p className="mt-3 font-medium">Click to upload image</p>
                      <p className="text-xs mt-1">Max 1MB • PNG/JPG</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  📝 Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about your token..."
                  rows={12}
                  className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  🌐 Social Links
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={socialEnabled}
                    onChange={(e) => setSocialEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#02CCE6] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full peer-checked:after:translate-x-full after:transition-all"></div>
                </label>
              </div>

              {socialEnabled && (
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">
                      🌍 Website
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">
                      🐦 Twitter / X
                    </label>
                    <input
                      type="url"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="https://twitter.com/yourhandle"
                      className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">
                      ✈️ Telegram
                    </label>
                    <input
                      type="url"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      placeholder="https://t.me/yourgroup"
                      className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">
                      🎮 Discord
                    </label>
                    <input
                      type="url"
                      value={discord}
                      onChange={(e) => setDiscord(e.target.value)}
                      placeholder="https://discord.gg/invite"
                      className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="bg-white border border-[#E6E8EC] rounded-2xl p-4 shadow-sm text-center">
              <div className="text-base font-bold mb-2 flex items-center justify-center gap-2">
                💰 Service Fee:
                <span className="text-[#02CCE6">
                  {updateFee.toFixed(4)} SOL
                </span>
              </div>
              <button
                type="button"
                onClick={submitMetadata}
                disabled={updating || !description.trim()}
                className="bg-[#02CCE6] disabled:opacity-50 text-white px-8 py-3 rounded-2xl text-lg font-bold hover:bg-cyan-600 transition disabled:cursor-not-allowed"
              >
                {updating
                  ? "Processing..."
                  : hasMetadata
                  ? "Update Metadata"
                  : "Create Metadata"}
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  );
};

export default MetaForm;
