require('dotenv').config();
const Cucumber = require('../src/index.js');

describe('Scenarios methods', () => {
  let cucumber;

  beforeAll(() => {
    cucumber = new Cucumber({
      token: process.env.CUCUMBER_STUDIO_TOKEN,
      clientId: process.env.CUCUMBER_STUDIO_CLIENT_ID,
      uid: process.env.CUCUMBER_STUDIO_UID,
      projectId: process.env.CUCUMBER_STUDIO_PROJECT_ID
    });
  });

  describe('getScenarios', () => {
    it('should return an Array of scenarios', () => {
      return cucumber.getScenarios({
        include: ['folder', 'tags', 'actionwords']
      })
        .then(res => {
          expect(res instanceof Array).toBe(true);
          expect(res.length).toBeGreaterThan(0);
          expect(res[0].type).toBe('scenarios');
        });
    });
  });

});