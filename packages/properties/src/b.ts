import { SubmitEntityProperty } from "./service3";

const jiraApi = {
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

const propertiesService = new SubmitEntityProperty(jiraApi);
propertiesService.setValu('new value');
