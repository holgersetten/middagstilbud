import axios from 'axios';
import type { OffersResponse } from '../types/offer';

const API_BASE_URL = 'http://localhost:5000/api';

export const offersApi = {
  getAllOffers: async (): Promise<OffersResponse> => {
    const response = await axios.get<OffersResponse>(`${API_BASE_URL}/offers`);
    return response.data;
  },

  getOffersByStore: async (storeName: string): Promise<OffersResponse> => {
    const response = await axios.get<OffersResponse>(`${API_BASE_URL}/offers`, {
      params: { store: storeName }
    });
    return response.data;
  },

  updateOffers: async (): Promise<{ message: string; timestamp: string }> => {
    const response = await axios.post(`${API_BASE_URL}/offers/update`);
    return response.data;
  }
};
