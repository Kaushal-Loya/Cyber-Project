
export class CryptoService {
  // Convert ArrayBuffer to Base64
  static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Convert Base64 to ArrayBuffer
  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Generate RSA Key Pair (for Digital Signatures & Key Wrapping)
  static async generateKeyPair(): Promise<CryptoKeyPair> {
    return await window.crypto.subtle.generateKey(
      {
        name: "RSA-PSS",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );
  }
  
  // Generate RSA Key Pair for Encryption (Separate key recommended for encryption vs signing)
  static async generateEncryptionKeyPair(): Promise<CryptoKeyPair> {
    return await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );
  }

  // Generate AES Key (for Content Encryption)
  static async generateAESKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  // Encrypt Data (AES-GCM)
  // Returns: { iv: Base64, data: Base64 }
  static async encryptData(data: ArrayBuffer, key: CryptoKey): Promise<{ iv: string, cipherText: string }> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      data
    );

    return {
      iv: this.arrayBufferToBase64(iv.buffer),
      cipherText: this.arrayBufferToBase64(encrypted)
    };
  }

  // Decrypt Data (AES-GCM)
  static async decryptData(cipherTextBase64: string, ivBase64: string, key: CryptoKey): Promise<ArrayBuffer> {
    const cipherText = this.base64ToArrayBuffer(cipherTextBase64);
    const iv = this.base64ToArrayBuffer(ivBase64);

    return await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv),
      },
      key,
      cipherText
    );
  }

  // Export Key (Public) to Base64
  static async exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    return this.arrayBufferToBase64(exported);
  }

  // Import Key (Public) from Base64
  static async importPublicKey(base64Key: string, usage: "verify" | "encrypt" = "verify"): Promise<CryptoKey> {
    const binaryDer = this.base64ToArrayBuffer(base64Key);
    const alg = usage === "verify" 
        ? { name: "RSA-PSS", hash: "SHA-256" }
        : { name: "RSA-OAEP", hash: "SHA-256" };
    
    return await window.crypto.subtle.importKey(
      "spki",
      binaryDer,
      alg,
      true,
      [usage]
    );
  }

    // Export Key (Private) to Base64 - CAREFUL: Only for local storage/demo
  static async exportPrivateKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("pkcs8", key);
    return this.arrayBufferToBase64(exported);
  }

    // Import Key (Private) from Base64
  static async importPrivateKey(base64Key: string, usage: "sign" | "decrypt" = "sign"): Promise<CryptoKey> {
      const binaryDer = this.base64ToArrayBuffer(base64Key);
      const alg = usage === "sign" 
        ? { name: "RSA-PSS", hash: "SHA-256" }
        : { name: "RSA-OAEP", hash: "SHA-256" };

      return await window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        alg,
        true,
        [usage]
      );
  }

  // Sign Data (RSA-PSS)
  static async signData(data: string, key: CryptoKey): Promise<string> {
    const enc = new TextEncoder();
    const signature = await window.crypto.subtle.sign(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      key,
      enc.encode(data)
    );
    return this.arrayBufferToBase64(signature);
  }

  // Verify Signature
  static async verifySignature(data: string, signatureBase64: string, key: CryptoKey): Promise<boolean> {
    const enc = new TextEncoder();
    const signature = this.base64ToArrayBuffer(signatureBase64);
    return await window.crypto.subtle.verify(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      key,
      signature,
      enc.encode(data)
    );
  }

  // Hash Data (SHA-256)
  static async hashData(data: string): Promise<string> {
    const enc = new TextEncoder();
    const hash = await window.crypto.subtle.digest("SHA-256", enc.encode(data));
    return this.arrayBufferToBase64(hash);
  }
  
  // Wrap AES Key with RSA Public Key
  static async wrapKey(aesKey: CryptoKey, rsaPublicKey: CryptoKey): Promise<string> {
      const wrapped = await window.crypto.subtle.wrapKey(
          "raw",
          aesKey,
          rsaPublicKey,
          { name: "RSA-OAEP" }
      );
      return this.arrayBufferToBase64(wrapped);
  }
  
  // Unwrap AES Key with RSA Private Key
  static async unwrapKey(wrappedKeyBase64: string, rsaPrivateKey: CryptoKey): Promise<CryptoKey> {
      const wrappedKey = this.base64ToArrayBuffer(wrappedKeyBase64);
      return await window.crypto.subtle.unwrapKey(
          "raw",
          wrappedKey,
          rsaPrivateKey,
          { name: "RSA-OAEP" },
          { name: "AES-GCM", length: 256 },
          true,
          ["encrypt", "decrypt"]
      );
  }
}
