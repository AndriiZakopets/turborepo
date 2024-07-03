import crypto from 'crypto';

export type CryptoConfig = {
    algorithm: string;
    secretKey: string;
    iv: string;
};

export class Crypto {
    #iv: crypto.BinaryLike;

    constructor(
        private algorithm: string,
        private secretKey: string,
        iv: string
    ) {
        this.#iv = Buffer.from(iv, 'hex');
    }

    public encrypt(text: string): string {
        const cipheriv = crypto.createCipheriv(this.algorithm, this.secretKey, this.#iv);
        const encrypted = Buffer.concat([cipheriv.update(text), cipheriv.final()]);
        return encrypted.toString('hex');
    }

    public decrypt(text: string): string {
        const decipheriv = crypto.createDecipheriv(this.algorithm, this.secretKey, this.#iv);
        const decrypted = Buffer.concat([decipheriv.update(Buffer.from(text, 'hex')), decipheriv.final()]);
        return decrypted.toString();
    }

    public static fromConfig(config: CryptoConfig): Crypto {
        return new Crypto(config.algorithm, config.secretKey, config.iv);
    }
}
