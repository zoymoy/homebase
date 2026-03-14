import * as Location from 'expo-location';
import { HomeAddress } from '@/types';

const GOOGLE_DIRECTIONS_API = 'https://maps.googleapis.com/maps/api/directions/json';

export const locationService = {
  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  },

  async getEtaMinutes(
    origin: { lat: number; lng: number },
    destination: HomeAddress,
    apiKey: string
  ): Promise<number> {
    const url = `${GOOGLE_DIRECTIONS_API}?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&departure_time=now&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.routes?.length) {
      throw new Error('Could not calculate route');
    }

    const durationSeconds = data.routes[0].legs[0].duration_in_traffic?.value
      ?? data.routes[0].legs[0].duration.value;

    return Math.ceil(durationSeconds / 60);
  },
};
