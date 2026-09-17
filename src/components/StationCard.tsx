import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';

import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import type { Station } from '../services/stationService';

type StationCardProps = {
  station: Station;
};

export default function StationCard({
  station,
}: StationCardProps) {
  const imageUrl =
    station.images && station.images.length > 0
      ? station.images[0]
      : null;

  const rating = station.averageRating || 0;

  const reviewCount =
    station.reviews?.length || 0;

  const handleViewStation = () => {
    router.push({
      pathname: '/station/[id]',
      params: {
        id: station._id,
      },
    });
  };

  return (
    <View style={styles.card}>

      {/* Station Image */}
      <Pressable onPress={handleViewStation}>
        {imageUrl ? (
          <Image
            source={{
              uri: imageUrl,
            }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="flash"
              size={45}
              color="#00E5A8"
            />

            <Text style={styles.placeholderText}>
              EV Station
            </Text>
          </View>
        )}

        {/* Available Badge */}
        <View style={styles.availableBadge}>
          <View style={styles.greenDot} />

          <Text style={styles.availableText}>
            Available
          </Text>
        </View>
      </Pressable>

      {/* Card Body */}
      <View style={styles.body}>

        {/* Station Name */}
        <Text
          style={styles.name}
          numberOfLines={1}
        >
          {station.name}
        </Text>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={
                  star <= Math.round(rating)
                    ? 'star'
                    : 'star-outline'
                }
                size={14}
                color="#FBBF24"
              />
            ))}
          </View>

          <Text style={styles.rating}>
            {rating.toFixed(1)}
          </Text>

          <Text style={styles.reviewCount}>
            ({reviewCount})
          </Text>
        </View>

        {/* Location */}
        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color="#00E5A8"
          />

          <Text
            style={styles.location}
            numberOfLines={1}
          >
            {station.location}
          </Text>
        </View>

        {/* Charger Types */}
        {station.chargerTypes?.length > 0 && (
          <View style={styles.chargerRow}>
            {station.chargerTypes
              .slice(0, 3)
              .map((type, index) => (
                <View
                  key={`${type}-${index}`}
                  style={styles.chargerChip}
                >
                  <Text style={styles.chargerText}>
                    {type}
                  </Text>
                </View>
              ))}
          </View>
        )}

        {/* Price */}
        <View style={styles.bottomRow}>

          <View>
            <Text style={styles.priceLabel}>
              Charging price
            </Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>
                ₹{station.pricePerUnit}
              </Text>

              <Text style={styles.unit}>
                /kWh
              </Text>
            </View>
          </View>

          {/* View Button */}
          <Pressable
            style={styles.viewButton}
            onPress={handleViewStation}
          >
            <Text style={styles.viewButtonText}>
              View & Book
            </Text>

            <Ionicons
              name="arrow-forward"
              size={16}
              color="#020617"
            />
          </Pressable>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 18,
  },

  image: {
    width: '100%',
    height: 190,
  },

  imagePlaceholder: {
    width: '100%',
    height: 190,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  placeholderText: {
    color: '#64748B',
    fontSize: 13,
  },

  availableBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(2,6,23,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },

  availableText: {
    color: '#86EFAC',
    fontSize: 11,
    fontWeight: '700',
  },

  body: {
    padding: 16,
  },

  name: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 8,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },

  stars: {
    flexDirection: 'row',
    gap: 1,
  },

  rating: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },

  reviewCount: {
    color: '#64748B',
    fontSize: 12,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },

  location: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 13,
  },

  chargerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 15,
  },

  chargerChip: {
    backgroundColor: 'rgba(0,229,168,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,168,0.2)',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  chargerText: {
    color: '#00E5A8',
    fontSize: 11,
    fontWeight: '600',
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 14,
  },

  priceLabel: {
    color: '#64748B',
    fontSize: 10,
    marginBottom: 2,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  price: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },

  unit: {
    color: '#64748B',
    fontSize: 11,
    marginLeft: 3,
  },

  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#00E5A8',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 11,
  },

  viewButtonText: {
    color: '#020617',
    fontSize: 12,
    fontWeight: '800',
  },
});