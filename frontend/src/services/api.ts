import axios from 'axios';
import { auth } from '../config/firebaseConfig';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding the auth token
apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    login: () => apiClient.post('/auth/login'),
    register: (data: { email: string; full_name: string; uid: string }) => 
      apiClient.post('/auth/register', data),
    getProfile: () => apiClient.get('/profile'),
  },
  trips: {
    generate: (data: any) => apiClient.post('/trips/generate', data),
    list: () => apiClient.get('/trips'),
    get: (id: string | number) => apiClient.get(`/trips/${id}`),
  },
  destinations: {
    recommend: (data: any) => apiClient.post('/destinations', data),
    getDetail: (name: string) => apiClient.get(`/destination/${name}`),
  },
  chat: {
    send: (message: string) => apiClient.post('/chat', { message }),
  },
  hotels: {
    search: (data: any) => apiClient.post('/hotels', data),
  },
  weather: {
    get: (city: string) => apiClient.get(`/weather?city=${city}`),
  },
  notifications: {
    list: () => apiClient.get('/notifications'),
  },
  bookmarks: {
    toggle: (data: any) => apiClient.post('/bookmarks', data),
  },
  places: {
    getRestaurants: (city: string, limit = 6) => apiClient.get(`/places/restaurants?city=${encodeURIComponent(city)}&limit=${limit}`),
    getAttractions: (city: string, limit = 6) => apiClient.get(`/places/attractions?city=${encodeURIComponent(city)}&limit=${limit}`),
    getHotels: (city: string, budgetTier = 'Mid-range', limit = 6) => apiClient.get(`/places/hotels?city=${encodeURIComponent(city)}&budget_tier=${encodeURIComponent(budgetTier)}&limit=${limit}`),
    getExperiences: (city: string, limit = 6) => apiClient.get(`/places/experiences?city=${encodeURIComponent(city)}&limit=${limit}`),
  }
};

export default apiClient;
