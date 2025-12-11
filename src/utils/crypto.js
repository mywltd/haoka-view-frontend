// 🔒 安全加密通信模块 - 兼容版
class CryptoClient {
  constructor() {
    // 会话状态（新）
    this.sessionToken = null; // 后端返回的令牌，用于GCM加密响应
    this.sessionKey = null;   // ArrayBuffer(32)

    // 关闭 CBC 回退：任何环境均不启用固定密钥
    this.fallbackKeyHex = null;
    this.ready = false;
    // 传输层混淆密钥派生（与后端约定同源常量再sha256）
    this._obfKeyBytes = null;
    this._deviceSalt = null; // 客户端指纹盐
  }

  /**
   * 🔓 数据解密（自动识别 AES-GCM 或 CBC）
   * @param {string} encryptedData - 后端返回的 data 字段（base64(JSON)）
   * @param {string} algHint - 可选，后端返回的 alg 提示（AES-GCM / AES-CBC）
   */
  async decryptData(encryptedData, algHint) {
    try {
      // 解析加密数据包（外层为 base64 -> JSON）
      const decoded = atob(encryptedData);
      const pack = JSON.parse(decoded);

      // 优先走会话 GCM
      if ((algHint === 'AES-GCM' || pack.alg === 'AES-GCM') && this.sessionKey) {
        if (!pack.data || !pack.iv || !pack.tag) throw new Error('Invalid GCM format');
        const key = await crypto.subtle.importKey('raw', this.sessionKey, 'AES-GCM', false, ['decrypt']);
        const plaintext = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: this.base64ToUint8(pack.iv) },
          key,
          this.concatCipherTag(this.base64ToUint8(pack.data), this.base64ToUint8(pack.tag))
        );
        return JSON.parse(new TextDecoder().decode(plaintext));
      }

      // 已停用 CBC 回退
      throw new Error('CBC is disabled');

    } catch (error) {
      throw new Error('Decryption failed: ' + error.message);
    }
  }

  /** Base64 -> ArrayBuffer/Uint8Array 工具 **/
  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  base64ToUint8(base64) {
    return new Uint8Array(this.base64ToArrayBuffer(base64));
  }

  concatCipherTag(cipherUint8, tagUint8) {
    const merged = new Uint8Array(cipherUint8.length + tagUint8.length);
    merged.set(cipherUint8, 0);
    merged.set(tagUint8, cipherUint8.length);
    return merged.buffer;
  }

  /**
   * 🤝 会话握手流程：
   * 1) GET /api/public-key -> 获取RSA-OAEP公钥
   * 2) 生成随机32字节sessionKey
   * 3) 使用RSA-OAEP加密sessionKey -> POST /api/session/init
   * 4) 保存 {sessionToken, sessionKey}
   */
  async initSession() {
    try {
      // 生成轻量客户端指纹盐（动态）
      this._deviceSalt = await this.computeDeviceSalt();
      const pkResp = await fetch('/api/public-key', {
        headers: { 'X-Obf-Salt': this._deviceSalt || 'nosalt' }
      });
      const pk = await pkResp.json();
      const obfPem = pk?.obfuscatedPublicKey;
      if (!pkResp.ok || !obfPem) throw new Error('公钥获取失败');
      const publicPem = await this.deobfuscateTransport(obfPem);

      // 生成会话密钥
      const sessionKey = crypto.getRandomValues(new Uint8Array(32));
      this.sessionKey = sessionKey.buffer;

      // 导入RSA公钥并加密会话密钥
      const spkiKey = await this.importPemPublicKey(publicPem);
      const encryptedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, spkiKey, sessionKey);
      const b64Key = this.arrayBufferToBase64(encryptedKey);

      const resp = await fetch('/api/session/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Obf-Salt': this._deviceSalt },
        body: JSON.stringify({ encryptedKey: b64Key })
      });
      const result = await resp.json();
      if (!resp.ok || !result?.token) throw new Error('会话初始化失败');

      // 传输层去混淆 token
      const token = await this.deobfuscateTransport(result.token);
      this.sessionToken = token;
      this.ready = true;
      return { token: result.token, expiry: result.expiry };
    } catch (e) {
      // 禁止降级，保持未就绪并抛出错误
      this.sessionToken = null;
      this.sessionKey = null;
      this.ready = false;
      throw e;
    }
  }

  // ===== 传输层混淆：与后端一致（Base64 <-> XOR with sha256(key)) =====
  getObfKeyBytes() {
    if (this._obfKeyBytes) return this._obfKeyBytes;
    // 与后端同源常量，避免明文 token 出现
    const base = 'transport-obf-key@2025-v1';
    const key = this._deviceSalt ? `${base}:${this._deviceSalt}` : base;
    const enc = new TextEncoder();
    const data = enc.encode(key);
    // 使用 WebCrypto 计算 SHA-256
    return window.crypto.subtle.digest('SHA-256', data).then(buf => {
      this._obfKeyBytes = new Uint8Array(buf);
      return this._obfKeyBytes;
    });
  }

  obfuscateTransportSync(plain) {
    // 仅用于调试/极少场景，本项目主要用后端->前端的去混淆
    const encoder = new TextEncoder();
    const data = encoder.encode(String(plain));
    // 同步hash不可用，这里不提供同步混淆
    throw new Error('not implemented');
  }

  deobfuscateTransport(obfBase64) {
    const dec = atob(obfBase64);
    const data = new Uint8Array(dec.length);
    for (let i = 0; i < dec.length; i++) data[i] = dec.charCodeAt(i);
    return new Promise(async (resolve, reject) => {
      try {
        const key = await this.getObfKeyBytes();
        const out = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
          out[i] = data[i] ^ key[i % key.length];
        }
        resolve(new TextDecoder().decode(out));
      } catch (e) {
        reject(e);
      }
    });
  }

  async obfuscateTransport(plain) {
    const enc = new TextEncoder();
    const data = enc.encode(String(plain));
    const key = await this.getObfKeyBytes();
    const out = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      out[i] = data[i] ^ key[i % key.length];
    }
    let bin = '';
    for (let i = 0; i < out.length; i++) bin += String.fromCharCode(out[i]);
    return btoa(bin);
  }

  // ===== 设备指纹盐：采集少量非敏感特征，计算hash作为混淆盐 =====
  async computeDeviceSalt() {
    try {
      const nav = navigator || {};
      const screenInfo = screen || {};
      const parts = [
        nav.userAgent || '',
        nav.language || '',
        String(screenInfo.width || 0),
        String(screenInfo.height || 0),
        String(screenInfo.colorDepth || 0),
        String(new Date().getTimezoneOffset())
      ];
      const joined = parts.join('|');
      const enc = new TextEncoder();
      const hash = await crypto.subtle.digest('SHA-256', enc.encode(joined));
      const bytes = new Uint8Array(hash);
      // 取前16字节作为短盐（hex）
      let hex = '';
      for (let i = 0; i < 16; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
      }
      return hex;
    } catch (_) {
      return 'nosalt';
    }
  }

  async importPemPublicKey(pem) {
    const b64 = pem.replace(/-----BEGIN PUBLIC KEY-----/, '')
                  .replace(/-----END PUBLIC KEY-----/, '')
                  .replace(/\s+/g, '');
    const der = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return crypto.subtle.importKey(
      'spki',
      der,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    );
  }

  arrayBufferToBase64(buf) {
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  /**
   * ✅ 状态
   */
  isReady() {
    return this.ready;
  }
}

// 创建全局实例
const cryptoClient = new CryptoClient();
export default cryptoClient;