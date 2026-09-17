import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { useCallback, useEffect, useState } from 'react';

import { router, useFocusEffect } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import bookingService, {
  Booking,
} from '../../services/bookingService';

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(
    null
  );

  const fetchBookings = async () => {
    try {
      const result = await bookingService.getMyBookings();

      if (result?.success) {
        const bookingList =
          result?.data?.bookings ||
          result?.bookings ||
          [];

        setBookings(bookingList);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchBookings();

    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusStyle = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return {
          backgroundColor: 'rgba(0,229,168,0.12)',
          color: '#00E5A8',
          icon: 'checkmark-circle' as const,
        };

      case 'active':
        return {
          backgroundColor: 'rgba(59,130,246,0.12)',
          color: '#60A5FA',
          icon: 'flash' as const,
        };

      case 'completed':
        return {
          backgroundColor: 'rgba(34,197,94,0.12)',
          color: '#4ADE80',
          icon: 'checkmark-done-circle' as const,
        };

      case 'cancelled':
        return {
          backgroundColor: 'rgba(239,68,68,0.12)',
          color: '#F87171',
          icon: 'close-circle' as const,
        };

      case 'no-show':
        return {
          backgroundColor: 'rgba(245,158,11,0.12)',
          color: '#FBBF24',
          icon: 'alert-circle' as const,
        };

      default:
        return {
          backgroundColor: 'rgba(148,163,184,0.12)',
          color: '#94A3B8',
          icon: 'time-outline' as const,
        };
    }
  };

  const handleCancel = (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancellingId(booking._id);

              const result =
                await bookingService.cancelBooking(
                  booking._id,
                  'Cancelled by user'
                );

              if (result?.success) {
                Alert.alert(
                  'Booking Cancelled',
                  'Your booking has been cancelled successfully.'
                );

                await fetchBookings();
              } else {
                Alert.alert(
                  'Unable to Cancel',
                  result?.message ||
                    'Something went wrong.'
                );
              }
            } catch (error: any) {
              console.error(
                '❌ Cancel booking error:',
                error
              );

              Alert.alert(
                'Error',
                error?.response?.data?.message ||
                  'Unable to cancel booking.'
              );
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const renderBooking = ({
    item,
  }: {
    item: Booking;
  }) => {
    const status = getStatusStyle(item.status);

    const canCancel =
      item.status === 'pending' ||
      item.status === 'confirmed';

    return (
      <View style={styles.bookingCard}>
        {/* Station Header */}

        <View style={styles.cardHeader}>
          <View style={styles.stationIcon}>
            <Ionicons
              name="flash"
              size={23}
              color="#00E5A8"
            />
          </View>

          <View style={styles.stationInfo}>
            <Text
              style={styles.stationName}
              numberOfLines={1}
            >
              {item.station?.name ||
                'Charging Station'}
            </Text>

            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={13}
                color="#64748B"
              />

              <Text
                style={styles.locationText}
                numberOfLines={1}
              >
                {item.station?.location ||
                  'Location unavailable'}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  status.backgroundColor,
              },
            ]}
          >
            <Ionicons
              name={status.icon}
              size={13}
              color={status.color}
            />

            <Text
              style={[
                styles.statusText,
                { color: status.color },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {/* Divider */}

        <View style={styles.divider} />

        {/* Booking Information */}

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="calendar-outline"
                size={17}
                color="#00E5A8"
              />
            </View>

            <View>
              <Text style={styles.infoLabel}>
                DATE
              </Text>

              <Text style={styles.infoValue}>
                {formatDate(item.startTime)}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="time-outline"
                size={17}
                color="#00E5A8"
              />
            </View>

            <View>
              <Text style={styles.infoLabel}>
                TIME
              </Text>

              <Text style={styles.infoValue}>
                {formatTime(item.startTime)}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="hourglass-outline"
                size={17}
                color="#00E5A8"
              />
            </View>

            <View>
              <Text style={styles.infoLabel}>
                DURATION
              </Text>

              <Text style={styles.infoValue}>
                {item.duration} min
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="wallet-outline"
                size={17}
                color="#00E5A8"
              />
            </View>

            <View>
              <Text style={styles.infoLabel}>
                TOTAL
              </Text>

              <Text style={styles.priceValue}>
                ₹{Number(item.totalCost || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle */}

        {item.vehicleInfo && (
          <View style={styles.vehicleBox}>
            <Ionicons
              name="car-outline"
              size={18}
              color="#94A3B8"
            />

            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleLabel}>
                VEHICLE
              </Text>

              <Text style={styles.vehicleText}>
                {item.vehicleInfo.model ||
                  item.vehicleInfo.vehicleType}
              </Text>

              {item.vehicleInfo.licensePlate ? (
                <Text style={styles.plateText}>
                  {item.vehicleInfo.licensePlate}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {/* Actions */}

        {canCancel && (
          <Pressable
            style={styles.cancelButton}
            disabled={
              cancellingId === item._id
            }
            onPress={() =>
              handleCancel(item)
            }
          >
            {cancellingId === item._id ? (
              <ActivityIndicator
                size="small"
                color="#F87171"
              />
            ) : (
              <>
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color="#F87171"
                />

                <Text style={styles.cancelText}>
                  Cancel Booking
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Header */}

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#F8FAFC"
          />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            My Bookings
          </Text>

          <Text style={styles.headerSubtitle}>
            {bookings.length}{' '}
            {bookings.length === 1
              ? 'booking'
              : 'bookings'}
          </Text>
        </View>

        <Pressable
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Ionicons
            name="refresh"
            size={20}
            color="#00E5A8"
          />
        </Pressable>
      </View>

      {/* Content */}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color="#00E5A8"
          />

          <Text style={styles.loadingText}>
            Loading your bookings...
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBooking}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            bookings.length === 0 &&
              styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#00E5A8"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={42}
                  color="#00E5A8"
                />
              </View>

              <Text style={styles.emptyTitle}>
                No Bookings Yet
              </Text>

              <Text style={styles.emptyText}>
                You haven't booked a charging
                slot yet. Find a station and
                reserve your first charging
                session.
              </Text>

              <Pressable
                style={styles.bookNowButton}
                onPress={() =>
                  router.push('/bookings/station')
                }
              >
                <Ionicons
                  name="flash"
                  size={18}
                  color="#020617"
                />

                <Text style={styles.bookNowText}>
                  Book a Charge
                </Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#020617',
  },

  header: {
    height: 82,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(255,255,255,0.06)',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitleContainer: {
    flex: 1,
    marginLeft: 13,
  },

  headerTitle: {
    color: '#F8FAFC',
    fontSize: 21,
    fontWeight: '900',
  },

  headerSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContent: {
    padding: 16,
    paddingBottom: 35,
  },

  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  bookingCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stationIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor:
      'rgba(0,229,168,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(0,229,168,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  stationInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  stationName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 3,
  },

  locationText: {
    flex: 1,
    color: '#64748B',
    fontSize: 11,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'capitalize',
  },

  divider: {
    height: 1,
    backgroundColor:
      'rgba(255,255,255,0.06)',
    marginVertical: 15,
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
  },

  infoItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor:
      'rgba(0,229,168,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  infoLabel: {
    color: '#475569',
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 2,
  },

  infoValue: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },

  priceValue: {
    color: '#00E5A8',
    fontSize: 13,
    fontWeight: '900',
  },

  vehicleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1220',
    borderRadius: 12,
    padding: 11,
    marginTop: 16,
  },

  vehicleInfo: {
    marginLeft: 9,
  },

  vehicleLabel: {
    color: '#475569',
    fontSize: 8,
    fontWeight: '800',
  },

  vehicleText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  plateText: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 1,
  },

  cancelButton: {
    height: 43,
    borderRadius: 11,
    borderWidth: 1,
    borderColor:
      'rgba(248,113,113,0.2)',
    backgroundColor:
      'rgba(239,68,68,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 14,
  },

  cancelText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '800',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },

  loadingText: {
    color: '#64748B',
    fontSize: 13,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor:
      'rgba(0,229,168,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(0,229,168,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
  },

  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },

  bookNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00E5A8',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 13,
    marginTop: 22,
  },

  bookNowText: {
    color: '#020617',
    fontSize: 13,
    fontWeight: '900',
  },
});