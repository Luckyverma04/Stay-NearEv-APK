import api from './api';

export type Station = {
  _id: string;
  name: string;
  location: string;
  description: string;
  pricePerUnit: number;
  amenities: string[];
  images: string[];
  chargerTypes: string[];
  averageRating: number;
  reviews: {
    _id?: string;
    name: string;
    rating: number;
    comment: string;
  }[];
  createdBy?: {
    _id?: string;
    name?: string;
    email?: string;
  };
};

export const stationService = {
  async getAllStations(): Promise<{
    success: boolean;
    stations: Station[];
  }> {
    const response = await api.get('/stations');

    return response.data;
  },

  async getStationById(id: string) {
    const response = await api.get(`/stations/${id}`);

    return response.data;
  },
};

export default stationService;