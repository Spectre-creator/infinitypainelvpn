
const config = require('../src/config/env');

describe('Sanity Check', () => {
    test('Environment should load correctly', () => {
        expect(config.app).toBeDefined();
        // Em teste, geralmente o env é test ou mock
        expect(config.app.isMock).toBeDefined();
    });

    test('Math should work', () => {
        expect(1 + 1).toBe(2);
    });
});
