// Interfaces
interface IPropertyStrategy<T = any> {
    encode(data: any): Promise<string>;
    decode(data: string): Promise<any>;
    readonly strategyName: string;
    readonly parameters: T;
}

interface IPropertyEntity {
    getData(key: string, ...args: any[]): Promise<any>;
    setData(key: string, data: any, ...args: any[]): Promise<void>;
    deleteData(key: string, ...args: any[]): Promise<void>;
}

interface StoredPropertyData {
    data: string;
    strategyIds: string[];
}

// Strategy Registry
class StrategyRegistry {
    private strategies: Map<string, IPropertyStrategy> = new Map();

    registerStrategy(strategy: IPropertyStrategy): string {
        const id = this.generateUniqueId(strategy);
        this.strategies.set(id, strategy);
        return id;
    }

    getStrategy(id: string): IPropertyStrategy | undefined {
        return this.strategies.get(id);
    }

    private generateUniqueId(strategy: IPropertyStrategy): string {
        return `${strategy.strategyName}-${JSON.stringify(strategy.parameters)}`;
    }
}

// Strategy implementations
class EncodingStrategy implements IPropertyStrategy {
    readonly strategyName = 'EncodingStrategy';
    readonly parameters = {};

    async encode(data: any): Promise<string> {
        return Buffer.from(JSON.stringify(data)).toString('base64');
    }

    async decode(data: string): Promise<any> {
        return JSON.parse(Buffer.from(data, 'base64').toString());
    }
}

class EncryptionStrategy implements IPropertyStrategy {
    readonly strategyName = 'EncryptionStrategy';
    readonly parameters = {};

    async encode(data: any): Promise<string> {
        // Placeholder for encryption logic
        return `encrypted:${data}`;
    }

    async decode(data: string): Promise<any> {
        // Placeholder for decryption logic
        return data.replace('encrypted:', '');
    }
}

interface ChunkingStrategyParameters {
    chunkSize: number;
    basePropertyName: string;
}

class ChunkingStrategy implements IPropertyStrategy<ChunkingStrategyParameters> {
    readonly strategyName = 'ChunkingStrategy';
    readonly parameters: ChunkingStrategyParameters;

    private jiraApi: any;

    constructor(jiraApi: any, parameters: ChunkingStrategyParameters) {
        this.jiraApi = jiraApi;
        this.parameters = parameters;
    }

    private getChunkPropertyName(chunkNumber: number): string {
        return `${this.parameters.basePropertyName}.chunk${chunkNumber}`;
    }

    async encode(data: any): Promise<string> {
        const jsonData = JSON.stringify(data);
        const chunks = [];
        for (let i = 0; i < jsonData.length; i += this.parameters.chunkSize) {
            chunks.push(jsonData.slice(i, i + this.parameters.chunkSize));
        }
        const metadata = {
            totalChunks: chunks.length,
            hash: this.calculateHash(jsonData),
        };

        // Store chunks in separate properties
        await Promise.all(chunks.map((chunk, index) => this.jiraApi.setProperty(this.getChunkPropertyName(index), chunk)));

        // Return metadata
        return JSON.stringify(metadata);
    }

    async decode(metadata: string): Promise<any> {
        const { totalChunks, hash } = JSON.parse(metadata);
        const chunks = await Promise.all(Array.from({ length: totalChunks }, (_, i) => this.jiraApi.getProperty(this.getChunkPropertyName(i))));

        const reconstructedData = chunks.join('');
        if (this.calculateHash(reconstructedData) !== hash) {
            throw new Error('Data integrity check failed');
        }
        return JSON.parse(reconstructedData);
    }

    private calculateHash(data: string): string {
        // Implement a hash function here
        return 'hash';
    }
}

// Base Property Entity
abstract class BasePropertyEntity implements IPropertyEntity {
    protected jiraApi: any;
    protected strategyRegistry: StrategyRegistry;
    protected currentStrategyIds: string[] = [];

    constructor(jiraApi: any, strategyRegistry: StrategyRegistry) {
        this.jiraApi = jiraApi;
        this.strategyRegistry = strategyRegistry;
    }

    protected abstract getPropertyName(...args: any[]): string;

    protected async processData(storedData: StoredPropertyData, encode: boolean): Promise<any> {
        let processedData = encode ? storedData.data : storedData;
        const strategyIds = encode ? this.currentStrategyIds : storedData.strategyIds;
        const strategySequence = encode ? strategyIds : [...strategyIds].reverse();

        for (const id of strategySequence) {
            const strategy = this.strategyRegistry.getStrategy(id);
            if (!strategy) {
                throw new Error(`Strategy with id ${id} not found`);
            }
            processedData = await (encode ? strategy.encode(processedData) : strategy.decode(processedData));
        }

        if (encode) {
            return {
                data: processedData,
                strategyIds: this.currentStrategyIds,
            };
        }

        return processedData;
    }

