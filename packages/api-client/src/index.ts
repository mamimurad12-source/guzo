export const apiClient = {
  baseUrl: process.env.API_URL ?? 'http://localhost:4000/api/v1',
  async get<T>(url: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`);
    return response.json() as Promise<T>;
  }
};
