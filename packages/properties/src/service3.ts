type PropertiesObject = {
    [key: string]: any;
};

// Base Property Entity
abstract class RawPropertyEntity<T extends any> {
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


    public async setValue(value: T): Promise<void> {
        await this.setPropertyValue(value);
    };

    public async getValue(): Promise<T> {
        return this.getPropertyValue();
    };

    public async deleteValue(): Promise<void> {
        await this.deletePropertyValue();
    };

    public async getValueFromPropertiesObject(properties: PropertiesObject): Promise<any> {
        return properties[this.propertyName];
    }

    public async getPropertiesObjectFromValue(value: T): Promise<PropertiesObject> {
        return {
            [this.propertyName]: value,
        };
    }
}

type SubmitEntityPropertyValue = {
    idFormsSubmit: string[];
    nameFormsSubmit: string[];
};
class SubmitEntityProperty extends RawPropertyEntity<SubmitEntityPropertyValue> {
    protected propertyName = 'data';
}

type IsAutoAddTriggeredPropertyValue = boolean;
class IsAutoAddTriggeredProperty extends RawPropertyEntity<IsAutoAddTriggeredPropertyValue> {
    protected propertyName = 'isAutoAddTriggered';
}

export const jiraApi = {
    issueProperties: {
        getIssueProperty: async (propertyName: string) => {
            console.log(`Getting property: ${propertyName}`);
        },
        setIssueProperty: async (propertyName: string, value: any) => {
            console.log(`Setting property: ${propertyName}`);
            console.log(value);
        },
        deleteIssueProperty: async (propertyName: string) => {
            console.log(`Deleting property: ${propertyName}`);
        },
    },
}

export class PropertisesService {
    submitEntity: SubmitEntityProperty;
    isAutoAddTriggered: IsAutoAddTriggeredProperty;

    constructor(private jiraApi: any) {
        this.submitEntity = new SubmitEntityProperty(this.jiraApi);
        this.isAutoAddTriggered = new IsAutoAddTriggeredProperty(this.jiraApi);
    }
}

async function main() {
    const propertiesService = new PropertisesService(jiraApi);
    const data = await propertiesService.submitEntity.getValue();
    console.log(data);
}

main();
