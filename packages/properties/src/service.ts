import lz from 'lz-string';
import { Crypto, type CryptoConfig } from './Crypto';

const CRYPTO_CONFIG: CryptoConfig = {
    algorithm: 'aes-256-gcm',
    secretKey: '47VEqSZ8HBSa+/TImW+1kCeuQeAkm5NS',
    iv: 'c2122263835f9449b9b3333984c59080',
};

export class Properties {
    private encryptData(data: string): string {
        const crypto = Crypto.fromConfig(CRYPTO_CONFIG);
        return crypto.encrypt(data);
    }
    
    private decryptData(data: string): string {
        const crypto = Crypto.fromConfig(CRYPTO_CONFIG);
        return crypto.encrypt(data);
    }
    
    private compressData(data: string): string {
        return lz.compress(data);
    }

    private decompressData(data: string): string {
        return lz.decompress(data);
    }

    public process(data: string): string {
        const encrypted = this.encryptData(data);
        const compressed = this.compressData(encrypted);
        return compressed;
    }
}
