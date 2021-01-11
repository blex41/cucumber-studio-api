require('dotenv').config();
const Cucumber = require('../src/index.js');

describe('Action words methods', () => {
  let cucumber;

  beforeAll(() => {
    cucumber = new Cucumber({
      token: process.env.CUCUMBER_STUDIO_TOKEN,
      clientId: process.env.CUCUMBER_STUDIO_CLIENT_ID,
      uid: process.env.CUCUMBER_STUDIO_UID,
      projectId: process.env.CUCUMBER_STUDIO_PROJECT_ID
    });
  });

  describe('getActionWords', () => {
    it('should return an Array of actionwords', () => {
      return cucumber.getActionWords()
        .then(res => {
          expect(res instanceof Array).toBe(true);
          expect(res.length).toBeGreaterThan(0);
          expect(res[0].type).toBe('actionwords');
        });
    });
  });

});