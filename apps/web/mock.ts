import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
global.window = dom.window as any;
global.document = dom.window.document;
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {}, length: 0, key: () => null, clear: () => {} } as Storage;
(global as any).import = { meta: { env: { BASE_URL: '/InkBattle/' } } };
