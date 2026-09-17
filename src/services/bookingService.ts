import api from './api';

export type BookingSlot = {
  startTime: string;
  endTime: string;
  duration: number;
  estimatedEnergy: number;
  estimatedCost: number;
};

export type VehicleInfo = {
  vehicleType:
    | 'car'
    | 'bike'
    | 'scooter'
    | 'Electric Car'
    | 'Electric Bike'
    | 'Electric Scooter'
    | 'Electric Auto';
  model: string;
  licensePlate: string;
  batteryCapacity?: number;
};

export type Booking = {
  _id: string;
  user: string;
  station: {
    _id: string;
    name: string;
    location: string;
    pricePerUnit: number;
    images?: string[];
    amenities?: string[];
  };
  startTime: string;
  endTime: string;
  duration: number;
  totalCost: number;
  status:
    | 'pending'
    | 'confirmed'
    | 'active'
    | 'completed'
    | 'cancelled'
    | 'no-show';
  vehicleInfo: VehicleInfo;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt?: string;
};

const bookingService = {
  async getAvailableSlots(
    stationId: string,
    date: string,
    duration: number
  ) {
    const response = await api.get(
      '/bookings/available-slots',
      {
        params: {
          stationId,
          date,
          duration,
        },
      }
    );

    return response.data;
  },

  async createBooking(data: {
    stationId: string;
    startTime: string;
    duration: number;
    vehicleInfo: VehicleInfo;
  }) {
    const response = await api.post(
      '/bookings/create',
      data
    );

    return response.data;
  },

  async getMyBookings() {
    const response = await api.get(
      '/bookings/my-bookings'
    );

    return response.data;
  },

  async getBookingById(id: string) {
    const response = await api.get(
      `/bookings/${id}`
    );

    return response.data;
  },

  async cancelBooking(
    id: string,
    cancellationReason?: string
  ) {
    const response = await api.put(
      `/bookings/${id}/cancel`,
      {
        cancellationReason,
      }
    );

    return response.data;
  },
};

export default bookingService;