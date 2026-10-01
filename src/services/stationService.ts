import api from './api';

export type Review = {
  _id?: string;
  user?: string | {
    _id?: string;
    name?: string;
    email?: string;
  };
  name: string;
  rating: number;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
};

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
  reviews: Review[];
  createdBy?: {
    _id?: string;
    name?: string;
    email?: string;
  };
};

const stationService = {
  // =====================================================
  // GET ALL STATIONS
  // =====================================================

  async getAllStations(): Promise<{
    success: boolean;
    stations: Station[];
  }> {
    const response = await api.get('/stations');

    return response.data;
  },

  // =====================================================
  // GET STATION BY ID
  // =====================================================

  async getStationById(id: string) {
    const response = await api.get(
      `/stations/${id}`
    );

    return response.data;
  },

  // =====================================================
  // GET STATION REVIEWS
  // =====================================================

  async getStationReviews(id: string) {
    const response = await api.get(
      `/stations/${id}/reviews`
    );

    return response.data;
  },

  // =====================================================
  // ADD REVIEW
  // =====================================================

  async addReview(
    stationId: string,
    data: {
      rating: number;
      comment: string;
    }
  ) {
    const response = await api.post(
      `/stations/${stationId}/reviews`,
      data
    );

    return response.data;
  },

  // =====================================================
  // UPDATE REVIEW
  // =====================================================

  async updateReview(
    stationId: string,
    reviewId: string,
    data: {
      rating?: number;
      comment?: string;
    }
  ) {
    const response = await api.put(
      `/stations/${stationId}/reviews/${reviewId}`,
      data
    );

    return response.data;
  },

  // =====================================================
  // DELETE REVIEW
  // =====================================================

  async deleteReview(
    stationId: string,
    reviewId: string
  ) {
    const response = await api.delete(
      `/stations/${stationId}/reviews/${reviewId}`
    );

    return response.data;
  },
};

export default stationService;