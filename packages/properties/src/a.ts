import * as Yup from 'yup';

// Processing strategies remain the same as before
interface ProcessingStrategy {
    process(data: string): Promise<string>;
    reverse(data: string): Promise<string>;
}

// Implementations of ChunkStrategy, CompressionStrategy, EncryptionStrategy remain the same
class ChunkStrategy implements ProcessingStrategy {
    constructor(private chunkSize: number) {}
    async process(data: string): Promise<string> {
        // Implementation for chunking
        return data;
    }
    async reverse(data: string): Promise<string> {
        // Implementation for de-chunking
        return data;
    }
}

class CompressionStrategy implements ProcessingStrategy {
    async process(data: string): Promise<string> {
        // Implementation for compression (e.g., using LZ-string)
        return data;
    }
    async reverse(data: string): Promise<string> {
        // Implementation for decompression
        return data;
    }
}

class EncryptionStrategy implements ProcessingStrategy {
    constructor(private key: string) {}
    async process(data: string): Promise<string> {
        // Implementation for encryption
        return data;
    }
    async reverse(data: string): Promise<string> {
        // Implementation for decryption
        return data;
    }
}


// Enhanced ProcessingPipeline with a name
class NamedProcessingPipeline {
    constructor(
        public name: string,
        private strategies: ProcessingStrategy[]
    ) {}

    async process(data: string): Promise<string> {
        let result = data;
        for (const strategy of this.strategies) {
            result = await strategy.process(result);
        }
        return result;
    }

    async reverse(data: string): Promise<string> {
        let result = data;
        for (const strategy of this.strategies.slice().reverse()) {
            result = await strategy.reverse(result);
        }
        return result;
    }
}

// Registry for named pipelines
class PipelineRegistry {
    private pipelines: Map<string, NamedProcessingPipeline> = new Map();

    registerPipeline(pipeline: NamedProcessingPipeline): void {
        this.pipelines.set(pipeline.name, pipeline);
    }

    getPipeline(name: string): NamedProcessingPipeline | undefined {
        return this.pipelines.get(name);
    }
}

// Enhanced PropertyData interface with metadata
interface PropertyData {
    version: number;
    pipelineName: string;
    data: any;
}

// Version-specific schemas
const schemaV1 = Yup.object().shape({
    createdAt: Yup.string().required(),
});

const schemaV2 = Yup.object().shape({
    createdAt: Yup.string().required(),
    updatedAt: Yup.string().required(),
});

// Version transformer functions
const v1ToV2 = (data: any): any => ({
    ...data,
    updatedAt: data.updatedAt || data.createdAt,
});

class PropertyService {
    constructor(private pipelineRegistry: PipelineRegistry) {}

    async saveProperty(data: any, version: number, pipelineName: string): Promise<void> {
        let validatedData: any;

        switch (version) {
            case 1:
                validatedData = await schemaV1.validate(data);
                break;
            case 2:
                validatedData = await schemaV2.validate(data);
                break;
            default:
                throw new Error(`Unsupported version: ${version}`);
        }

        const pipeline = this.pipelineRegistry.getPipeline(pipelineName);
        if (!pipeline) {
            throw new Error(`Unknown pipeline: ${pipelineName}`);
        }

        const propertyData: PropertyData = {
            version,
            pipelineName,
            data: validatedData,
        };

        const processedData = await pipeline.process(JSON.stringify(propertyData));
        // Save processedData to storage
        console.log(`Saving processed data: ${processedData}`);
    }

    async getProperty(processedData: string): Promise<any> {
        // In a real scenario, you'd retrieve processedData from storage
        const pipeline = this.pipelineRegistry.getPipeline(JSON.parse(processedData).pipelineName);
        if (!pipeline) {
            throw new Error(`Unknown pipeline: ${JSON.parse(processedData).pipelineName}`);
        }

        const rawData = await pipeline.reverse(processedData);
        const propertyData: PropertyData = JSON.parse(rawData);

        let result = propertyData.data;

        switch (propertyData.version) {
            case 1:
                result = v1ToV2(result);
            // fall through
            case 2:
                return await schemaV2.validate(result);
            default:
                throw new Error(`Unsupported version: ${propertyData.version}`);
        }
    }
}

// Example usage
const pipelineRegistry = new PipelineRegistry();

const simplePipeline = new NamedProcessingPipeline('simple', [new CompressionStrategy(), new EncryptionStrategy('secretKey')]);

const complexPipeline = new NamedProcessingPipeline('complex', [
    new CompressionStrategy(),
    new EncryptionStrategy('secretKey'),
    new ChunkStrategy(30000),
]);

pipelineRegistry.registerPipeline(simplePipeline);
pipelineRegistry.registerPipeline(complexPipeline);

const propertyService = new PropertyService(pipelineRegistry);

async function example() {
    const dataV1 = { createdAt: new Date().toISOString() };
    await propertyService.saveProperty(dataV1, 1, 'simple');

    const dataV2 = {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    await propertyService.saveProperty(dataV2, 2, 'complex');

    // Simulating retrieval (in reality, you'd fetch from storage)
    const retrievedData = await propertyService.getProperty(
        JSON.stringify({
            version: 1,
            pipelineName: 'simple',
            data: { createdAt: '2023-01-01T00:00:00Z' },
        })
    );
    console.log(retrievedData);
}

example().catch(console.error);
