require('dotenv').config();
const Cucumber = require('../src/index.js');

describe('Project methods', () => {
  let cucumber;

  beforeAll(() => {
    cucumber = new Cucumber({
      token: process.env.CUCUMBER_STUDIO_TOKEN,
      clientId: process.env.CUCUMBER_STUDIO_CLIENT_ID,
      uid: process.env.CUCUMBER_STUDIO_UID,
      projectId: process.env.CUCUMBER_STUDIO_PROJECT_ID
    });
  });

  describe('getProjects', () => {
    it('should return an Array of projects', () => {
      return cucumber.getProjects()
        .then(res => {
          expect(res instanceof Array).toBe(true);
          expect(res.length).toBeGreaterThan(0);
          expect(res[0].type).toBe('projects');
        });
    });
  });

  describe('getProjectById', () => {
    it('should return a project', () => {
      return cucumber.getProjectById()
        .then(res => {
          expect(res.type).toBe('projects');
        });
    });
  });

  describe.skip('createProjectBackup', () => {
    it('should return a project with backup state', () => {
      return cucumber.createProjectBackup()
        .then(res => {
          expect(res.type).toBe('projects');
          expect(res.attributes['new-backup-in-progress']).toBeTruthy();
        });
    });
  });
  
  describe.only('getLastProjectBackup', () => {
    it('should return a backup', () => {
      return cucumber.getLastProjectBackup()
        .then(res => {
          console.log(JSON.stringify(res, 0, 2));
          expect(res.type).toBe('backups');
        });
    });
  });

});