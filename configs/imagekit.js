// /configs/imagekit.js
import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Quick safety log:
console.log("[ImageKit Config]:", {
  urlEndpoint: imagekit?.options?.urlEndpoint || "❌ MISSING",
  hasPublicKey: !!process.env.IMAGEKIT_PUBLIC_KEY,
  hasPrivateKey: !!process.env.IMAGEKIT_PRIVATE_KEY,
});

export default imagekit;
