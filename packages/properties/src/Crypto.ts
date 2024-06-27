import crypto from 'crypto';

export type CryptoConfig = {
    algorithm: string;
    secretKey: string;
    iv: string;
};

export class Crypto {
    #algorithm: string;

    #secretKey: string;

    #iv: crypto.BinaryLike;

    constructor(cryptoParams: CryptoConfig) {
        const { algorithm, secretKey } = cryptoParams;
        const iv = Buffer.from(cryptoParams.iv, 'hex');
        this.#algorithm = algorithm;
        this.#secretKey = secretKey;
        this.#iv = iv;
    }

    public encrypt(text: string): string {
        const cipheriv = crypto.createCipheriv(this.#algorithm, this.#secretKey, this.#iv);
        const encrypted = Buffer.concat([cipheriv.update(text), cipheriv.final()]);
        return encrypted.toString('hex');
    }

    public decrypt(text: string): string {
        const decipheriv = crypto.createDecipheriv(this.#algorithm, this.#secretKey, this.#iv);
        const decrypted = Buffer.concat([decipheriv.update(Buffer.from(text, 'hex')), decipheriv.final()]);
        return decrypted.toString();
    }
}
