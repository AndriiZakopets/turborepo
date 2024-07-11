// Base Property Entity
abstract class RawPropertyEntity {
    protected jiraApi: any;
    protected abstract propertyName: string;

    constructor(jiraApi: any) {
        this.jiraApi = jiraApi;
    }

    protected async getPropertyValue(): Promise<any> {
        return this.jiraApi.issueProperties.getIssueProperty(this.propertyName);
    };

    protected async setPropertyValue(value: any): Promise<any> {
        return this.jiraApi.issueProperties.setIssueProperty(this.propertyName, value);
    };

    protected async deletePropertyValue(): Promise<void> {
        return this.jiraApi.issueProperties.deleteIssueProperty(this.propertyName);
    };


    public async setValue(value: any): Promise<void> {
        await this.setPropertyValue(value);
    };

    public async getValue(): Promise<any> {
        return this.getPropertyValue();
    };

    public async deleteValue(): Promise<void> {
        await this.deletePropertyValue();
    };

    public async getValueFromPropertiesObject(properties: any): Promise<any> {
        return properties[this.propertyName];
    }

    public async getPropertiesObjectFromValue(value: any): Promise<any> {
        return {
            [this.propertyName]: value,
        };
    }
}

class SubmitEntityProperty extends RawPropertyEntity {
    protected propertyName = 'data';
}

export class PopulateService {
    submitEntity: any;
    constructor(private jiraApi: any) {
        this.submitEntity = new SubmitEntityProperty(this.jiraApi);
    }
}
