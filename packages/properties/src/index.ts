import { Properties } from './service';
import { faker } from '@faker-js/faker';

function generateData() {
    return {
        email: faker.internet.email(),
        date: faker.date.past(),
        text: faker.lorem.text(),
        avatar: faker.image.avatar(),
        color: faker.internet.color(),
        domain: faker.internet.domainName(),
        ip: faker.internet.ip(),
        mac: faker.internet.mac(),
        password: faker.internet.password(),
    };
}
const json = JSON.stringify(Array.from({ length: 100 }, generateData), null, 2);

const propertiesService = new Properties();
const data = propertiesService.process(json);
console.log(data)