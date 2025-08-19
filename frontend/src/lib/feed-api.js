export class FeedAPI {
  constructor(baseUrl = import.meta.env.WORKER_URL) {
    this.baseUrl = baseUrl;
  }

  async search(query, options = {}) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/api/search?${params}`);
    if (!response.ok) throw new Error(`Search failed: ${response.status}`);
    return response.json();
  }

  async getArticles(options = {}) {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/api/articles?${params}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  async getSources() {
    const response = await fetch(`${this.baseUrl}/api/sources`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  async getSuggestions(query) {
    const response = await fetch(`${this.baseUrl}/api/suggestions?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  async getTrending() {
    const response = await fetch(`${this.baseUrl}/api/trending`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }
}