    async getData(key: string, ...args: any[]): Promise<any> {
        const propertyName = this.getPropertyName(...args);
        const rawData = await this.jiraApi.getProperty(key, propertyName);
        if (!rawData) return null;

        const storedData: StoredPropertyData = JSON.parse(rawData);
        return this.processData(storedData, false);
    }

    async setData(key: string, data: any, ...args: any[]): Promise<void> {
        const propertyName = this.getPropertyName(...args);
        const processedData = await this.processData({ data, strategyIds: [] }, true);
        await this.jiraApi.setProperty(key, propertyName, JSON.stringify(processedData));
    }

    async deleteData(key: string, ...args: any[]): Promise<void> {
        const propertyName = this.getPropertyName(...args);
        await this.jiraApi.deleteProperty(key, propertyName);
    }

    updateStrategies(newStrategies: IPropertyStrategy[]): void {
        this.currentStrategyIds = newStrategies.map((strategy) => this.strategyRegistry.registerStrategy(strategy));
    }
}

// Concrete Property Entities
class FormDataEntity extends BasePropertyEntity {
    constructor(jiraApi: any, strategyRegistry: StrategyRegistry) {
        super(jiraApi, strategyRegistry);
        this.updateStrategies([
            new ChunkingStrategy(jiraApi, {
                chunkSize: 32768,
                basePropertyName: 'formData',
            }),
            new EncodingStrategy(),
        ]);
    }

    protected getPropertyName(formNumber: number, versionNumber: number): string {
        return `formData.v${versionNumber}.${formNumber}`;
    }

    async getData(issueKey: string, formNumber: number, versionNumber: number): Promise<any> {
        return super.getData(issueKey, formNumber, versionNumber);
    }

    async setData(issueKey: string, data: any, formNumber: number, versionNumber: number): Promise<void> {
        return super.setData(issueKey, data, formNumber, versionNumber);
    }

    async deleteData(issueKey: string, formNumber: number, versionNumber: number): Promise<void> {
        return super.deleteData(issueKey, formNumber, versionNumber);
    }

    updateFormDataStrategies(newStrategies: IPropertyStrategy[]): void {
        this.updateStrategies(newStrategies);
    }
}

// IsAutoAddTriggeredEntity
class IsAutoAddTriggeredEntity extends BasePropertyEntity {
    private readonly propertyName = 'isAutoAddTriggered';

    constructor(jiraApi: any, strategyRegistry: StrategyRegistry) {
        super(jiraApi, strategyRegistry);
        // No strategies for this entity
    }

    protected getPropertyName(): string {
        return this.propertyName;
    }

    async getData(key: string): Promise<boolean> {
        const rawData = await super.getData(key);
        return rawData === 'true';
    }

    async setData(key: string, data: boolean): Promise<void> {
        await super.setData(key, data.toString());
    }
}

// Main Service
class PropertiesService {
    private jiraApi: any;
    private strategyRegistry: StrategyRegistry;
    formData: FormDataEntity;
    isAutoAddTriggered: IsAutoAddTriggeredEntity;

    constructor(jiraApi: any) {
        this.jiraApi = jiraApi;
        this.strategyRegistry = new StrategyRegistry();
        this.formData = new FormDataEntity(jiraApi, this.strategyRegistry);
        this.isAutoAddTriggered = new IsAutoAddTriggeredEntity(jiraApi, this.strategyRegistry);
    }
}

// Usage
const jiraApi = new JiraApi(); // Assume JiraApi is implemented elsewhere
const propertiesService = new PropertiesService(jiraApi);

// Example usage
async function example() {
    const issueKey = 'ISSUE-123';
    const formNumber = 1;
    const formVersion = 2;

    // Using FormDataEntity with initial strategies
    await propertiesService.formData.setData(issueKey, { name: 'John Doe' }, formNumber, formVersion);
    let formData = await propertiesService.formData.getData(issueKey, formNumber, formVersion);
    console.log(formData); // { name: 'John Doe' }

    // Update strategies: reorder and add new strategy
    propertiesService.formData.updateFormDataStrategies([
        new EncodingStrategy(),
        new ChunkingStrategy(jiraApi, {
            chunkSize: 32768,
            basePropertyName: 'formData',
        }),
        new EncryptionStrategy(),
    ]);

    // Set new data with updated strategies
    await propertiesService.formData.setData(issueKey, { name: 'Jane Doe' }, formNumber, formVersion);

    // Get data (this will work for both old and new versions)
    formData = await propertiesService.formData.getData(issueKey, formNumber, formVersion);
    console.log(formData); // { name: 'Jane Doe' }

    await propertiesService.formData.deleteData(issueKey, formNumber, formVersion);

    // Using IsAutoAddTriggeredEntity
    await propertiesService.isAutoAddTriggered.setData(issueKey, true);
    const isTriggered = await propertiesService.isAutoAddTriggered.getData(issueKey);
    console.log(isTriggered); // true

    await propertiesService.isAutoAddTriggered.deleteData(issueKey);
}
