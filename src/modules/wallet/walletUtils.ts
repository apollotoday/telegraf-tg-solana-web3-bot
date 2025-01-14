import { Keypair } from "@solana/web3.js";
import * as CryptoJS from "crypto-js";
import bs58 from "bs58";
import pako from "pako";

export const secret = "knininiin";

export function generateAndEncryptWallet() {
  const keypair = Keypair.generate();

  const encryptedPrivKey = encryptPrivateKey(keypair.secretKey, secret);

  return {
    pubkey: keypair.publicKey.toBase58(),
    encryptedPrivKey,
  };
}

export function decryptWallet(encryptedPrivKey: string) {
  return Keypair.fromSecretKey(decryptPrivateKey(encryptedPrivKey, secret));
}

export function uint8ArrayToBase58(uint8Array: Uint8Array) {
  return bs58.encode(uint8Array)
}

export function base58ToUint8Array(base58: string) {
  return bs58.decode(base58)
}


export function loadWalletFromU8IntArrayStringified(data: string) {
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(data)))
}

export function encryptPrivateKey(
  privateKey: Uint8Array,
  secret: string
): string {
  // Compress the private key using pako (gzip)
  const compressedPrivateKey = pako.deflate(privateKey);

  // Convert the compressed private key to a base64 string
  const compressedBase64 = Buffer.from(compressedPrivateKey).toString("base64");

  // Encrypt the base64 string using AES
  const encrypted = CryptoJS.AES.encrypt(compressedBase64, secret).toString();

  // Convert the encrypted string to a buffer
  const encryptedBuffer = Buffer.from(encrypted, "base64");

  // Encode the buffer using Base58
  return bs58.encode(encryptedBuffer);
}

export function decryptPrivateKey(encryptedPrivateKey: string, secret: string): Uint8Array {
  // Decode the encrypted private key using Base58
  const encryptedBuffer = bs58.decode(encryptedPrivateKey);

  // Convert the buffer to a base64 string
  const encryptedBase64 = Buffer.from(encryptedBuffer).toString("base64");

  // Decrypt the base64 string using AES
  const decryptedBytes = CryptoJS.AES.decrypt(encryptedBase64, secret);
  const compressedBase64 = decryptedBytes.toString(CryptoJS.enc.Utf8);

  // Convert the decrypted base64 string to a Uint8Array
  const compressedPrivateKey = Buffer.from(compressedBase64, "base64");

  // Decompress the private key using pako (gzip)
  return new Uint8Array(pako.inflate(compressedPrivateKey));
}

export function loadWalletFromEnv(name: string) {
  const pkStr = process.env[`${name}`]!;

  if (!pkStr) throw new Error(`${name} not found in env`);

  return Keypair.fromSecretKey(bs58.decode(pkStr));
}
