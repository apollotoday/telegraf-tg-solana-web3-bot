"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndEncryptWallet = generateAndEncryptWallet;
exports.decryptWallet = decryptWallet;
exports.uint8ArrayToBase58 = uint8ArrayToBase58;
exports.loadWalletFromU8IntArrayStringified = loadWalletFromU8IntArrayStringified;
exports.encryptPrivateKey = encryptPrivateKey;
exports.decryptPrivateKey = decryptPrivateKey;
const web3_js_1 = require("@solana/web3.js");
const CryptoJS = __importStar(require("crypto-js"));
const bs58_1 = __importDefault(require("bs58"));
const pako_1 = __importDefault(require("pako"));
const secret = 'knininiin';
function generateAndEncryptWallet() {
    const keypair = web3_js_1.Keypair.generate();
    const encryptedPrivKey = encryptPrivateKey(keypair.secretKey, secret);
    return {
        pubkey: keypair.publicKey.toBase58(),
        encryptedPrivKey
    };
}
function decryptWallet(encryptedPrivKey) {
    return web3_js_1.Keypair.fromSecretKey(decryptPrivateKey(encryptedPrivKey, secret));
}
function uint8ArrayToBase58(uint8Array) {
    return bs58_1.default.encode(uint8Array);
}
function loadWalletFromU8IntArrayStringified(data) {
    return web3_js_1.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(data)));
}
function encryptPrivateKey(privateKey, secret) {
    // Compress the private key using pako (gzip)
    const compressedPrivateKey = pako_1.default.deflate(privateKey);
    // Convert the compressed private key to a base64 string
    const compressedBase64 = Buffer.from(compressedPrivateKey).toString('base64');
    // Encrypt the base64 string using AES
    const encrypted = CryptoJS.AES.encrypt(compressedBase64, secret).toString();
    // Convert the encrypted string to a buffer
    const encryptedBuffer = Buffer.from(encrypted, 'base64');
    // Encode the buffer using Base58
    return bs58_1.default.encode(encryptedBuffer);
}
function decryptPrivateKey(encryptedPrivateKey, secret) {
    // Decode the encrypted private key using Base58
    const encryptedBuffer = bs58_1.default.decode(encryptedPrivateKey);
    // Convert the buffer to a base64 string
    const encryptedBase64 = Buffer.from(encryptedBuffer).toString('base64');
    // Decrypt the base64 string using AES
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedBase64, secret);
    const compressedBase64 = decryptedBytes.toString(CryptoJS.enc.Utf8);
    // Convert the decrypted base64 string to a Uint8Array
    const compressedPrivateKey = Buffer.from(compressedBase64, 'base64');
    // Decompress the private key using pako (gzip)
    return new Uint8Array(pako_1.default.inflate(compressedPrivateKey));
}
