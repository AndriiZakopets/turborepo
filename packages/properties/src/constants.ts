export const PRODUCTION_ADDON_KEY = 'jetforms';
const suffix = process.env.ADDON_KEY === PRODUCTION_ADDON_KEY ? '' : process.env.ADDON_KEY;
export const PROPERTY_PREFIX = `saasjet.forms${suffix}`;
