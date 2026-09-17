import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import stationService, {
  Station,
} from '../../services/stationService';

export default function StationDetailsScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchStation();
    }
  }, [id]);

  const fetchStation = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await stationService.getStationById(id);

      console.log('📍 Station details:', result);

      if (result.success) {
        setStation(result.station || result.data);
      } else {
        setError(result.message || 'Station not found.');
      }
    } catch (err: any) {
      console.error('❌ Station details error:', err);

      setError(
        err?.response?.data?.message ||
          'Unable to load station details.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color="#00E5A8"
        />

        <Text style={styles.loadingText}>
          Loading station...
        </Text>
      </View>
    );
  }

  // Error
  if (error || !station) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorIcon}>
          <Ionicons
            name="flash-outline"
            size={40}
            color="#00E5A8"
          />
        </View>

        <Text style={styles.errorTitle}>
          Station Not Found
        </Text>

        <Text style={styles.errorText}>
          {error || 'Unable to load this charging station.'}
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            ← Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const imageUrl =
    station.images && station.images.length > 0
      ? station.images[0]
      : null;

  const rating = station.averageRating || 0;

  const reviewCount = station.reviews?.length || 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Image */}

      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{
              uri: imageUrl,
            }}
            style={styles.stationImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="flash"
              size={55}
              color="#00E5A8"
            />

            <Text style={styles.placeholderText}>
              EV Charging Station
            </Text>
          </View>
        )}

        {/* Back Button */}

        <Pressable
          style={styles.imageBackButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="white"
          />
        </Pressable>

        {/* Available Badge */}

        <View style={styles.availableBadge}>
          <View style={styles.greenDot} />

          <Text style={styles.availableText}>
            Available
          </Text>
        </View>
      </View>

      {/* Station Header */}

      <View style={styles.header}>
        <Text style={styles.title}>
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
                size={17}
                color="#FBBF24"
              />
            ))}
          </View>

          <Text style={styles.rating}>
            {rating.toFixed(1)}
          </Text>

          <Text style={styles.reviewCount}>
            ({reviewCount} reviews)
          </Text>
        </View>

        {/* Location */}

        <View style={styles.locationRow}>
          <Ionicons
            name="location"
            size={18}
            color="#00E5A8"
          />

          <Text style={styles.location}>
            {station.location}
          </Text>
        </View>
      </View>

      {/* Price Card */}

      <View style={styles.priceCard}>
        <View>
          <Text style={styles.priceLabel}>
            Charging Price
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>
              ₹{station.pricePerUnit}
            </Text>

            <Text style={styles.priceUnit}>
              /kWh
            </Text>
          </View>
        </View>

        <View style={styles.priceIcon}>
          <Ionicons
            name="flash"
            size={25}
            color="#00E5A8"
          />
        </View>
      </View>

      {/* Charger Types */}

      {station.chargerTypes &&
        station.chargerTypes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Charger Types
            </Text>

            <View style={styles.chargerGrid}>
              {station.chargerTypes.map(
                (type, index) => (
                  <View
                    key={`${type}-${index}`}
                    style={styles.chargerCard}
                  >
                    <Ionicons
                      name="flash-outline"
                      size={20}
                      color="#00E5A8"
                    />

                    <Text style={styles.chargerName}>
                      {type}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>
        )}

      {/* Amenities */}

      {station.amenities &&
        station.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Amenities
            </Text>

            <View style={styles.amenities}>
              {station.amenities.map(
                (amenity, index) => (
                  <View
                    key={`${amenity}-${index}`}
                    style={styles.amenityChip}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color="#22C55E"
                    />

                    <Text style={styles.amenityText}>
                      {amenity}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>
        )}

      {/* Description */}

      {station.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            About this Station
          </Text>

          <Text style={styles.description}>
            {station.description}
          </Text>
        </View>
      )}

      {/* Reviews */}

      {station.reviews &&
        station.reviews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.reviewHeader}>
              <Text style={styles.sectionTitle}>
                Customer Reviews
              </Text>

              <Text style={styles.reviewScore}>
                ⭐ {rating.toFixed(1)}
              </Text>
            </View>

            {station.reviews
              .slice(0, 3)
              .map((review, index) => (
                <View
                  key={
                    review._id ||
                    `review-${index}`
                  }
                  style={styles.reviewCard}
                >
                  <View style={styles.reviewTopRow}>
                    <Text style={styles.reviewer}>
                      {review.name || 'Customer'}
                    </Text>

                    {/* Important:
                        Text must be inside Text,
                        not View */}
                    <Text style={styles.reviewStars}>
                      ⭐ {review.rating}
                    </Text>
                  </View>

                  <Text style={styles.reviewComment}>
                    {review.comment}
                  </Text>
                </View>
              ))}
          </View>
        )}

      {/* Get Directions */}

      <Pressable
        style={styles.directionButton}
        onPress={() => {
          console.log(
            'Get Directions:',
            station.location
          );
        }}
      >
        <Ionicons
          name="navigate"
          size={20}
          color="#00E5A8"
        />

        <Text style={styles.directionText}>
          Get Directions
        </Text>
      </Pressable>

      {/* Book Charging Slot */}

      <Pressable
        style={styles.bookButton}
        onPress={() => {
          router.push({
            pathname: '/bookings/station',
            params: {
              stationId: station._id,
              stationName: station.name,
            },
          });
        }}
      >
        <Ionicons
          name="flash"
          size={20}
          color="#020617"
        />

        <Text style={styles.bookText}>
          Book Charging Slot
        </Text>
      </Pressable>

      {/* Bottom spacing */}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#020617',
  },

  container: {
    paddingBottom: 30,
  },

  centerContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },

  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },

  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,229,168,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  errorTitle: {
    color: '#F8FAFC',
    fontSize: 23,
    fontWeight: '800',
  },

  errorText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  backButton: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 25,
  },

  backButtonText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },

  imageContainer: {
    width: '100%',
    height: 270,
    position: 'relative',
  },

  stationImage: {
    width: '100%',
    height: '100%',
  },

  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  placeholderText: {
    color: '#64748B',
    fontSize: 13,
  },

  imageBackButton: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: 'rgba(2,6,23,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  availableBadge: {
    position: 'absolute',
    bottom: 15,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(2,6,23,0.88)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },

  availableText: {
    color: '#86EFAC',
    fontSize: 12,
    fontWeight: '700',
  },

  header: {
    padding: 20,
  },

  title: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  stars: {
    flexDirection: 'row',
    gap: 1,
  },

  rating: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },

  reviewCount: {
    color: '#64748B',
    fontSize: 12,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 13,
  },

  location: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },

  priceCard: {
    marginHorizontal: 20,
    padding: 17,
    borderRadius: 17,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(0,229,168,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  priceLabel: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 3,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  price: {
    color: '#F8FAFC',
    fontSize: 25,
    fontWeight: '900',
  },

  priceUnit: {
    color: '#64748B',
    fontSize: 12,
    marginLeft: 4,
  },

  priceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,229,168,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  section: {
    paddingHorizontal: 20,
    marginTop: 25,
  },

  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 12,
  },

  chargerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  chargerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 11,
  },

  chargerName: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },

  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34,197,94,0.07)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
  },

  amenityText: {
    color: '#CBD5E1',
    fontSize: 12,
  },

  description: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
  },

  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  reviewScore: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '700',
  },

  reviewCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  reviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },

  reviewer: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },

  reviewStars: {
    color: '#FBBF24',
    fontSize: 12,
  },

  reviewComment: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
  },

  directionButton: {
    marginHorizontal: 20,
    marginTop: 28,
    height: 52,
    borderRadius: 13,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#00E5A8',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  directionText: {
    color: '#00E5A8',
    fontSize: 15,
    fontWeight: '800',
  },

  bookButton: {
    marginHorizontal: 20,
    marginTop: 10,
    height: 55,
    borderRadius: 13,
    backgroundColor: '#00E5A8',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  bookText: {
    color: '#020617',
    fontSize: 16,
    fontWeight: '900',
  },
});