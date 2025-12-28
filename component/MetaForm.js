"use client";

import { useState, useRef, useMemo } from "react";
import Image from "next/image";
import { MdOutlineFileUpload } from "react-icons/md";
import { IoIosInformationCircle } from "react-icons/io";
import { TiCancel } from "react-icons/ti";
import { useLanguage } from "@/app/Context/LanguageContext";
import { MetaFormTranslations as translations } from "../utils/MetaFormLanguague";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import {
  fetchMetadata,
  findMetadataPda,
  updateV1,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  publicKey,
  sol,
  createGenericFileFromBrowserFile,
} from "@metaplex-foundation/umi";
import { transferSol } from "@metaplex-foundation/mpl-toolbox";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";

const MetaForm = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const wallet = useWallet();
  const fileInputRef = useRef(null);

  const [tokenAddress, setTokenAddress] = useState("");
  const [imageFile, setImageFile] = useState(null); // Raw File object
  const [previewUrl, setPreviewUrl] = useState(null);
  const [existingImageUri, setExistingImageUri] = useState("");
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
  const [isHoveringImage, setIsHoveringImage] = useState(false);

  const umi = useMemo(() => {
    if (!wallet.connected || !wallet.publicKey) return null;
    return createUmi("https://api.devnet.solana.com") // Change to devnet if needed
      .use(walletAdapterIdentity(wallet))
      .use(mplTokenMetadata())
      .use(irysUploader());
  }, [wallet.connected, wallet.publicKey]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }
    if (file.size > 500 * 1024) {
      toast.error("Image must be 500KB or less");
      return;
    }

    setImageFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const checkTokenMetadata = async () => {
    if (!umi) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!tokenAddress.trim()) {
      toast.error("Please enter a token address");
      return;
    }

    setChecking(true);
    setVerificationStatus(null);
    setStatusMessage("");
    setExistingImageUri("");
    setDescription("");
    setWebsite("");
    setTwitter("");
    setTelegram("");
    setDiscord("");
    setSocialEnabled(false);
    removeImage();

    try {
      const mint = publicKey(tokenAddress.trim());
      const metadataPda = findMetadataPda(umi, { mint });
      const metadataAccount = await fetchMetadata(umi, metadataPda);

      const updateAuthority = metadataAccount.updateAuthority;
      const isMutable = metadataAccount.isMutable === true;
      const walletPubkey = umi.identity.publicKey;

      if (updateAuthority.toString() !== walletPubkey.toString()) {
        setVerificationStatus("error");
        setStatusMessage("Update authority does not match your wallet");
        toast.error("You are not the update authority");
        setChecking(false);
        return;
      }

      if (!isMutable) {
        setVerificationStatus("error");
        setStatusMessage("Metadata is immutable and cannot be updated");
        toast.error("This token's metadata is frozen");
        setChecking(false);
        return;
      }

      setCurrentMetadata(metadataAccount);
      setVerificationStatus("success");
      setStatusMessage("Ownership verified! You can now update the metadata.");
      toast.success("Ready to update metadata");

      console.log(metadataAccount.uri);

      // Load existing off-chain metadata
      if (metadataAccount?.uri && metadataAccount.uri.trim()) {
        try {
          const resp = await fetch(metadataAccount.uri.trim());
          if (resp.ok) {
            const json = await resp.json();
            setDescription(json.description || "");
            setWebsite(json.external_url || "");
            setExistingImageUri(json.image || "");

            if (json.properties?.links) {
              const links = json.properties.links;
              setTwitter(links.twitter || "");
              setTelegram(links.telegram || "");
              setDiscord(links.discord || "");
              if (Object.keys(links).length > 0) setSocialEnabled(true);
            }
          }
        } catch (err) {
          console.log("Could not fetch existing metadata JSON");
        }
      }
    } catch (error) {
      console.error(error);
      setVerificationStatus("error");
      setStatusMessage("Invalid token or no Metaplex metadata found");
      toast.error("Token not found or has no valid metadata");
    } finally {
      setChecking(false);
    }
  };

  const updateMetadata = async () => {
    if (!umi || verificationStatus !== "success" || !currentMetadata) {
      toast.error("Verify ownership first");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    setUpdating(true);

    try {
      let imageUri = existingImageUri;

      if (imageFile) {
        const genericFile = await createGenericFileFromBrowserFile(imageFile);
        [imageUri] = await umi.uploader.upload([genericFile]);
        toast.success("New image uploaded");
      }

      const properties = {
        files: [
          { uri: imageUri, type: imageFile ? imageFile.type : "image/png" },
        ],
        category: "image",
      };

      if (socialEnabled) {
        const links = {};
        if (website.trim()) links.website = website.trim();
        if (twitter.trim()) links.twitter = twitter.trim();
        if (telegram.trim()) links.telegram = telegram.trim();
        if (discord.trim()) links.discord = discord.trim();
        if (Object.keys(links).length > 0) properties.links = links;
      }

      const metadataJson = {
        name: "",
        symbol: "",
        description: description.trim(),
        image: imageUri,
        external_url: socialEnabled && website.trim() ? website.trim() : "",
        properties,
      };

      const metadataUri = await umi.uploader.uploadJson(metadataJson);
      toast.success("Metadata JSON uploaded");

      const mint = publicKey(tokenAddress.trim());
      const metadataPda = findMetadataPda(umi, { mint });

      const feeAddress = publicKey(
        "Ezapurmy7RCgNo2F41xSsf6yk5mvtStkoqVQnw9fkaqN"
      );
      const feeAmount = sol(0.1);

      // SAFELY reconstruct the DataV2 struct
      const originalData = currentMetadata.data || {};
      const safeData = {
        name: originalData.name || "",
        symbol: originalData.symbol || "",
        uri: metadataUri,
        sellerFeeBasisPoints: originalData.sellerFeeBasisPoints || 0,
        // Do NOT include creators here!
        primarySaleHappened: originalData.primarySaleHappened || false,
        isMutable: originalData.isMutable ?? true,
        tokenStandard: originalData.tokenStandard || null,
        collection: originalData.collection || null,
        uses: originalData.uses || null,
        collectionDetails: originalData.collectionDetails || null,
        programmableConfig: originalData.programmableConfig || null,
      };

      let txBuilder = updateV1(umi, {
        mint,
        metadata: metadataPda,
        data: safeData, // Use fully safe object
        authority: umi.identity,
      });

      txBuilder = txBuilder.prepend(
        transferSol(umi, {
          source: umi.identity,
          destination: feeAddress,
          amount: feeAmount,
        })
      );

      await txBuilder.sendAndConfirm(umi);
      toast.success("Metadata updated successfully! 0.1 SOL fee sent.");
      setStatusMessage("Update complete!");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update metadata");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <section className="max-w-4xl mx-auto p-6">
      <form
        className="flex flex-col gap-10"
        onSubmit={(e) => e.preventDefault()}
      >
        {/* Token Address */}
        <div>
          <label className="font-semibold">{t.tokenAddress}</label>
          <div className="flex flex-col md:flex-row mt-2 gap-4">
            <div className="flex-1">
              <input
                className="w-full border border-[#E6E8EC] rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                type="text"
                placeholder={t.enterAddress}
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
              />
              {verificationStatus && (
                <p
                  className={`mt-2 font-semibold ${
                    verificationStatus === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {statusMessage}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={checkTokenMetadata}
              disabled={checking || !tokenAddress.trim()}
              className="bg-[#02CCE6] text-white px-8 h-12 rounded font-medium disabled:opacity-50"
            >
              {checking ? "Checking..." : t.check}
            </button>
          </div>
        </div>

        {/* Update Form */}
        {verificationStatus === "success" && (
          <>
            {/* Image & Description */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Image */}
              <div className="flex flex-col">
                <label className="text-black mb-1 font-medium">
                  <sup className="text-red-500 font-bold">*</sup> {t.image}
                </label>
                <div
                  onMouseEnter={() => setIsHoveringImage(true)}
                  onMouseLeave={() => setIsHoveringImage(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-[#E6E8EC] h-64 rounded-lg overflow-hidden cursor-pointer hover:border-[#02CCE6] transition"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  {previewUrl || existingImageUri ? (
                    <Image
                      src={previewUrl || existingImageUri}
                      alt="Token Image"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <MdOutlineFileUpload className="text-5xl text-[#02CCE6]" />
                      <p className="mt-2 text-gray-600">{t.uploadImage}</p>
                    </div>
                  )}

                  {(previewUrl || existingImageUri) && isHoveringImage && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                        className="bg-red-600 text-white rounded-full p-3 hover:bg-red-700"
                      >
                        <TiCancel size={36} />
                      </button>
                    </div>
                  )}
                </div>
                <small className="text-gray-500 mt-1">
                  Any image • Max 500KB
                </small>
              </div>

              {/* Description */}
              <div className="flex flex-col">
                <label className="text-black mb-1 font-medium">
                  <sup className="text-red-500 font-bold">*</sup>{" "}
                  {t.description}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.descriptionDesc}
                  className="border border-[#E6E8EC] p-3 rounded h-64 resize-none focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{t.addLinks}</h3>
                <IoIosInformationCircle className="text-xl text-gray-500" />
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={socialEnabled}
                    onChange={(e) => setSocialEnabled(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <small className="text-gray-500">{t.addLinksDesc}</small>

              {socialEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t.website}
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder={t.websitedesc}
                      className="w-full border border-[#E6E8EC] p-3 rounded focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t.twitter}
                    </label>
                    <input
                      type="url"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="https://twitter.com/yourproject"
                      className="w-full border border-[#E6E8EC] p-3 rounded focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t.telegram}
                    </label>
                    <input
                      type="url"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      placeholder={t.telegramdesc}
                      className="w-full border border-[#E6E8EC] p-3 rounded focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t.discord}
                    </label>
                    <input
                      type="url"
                      value={discord}
                      onChange={(e) => setDiscord(e.target.value)}
                      placeholder={t.discorddesc}
                      className="w-full border border-[#E6E8EC] p-3 rounded focus:outline-none focus:ring-2 focus:ring-[#02CCE6]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="text-center">
              <p className="text-gray-500 mb-4">
                {t.fee}: <span className="font-bold text-black">0.10 SOL</span>
              </p>
              <button
                type="button"
                onClick={updateMetadata}
                disabled={updating || !description.trim()}
                className="bg-[#02CCE6] text-white px-16 py-3 rounded-lg font-semibold disabled:opacity-60"
              >
                {updating ? "Updating..." : t.update}
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  );
};

export default MetaForm;
