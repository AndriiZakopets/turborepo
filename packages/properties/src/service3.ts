// Base Property Entity
abstract class RawPropertyEntity {
    protected jiraApi: any;

    constructor(jiraApi: any) {
        this.jiraApi = jiraApi;
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
