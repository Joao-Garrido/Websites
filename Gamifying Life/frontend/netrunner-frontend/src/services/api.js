const API_BASE_URL = '/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Netrunner endpoints
  async createNetrunner(alias) {
    return this.request('/netrunner', {
      method: 'POST',
      body: { alias }
    });
  }

  async getNetrunner(id) {
    return this.request(`/netrunner/${id}`);
  }

  async getDashboardData(id) {
    return this.request(`/netrunner/${id}/dashboard`);
  }

  async getContracts(id) {
    return this.request(`/netrunner/${id}/contracts`);
  }

  async createContract(netrunner_id, contractData) {
    return this.request(`/netrunner/${netrunner_id}/contracts`, {
      method: 'POST',
      body: contractData
    });
  }

  async startContract(contractId) {
    return this.request(`/contracts/${contractId}/start`, {
      method: 'POST'
    });
  }

  async completeContract(contractId, data = {}) {
    return this.request(`/contracts/${contractId}/complete`, {
      method: 'POST',
      body: data
    });
  }

  async spendBandwidth(netrunner_id, amount, activity) {
    return this.request(`/netrunner/${netrunner_id}/bandwidth/spend`, {
      method: 'POST',
      body: { amount, activity }
    });
  }

  async resetDailyBandwidth(netrunner_id) {
    return this.request(`/netrunner/${netrunner_id}/bandwidth/reset`, {
      method: 'POST'
    });
  }

  async getEpicHacks(netrunner_id) {
    return this.request(`/netrunner/${netrunner_id}/epic-hacks`);
  }

  async createEpicHack(netrunner_id, epicHackData) {
    return this.request(`/netrunner/${netrunner_id}/epic-hacks`, {
      method: 'POST',
      body: epicHackData
    });
  }

  async getDataStream(netrunner_id, limit = 20) {
    return this.request(`/netrunner/${netrunner_id}/data-stream?limit=${limit}`);
  }

  async getSkills(netrunner_id) {
    return this.request(`/netrunner/${netrunner_id}/skills`);
  }

  async setupDemoData(netrunner_id) {
    return this.request(`/demo/setup/${netrunner_id}`, {
      method: 'POST'
    });
  }
}

export default new ApiService();

