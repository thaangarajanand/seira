import { API_BASE_URL } from '../api';

const client = async (endpoint, { body, ...customConfig } = {}) => {
  const headers = { 'Content-Type': 'application/json' };

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
    credentials: 'include', // Crucial for cookies
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  let data;
  try {
    const response = await window.fetch(`${API_BASE_URL}${endpoint}`, config);
    data = await response.json();
    if (response.ok) {
      return data;
    }
    throw new Error(data.error || response.statusText);
  } catch (err) {
    return Promise.reject(err.message || err);
  }
};

client.get = (endpoint, config) => client(endpoint, { ...config, method: 'GET' });
client.post = (endpoint, body, config) => client(endpoint, { ...config, body });
client.put = (endpoint, body, config) => client(endpoint, { ...config, method: 'PUT', body });
client.patch = (endpoint, body, config) => client(endpoint, { ...config, method: 'PATCH', body });
client.delete = (endpoint, config) => client(endpoint, { ...config, method: 'DELETE' });

export default client;
