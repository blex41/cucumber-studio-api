const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

class CucumberStudio {
  constructor ({
    token,
    clientId,
    uid,
    projectId,
    projectToken
  }) {
    this.token = token;
    this.clientId = clientId;
    this.uid = uid;
    this.projectId = projectId || null;
    this.projectToken = projectToken || null;

    this.baseUrl = 'https://studio.cucumber.io/api';
    this.exportUrl = 'https://export.cucumber.io/download';

    this.defaultHeaders = {
      'Accept': 'application/vnd.api+json; version=1',
      'Access-Token': this.token,
      'Client': this.clientId,
      'Uid': this.uid
    };
  }

  request(url, options = {}) {
    url = (options.noBaseUrl ? '' : this.baseUrl) + url;

    if (options.params) {
      const params = new URLSearchParams(options.params);
      url += (url.includes('?') ? '&' : '?') + params.toString();
    }

    return fetch(url, {
      ...options,
      headers: Object.assign({}, this.defaultHeaders, options.headers || {})
    })
      .then(res => res.json())
      .then(res => res.data || res);
  }

  // https://studio-api.cucumber.io/#get-projects
  getProjects() {
    return this.request('/projects');
  }

  // https://studio-api.cucumber.io/#get-a-particular-project
  getProjectById(projectId = this.projectId) {
    return this.request(`/projects/${projectId}`);
  }

  // https://studio-api.cucumber.io/#create-a-project-backup
  createProjectBackup(projectId = this.projectId) {
    return this.request(`/projects/${projectId}/backups`, { method: 'POST' });
  }

  // https://studio-api.cucumber.io/#get-last-backup-state
  getLastProjectBackup(projectId = this.projectId) {
    return this.request(`/projects/${projectId}/backups/last`);
  }

  // https://studio-api.cucumber.io/#action-words
  getActionWords(projectId = this.projectId) {
    return this.request(`/projects/${projectId}/actionwords`);
  }

  // https://studio-api.cucumber.io/#get-a-single-action-word
  getActionWordById(actionWordId, { projectId = this.projectId } = {}) {
    return this.request(`/projects/${projectId}/actionwords/${actionWordId}`);
  }

  // https://studio-api.cucumber.io/#create-an-action-word
  createActionWord(actionWord, { projectId = this.projectId } = {}) {
    return this.request(`/projects/${projectId}/actionwords`, {
      method: 'POST',
      body: JSON.stringify(actionWord),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // https://studio-api.cucumber.io/#get-scenarios-of-a-given-project
  async getScenarios({ projectId = this.projectId, include = [] } = {}) {
    const scenarios = await this.request(`/projects/${projectId}/scenarios`, {
      params: { include }
    });
    
    if (include.includes('tags')) {
      const tagsMap = await this._getScenariosTagsMap(scenarios.map(s => s.id), projectId);
      return scenarios.map(scenario => this._hydrateWithTags(scenario, tagsMap));
    }

    return scenarios;
  }

  _hydrateWithTags(item, tagsMap) {
    return {
      ...item,
      relationships: {
        ...item.relationships,
        tags: {
          ...item.relationships.tags,
          data: item.relationships.tags.data
            .map(tag => Object.assign({}, tag, tagsMap[tag.id]))
        }
      }
    };
  }

  // https://studio-api.cucumber.io/#get-tags-of-a-given-scenario
  getScenarioTags(scenarioId, { projectId = this.projectId } = {}) {
    return this.request(`/projects/${projectId}/scenarios/${scenarioId}/tags`);
  }

  // Cucumber Studio does not include tag labels with lists (only tag IDs),
  // we need to fetch each item one by one.
  _getScenariosTagsMap(scenarioIds, { projectId = this.projectId } = {}) {
    if (scenarioIds.length) {
      return this.getScenarioTags(scenarioIds[0], { projectId })
        .then(tags => {
          return this._getScenariosTagsMap(scenarioIds.slice(1), { projectId })
            .then(res => Object.assign({}, this._arrayToMap(tags), res));
        });
    } else {
      return Promise.resolve({});
    }
  }

  _arrayToMap(arr) {
    return arr.reduce((res, item) => ({ ...res, [item.id]: item }), {});
  }

  // https://studio-api.cucumber.io/#get-test-runs-of-a-project
  async getTestRuns({ projectId = this.projectId, include = [], status = null } = {}) {
    const runs = await this.request(`/projects/${projectId}/test_runs`, {
      params: {
        'filter[status]': status,
        include
      }
    });
    
    if (include.includes('tags')) {
      const tagsMap = await this._getTestRunsTagsMap(runs.map(s => s.id), { projectId });
      return runs.map(run => this._hydrateWithTags(run, tagsMap));
    }

    return runs;
  }

  // https://studio-api.cucumber.io/#create-tag-in-a-test-run
  getTestRunTags(runId, { projectId = this.projectId } = {}) {
    return this.request(`/projects/${projectId}/test_runs/${runId}/tags`);
  }

  // Cucumber Studio does not include tag labels with lists (only tag IDs),
  // we need to fetch each item one by one.
  async _getTestRunsTagsMap(runIds, { projectId = this.projectId } = {}) {
    if (runIds.length) {
      const tags = await this.getTestRunTags(runIds[0], { projectId });
      const res = await this._getTestRunsTagsMap(runIds.slice(1), { projectId });
      return Object.assign({}, this._arrayToMap(tags), res);
    } else {
      return Promise.resolve({});
    }
  }

  // https://studio-api.cucumber.io/#create-a-test-run
  createTestRun({ name = 'Untitled', description = '', scenarioIds = null, projectId = this.projectId }) {
    return this.request(`/projects/${projectId}/test_runs`, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          attributes: {
            name,
            description,
            scenario_ids: scenarioIds
          }
        }
      }),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // https://export.cucumber.io/
  exportTestRun(testRunId) {
    const params = new URLSearchParams({
      token: this.projectToken,
      lang: 'cucumber-javascript',
      test_run: testRunId,
      filter_on: '',
      filter_on_value: '',
      filter_on_status: '',
      'only[]': 'features',
      with_folders: 'on',
      keep_filenames: 'on',
      keep_foldernames: 'on',
      with_dataset_names: 'on'
    });
    
    return fetch(`${this.exportUrl}?${params}`)
      .then(res => res.buffer());
  }
}


module.exports = CucumberStudio;