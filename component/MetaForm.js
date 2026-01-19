"use client";

import Image from "next/image";
import { MdOutlineFileUpload } from "react-icons/md";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { HiCheckCircle } from "react-icons/hi";
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
} from "@metaplex-foundation/mpl-token-metadata";
import {
  publicKey,
  createGenericFile,
  sol,
  percentAmount,
  some,
} from "@metaplex-foundation/umi";
import { transferSol, fetchMint } from "@metaplex-foundation/mpl-toolbox";
import { useState, useRef, useMemo, useEffect } from "react";
import bs58 from "bs58";

const shortSig = (sig) => (sig ? `${sig.slice(0, 8)}...${sig.slice(-8)}` : "");

const MetaForm = () => {
  const { language } = useLanguage();
  const { currentNetwork } = useNetwork();
  const { solToolProgram, feeConfigPda } = useSolToolAnchorProgram();
  const wallet = useWallet();

  const t = translations[language] || translations.en;

  const [loadingFees, setLoadingFees] = useState(true);
  const [updateFee, setUpdateFee] = useState(0.1);

  const fileInputRef = useRef(null);

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [txSignature, setTxSignature] = useState("");
  const [modalErrorMessage, setModalErrorMessage] = useState("");

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
      toast.error(t.invalidImageFile);
      return;
    }
    if (file.size > 1000 * 1024) {
      toast.error(t.imageTooLarge);
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
      toast.error(t.connectWalletFirst);
      return;
    }
    if (!tokenAddress.trim()) {
      toast.error(t.enterTokenAddress);
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
        setHasMetadata(true);
        setCurrentMetadata(metadata);
        setName(metadata.name || "");
        setSymbol(metadata.symbol || "");

        if (!metadata.isMutable) {
          throw new Error(t.metadataImmutable);
        }

        if (
          metadata.updateAuthority.toString() !==
          umi.identity.publicKey.toString()
        ) {
          throw new Error(t.notUpdateAuthority);
        }

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
        setStatusMessage(t.verifiedReadyUpdate);
      } else {
        setHasMetadata(false);

        if (!mintInfo.mintAuthority.value) {
          throw new Error(t.mintAuthorityRevoked);
        }

        if (
          mintInfo.mintAuthority.value.toString().toLowerCase() !==
          umi.identity.publicKey.toString().toLowerCase()
        ) {
          throw new Error(t.notMintAuthority);
        }

        setVerificationStatus("success");
        setStatusMessage(t.noMetadataFound);
      }
    } catch (error) {
      setVerificationStatus("error");
      setStatusMessage(error.message || t.invalidTokenOrAuthority);
      toast.error(error.message || t.verificationFailed);
    } finally {
      setChecking(false);
    }
  };

  const submitMetadata = async () => {
    if (!umi || verificationStatus !== "success") {
      toast.error(t.verifyTokenFirst);
      return;
    }
    if (!description.trim()) {
      toast.error(t.descriptionRequired);
      return;
    }

    if (!hasMetadata) {
      if (!name.trim() || !symbol.trim()) {
        toast.error(t.nameSymbolRequired);
        return;
      }
      if (!imageFile) {
        toast.error(t.imageRequired);
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
          {
            contentType: imageFile.type,
          },
        );
        [imageUri] = await umi.uploader.upload([file]);
        toast.success(t.imageUploaded);
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
      toast.success(t.metadataJsonUploaded);

      let txBuilder;
      if (hasMetadata) {
        const preservedData = {
          name: currentMetadata.name,
          symbol: currentMetadata.symbol,
          uri: newUri,
          sellerFeeBasisPoints: currentMetadata.sellerFeeBasisPoints,
          creators: currentMetadata.creators,
          primarySaleHappened: currentMetadata.primarySaleHappened,
          isMutable: some(true),
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
        txBuilder = createMetadataAccountV3(umi, {
          metadata: metadataPda,
          mint: mintKey,
          mintAuthority: umi.identity,
          payer: umi.identity,
          updateAuthority: umi.identity,
          isMutable: some(true),
          collectionDetails: null,
          data: {
            name: name.trim(),
            symbol: symbol.trim(),
            uri: newUri,
            sellerFeeBasisPoints: percentAmount(0),
            creators: [{ address: feeConfigPda, verified: false, share: 100 }],
            collection: null,
            uses: null,
          },
        });
      }

      txBuilder = txBuilder.prepend(
        transferSol(umi, {
          source: umi.identity,
          destination: feeConfigPda,
          amount: sol(updateFee),
        }),
      );

      const result = await txBuilder.sendAndConfirm(umi);
      const signature = bs58.encode(result.signature);

      setTxSignature(signature);
      setSuccessModalOpen(true);

      setStatusMessage(`${hasMetadata ? "Update" : "Creation"} successful!`);
    } catch (error) {
      console.error("Operation failed:", error);
      setModalErrorMessage(t.operationFailed);
      setErrorModalOpen(true);
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

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-10">
        {/* Token Address */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
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
              onClick={checkTokenMetadata}
              disabled={checking || !tokenAddress.trim()}
              className="w-full sm:w-auto bg-[#02CCE6] text-white px-8 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-cyan-600 transition disabled:cursor-not-allowed"
            >
              🔍 {checking ? t.checking : t.check}
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
              {verificationStatus === "success" ? t.success : t.error}{" "}
              {statusMessage}
            </p>
          )}
        </div>

        {verificationStatus === "success" && (
          <>
            {/* Name & Symbol – Creation only */}
            {!hasMetadata && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    📛 {t.name} <span className="text-red-500">*</span>
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
                    🔣 {t.symbol} <span className="text-red-500">*</span>
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

            {/* Name & Symbol – Update (read-only) */}
            {hasMetadata && currentMetadata && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    📛 {t.nameCannotUpdate}
                  </label>
                  <p className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm bg-gray-100">
                    {currentMetadata.name}
                  </p>
                </div>
                <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    🔣 {t.symbolCannotUpdate}
                  </label>
                  <p className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm bg-gray-100">
                    {currentMetadata.symbol}
                  </p>
                </div>
              </div>
            )}

            {/* Image & Description */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  🖼️ {t.image}{" "}
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
                      <p className="mt-3 font-medium">{t.uploadImage}</p>
                      <p className="text-xs mt-1">{t.uploadImageDesc}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  📝 {t.description} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.descriptionDesc}
                  rows={12}
                  className="w-full border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  🌐 {t.addLinks}
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
                <>
                  <p className="text-sm text-gray-500 mb-4">{t.addLinksDesc}</p>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700">
                        {t.website}
                      </label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder={t.websitedesc}
                        className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700">
                        {t.twitter}
                      </label>
                      <input
                        type="url"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder={t.twitterdesc}
                        className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700">
                        {t.telegram}
                      </label>
                      <input
                        type="url"
                        value={telegram}
                        onChange={(e) => setTelegram(e.target.value)}
                        placeholder={t.telegramdesc}
                        className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700">
                        {t.discord}
                      </label>
                      <input
                        type="url"
                        value={discord}
                        onChange={(e) => setDiscord(e.target.value)}
                        placeholder={t.discorddesc}
                        className="border border-[#E6E8EC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Submit Button */}
            <div className="bg-white border border-[#E6E8EC] rounded-2xl p-4 shadow-sm text-center">
              <div className="text-base font-bold mb-2 flex items-center justify-center gap-2">
                💰 {t.fee}:
                <span className="text-[#02CCE6]">
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
                  ? t.processing
                  : hasMetadata
                    ? t.update
                    : t.createMetadata}
              </button>
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
                  <p className="text-sm text-red-700 break-words">
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
                  rel="noopener noreferrer"
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

export default MetaForm;
