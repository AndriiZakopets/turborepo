import { PropertisesService, jiraApi } from "./service3";

const propertiesService = new PropertisesService(jiraApi);
const data = propertiesService.submitEntity.getValueFromPropertiesObject({
    'data': 'value'
});

data.then(console.log);
