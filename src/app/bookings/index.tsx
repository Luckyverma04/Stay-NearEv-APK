import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useCallback, useState, useMemo, memo } from 'react';

import { router, useFocusEffect } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import bookingService, {
  Booking,
} from '../../services/bookingService';

const { width } = Dimensions.get('window');

// =====================================================
// MEMOIZED COMPONENTS
// =====================================================

const BookingCard = memo(
  ({
    item,
    cancellingId,
    onCancel,
  }: {
    item: Booking;
    cancellingId: string | null;
    onCancel: (booking: Booking) => void;
  }) => {
    const status = useMemo(
      () => getStatusStyle(item.status),
      [item.status]
    );

    const canCancel = useMemo(
      () =>
        item.status === 'pending' ||
        item.status === 'confirmed',
      [item.status]
    );

    if (!item) return null;

    return (
      <View style={styles.bookingCard}>

        {/* ========================================= */}
        {/* CLICKABLE BOOKING CONTENT */}
        {/* ========================================= */}

        <Pressable
          onPress={() => {
            if (!item._id) return;

            router.push({
              pathname: '/bookings/[id]',
              params: {
                id: item._id,
              },
            });
          }}
          style={({ pressed }) => [
            styles.bookingContent,
            pressed && styles.bookingContentPressed,
          ]}
        >

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

            {/* Status */}
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
                  {
                    color: status.color,
                  },
                ]}
                numberOfLines={1}
              >
                {item.status || 'pending'}
              </Text>
            </View>

          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Booking Information */}
          <View style={styles.infoGrid}>

            {/* Date */}
            <InfoItem
              icon="calendar-outline"
              label="DATE"
              value={formatDate(item.startTime)}
            />

            {/* Start Time */}
            <InfoItem
              icon="time-outline"
              label="START"
              value={formatTime(item.startTime)}
            />

            {/* End Time */}
            <InfoItem
              icon="stopwatch-outline"
              label="END"
              value={formatTime(item.endTime)}
            />

            {/* Duration */}
            <InfoItem
              icon="hourglass-outline"
              label="DUR."
              value={`${item.duration || 0}m`}
            />

            {/* Total */}
            <View
              style={[
                styles.infoItem,
                styles.infoItemFull,
              ]}
            >
              <View style={styles.infoIcon}>
                <Ionicons
                  name="wallet-outline"
                  size={16}
                  color="#00E5A8"
                />
              </View>

              <View style={styles.infoContent}>

                <Text style={styles.infoLabel}>
                  TOTAL
                </Text>

                <Text style={styles.priceValue}>
                  ₹
                  {Number(
                    item.totalCost || 0
                  ).toFixed(2)}
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
                    item.vehicleInfo.vehicleType ||
                    'Vehicle'}
                </Text>

                {item.vehicleInfo.licensePlate ? (
                  <Text style={styles.plateText}>
                    {item.vehicleInfo.licensePlate}
                  </Text>
                ) : null}

              </View>

              {/* Details Arrow */}
              <Ionicons
                name="chevron-forward"
                size={18}
                color="#475569"
              />

            </View>
          )}

          {/* View Details Hint */}
          <View style={styles.detailsHint}>
            <Text style={styles.detailsHintText}>
              Tap to view booking details
            </Text>

            <Ionicons
              name="arrow-forward"
              size={14}
              color="#64748B"
            />
          </View>

        </Pressable>

        {/* ========================================= */}
        {/* CANCEL BUTTON */}
        {/* ========================================= */}

        {canCancel && (
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              pressed &&
                styles.cancelButtonPressed,
              cancellingId === item._id &&
                styles.cancelButtonDisabled,
            ]}
            disabled={
              cancellingId === item._id
            }
            onPress={() => onCancel(item)}
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
                  size={17}
                  color="#F87171"
                />

                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </>
            )}

          </Pressable>
        )}

      </View>
    );
  }
);

BookingCard.displayName = 'BookingCard';

// =====================================================
// INFO ITEM
// =====================================================

const InfoItem = memo(
  ({
    icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: string;
  }) => (
    <View
      style={[
        styles.infoItem,
        styles.infoItemHalf,
      ]}
    >

      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={16}
          color="#00E5A8"
        />
      </View>

      <View style={styles.infoContent}>

        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text style={styles.infoValue}>
          {value || '--'}
        </Text>

      </View>

    </View>
  )
);

InfoItem.displayName = 'InfoItem';

// =====================================================
// HEADER
// =====================================================

const Header = memo(
  ({
    bookingsCount,
    onBack,
    onRefresh,
  }: {
    bookingsCount: number;
    onBack: () => void;
    onRefresh: () => void;
  }) => (
    <View style={styles.header}>

      <Pressable
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={onBack}
      >
        <Ionicons
          name="arrow-back"
          size={20}
          color="#F8FAFC"
        />
      </Pressable>

      <View style={styles.headerTitleContainer}>

        <Text
          style={styles.headerTitle}
          numberOfLines={1}
        >
          My Bookings
        </Text>

        <Text style={styles.headerSubtitle}>
          {bookingsCount}{' '}
          {bookingsCount === 1
            ? 'booking'
            : 'bookings'}
        </Text>

      </View>

      <Pressable
        style={({ pressed }) => [
          styles.refreshButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={onRefresh}
      >
        <Ionicons
          name="refresh"
          size={19}
          color="#00E5A8"
        />
      </Pressable>

    </View>
  )
);

Header.displayName = 'Header';

// =====================================================
// EMPTY STATE
// =====================================================

const EmptyState = memo(
  ({ onNavigate }: { onNavigate: () => void }) => (
    <View style={styles.emptyContainer}>

      <View style={styles.emptyIcon}>
        <Ionicons
          name="calendar-outline"
          size={40}
          color="#00E5A8"
        />
      </View>

      <Text style={styles.emptyTitle}>
        No Bookings Yet
      </Text>

      <Text style={styles.emptyText}>
        Your previous bookings will appear
        here automatically.
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.bookNowButton,
          pressed &&
            styles.bookNowButtonPressed,
        ]}
        onPress={onNavigate}
      >

        <Ionicons
          name="flash"
          size={17}
          color="#020617"
        />

        <Text style={styles.bookNowText}>
          Find a Station
        </Text>

      </Pressable>

    </View>
  )
);

EmptyState.displayName = 'EmptyState';

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

const formatDate = (dateString?: string) => {
  if (
    !dateString ||
    typeof dateString !== 'string'
  ) {
    return '--';
  }

  try {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return '--';
    }

    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  } catch (error) {
    console.warn(
      'Date format error:',
      error
    );

    return '--';
  }
};

const formatTime = (dateString?: string) => {
  if (
    !dateString ||
    typeof dateString !== 'string'
  ) {
    return '--';
  }

  try {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return '--';
    }

    return date.toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }
    );
  } catch (error) {
    console.warn(
      'Time format error:',
      error
    );

    return '--';
  }
};

const getStatusStyle = (
  status?: Booking['status']
) => {
  switch (status) {

    case 'confirmed':
      return {
        backgroundColor:
          'rgba(0,229,168,0.12)',
        color: '#00E5A8',
        icon: 'checkmark-circle' as const,
      };

    case 'active':
      return {
        backgroundColor:
          'rgba(59,130,246,0.12)',
        color: '#60A5FA',
        icon: 'flash' as const,
      };

    case 'completed':
      return {
        backgroundColor:
          'rgba(34,197,94,0.12)',
        color: '#4ADE80',
        icon: 'checkmark-done-circle' as const,
      };

    case 'cancelled':
      return {
        backgroundColor:
          'rgba(239,68,68,0.12)',
        color: '#F87171',
        icon: 'close-circle' as const,
      };

    case 'no-show':
      return {
        backgroundColor:
          'rgba(245,158,11,0.12)',
        color: '#FBBF24',
        icon: 'alert-circle' as const,
      };

    default:
      return {
        backgroundColor:
          'rgba(148,163,184,0.12)',
        color: '#94A3B8',
        icon: 'time-outline' as const,
      };
  }
};

// =====================================================
// MAIN SCREEN
// =====================================================

export default function MyBookingsScreen() {

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [cancellingId, setCancellingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  // ===================================================
  // FETCH BOOKINGS
  // ===================================================

  const fetchBookings = useCallback(
    async (showLoader = true) => {

      try {

        if (showLoader) {
          setLoading(true);
        }

        setError(null);

        const result =
          await bookingService.getMyBookings();

        if (!result?.success) {
          setBookings([]);
          setError(
            'Unable to load bookings'
          );
          return;
        }

        const receivedBookings =
          Array.isArray(
            result?.data?.bookings ??
              result?.data ??
              result?.bookings
          )
            ? result.data?.bookings ??
              result.data ??
              result.bookings ??
              []
            : [];

        if (
          Array.isArray(
            receivedBookings
          )
        ) {
          setBookings(
            receivedBookings
          );

          setError(null);
        } else {
          setBookings([]);
          setError(
            'Invalid data format'
          );
        }

      } catch (error: any) {

        console.error(
          'Error fetching my bookings:',
          error?.response?.data ||
            error
        );

        setBookings([]);

        if (
          error?.response?.status === 401
        ) {

          Alert.alert(
            'Session Expired',
            'Please login again to view your bookings.',
            [
              {
                text: 'Login',
                onPress: () => {
                  router.replace(
                    '/auth/login'
                  );
                },
              },
            ]
          );

          return;
        }

        setError(
          error?.response?.data?.message ||
            'Failed to load bookings'
        );

      } finally {

        if (showLoader) {
          setLoading(false);
        }

      }
    },
    []
  );

  // ===================================================
  // REFRESH ON SCREEN FOCUS
  // ===================================================

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh =
    useCallback(async () => {

      setRefreshing(true);

      await fetchBookings(false);

      setRefreshing(false);

    }, [fetchBookings]);

  // ===================================================
  // CANCEL BOOKING
  // ===================================================

  const handleCancel =
    useCallback(
      (booking: Booking) => {

        if (!booking?._id) return;

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

                  setCancellingId(
                    booking._id
                  );

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

                    await fetchBookings(
                      false
                    );

                  } else {

                    Alert.alert(
                      'Unable to Cancel',
                      result?.message ||
                        'Unable to cancel this booking.'
                    );
                  }

                } catch (error: any) {

                  const message =
                    error?.response?.data
                      ?.message ||
                    'Unable to cancel this booking.';

                  Alert.alert(
                    'Cannot Cancel Booking',
                    message
                  );

                } finally {

                  setCancellingId(null);

                }

              },
            },
          ]
        );

      },
      [fetchBookings]
    );

  // ===================================================
  // RENDER BOOKING
  // ===================================================

  const renderBooking =
    useCallback(
      ({ item }: { item: Booking }) => (
        <BookingCard
          item={item}
          cancellingId={cancellingId}
          onCancel={handleCancel}
        />
      ),
      [
        cancellingId,
        handleCancel,
      ]
    );

  // ===================================================
  // KEY EXTRACTOR
  // ===================================================

  const keyExtractor =
    useCallback(
      (item: Booking) =>
        item?._id ||
        Math.random().toString(),
      []
    );

  // ===================================================
  // UI
  // ===================================================

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top']}
    >

      {/* Header */}
      <Header
        bookingsCount={
          bookings.length
        }
        onBack={() =>
          router.back()
        }
        onRefresh={
          handleRefresh
        }
      />

      {/* Error */}
      {error && (
        <View
          style={
            styles.errorContainer
          }
        >

          <Text
            style={styles.errorText}
          >
            {error}
          </Text>

          <Pressable
            style={styles.errorRetry}
            onPress={() =>
              fetchBookings()
            }
          >
            <Text
              style={
                styles.errorRetryText
              }
            >
              Retry
            </Text>
          </Pressable>

        </View>
      )}

      {/* Loading */}
      {loading ? (

        <View
          style={
            styles.centerContainer
          }
        >

          <ActivityIndicator
            size="large"
            color="#00E5A8"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading your bookings...
          </Text>

        </View>

      ) : (

        <FlatList
          data={bookings}
          keyExtractor={
            keyExtractor
          }
          renderItem={
            renderBooking
          }
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={[
            styles.listContent,
            bookings.length === 0 &&
              styles.emptyListContent,
          ]}
          scrollEventThrottle={16}
          removeClippedSubviews={
            true
          }
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={
            50
          }
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={
                handleRefresh
              }
              tintColor="#00E5A8"
            />
          }
          ListEmptyComponent={
            <EmptyState
              onNavigate={() =>
                router.push(
                  '/(tabs)'
                )
              }
            />
          }
        />

      )}

    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: '#020617',
  },

  header: {
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(255,255,255,0.06)',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  buttonPressed: {
    opacity: 0.7,
  },

  headerTitleContainer: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  headerSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },

  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor:
      'rgba(239,68,68,0.1)',
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(239,68,68,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  errorText: {
    color: '#F87171',
    fontSize: 12,
    flex: 1,
  },

  errorRetry: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor:
      'rgba(239,68,68,0.2)',
    borderRadius: 6,
  },

  errorRetryText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
  },

  listContent: {
    padding: 12,
    paddingBottom: 30,
  },

  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  bookingCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },

  bookingContent: {
    padding: 14,
  },

  bookingContentPressed: {
    opacity: 0.82,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  stationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor:
      'rgba(0,229,168,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(0,229,168,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  stationInfo: {
    flex: 1,
    minWidth: 0,
  },

  stationName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },

  locationText: {
    color: '#64748B',
    fontSize: 11,
    flex: 1,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    flexShrink: 0,
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
    marginVertical: 12,
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 12,
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoItemHalf: {
    width: '48%',
  },

  infoItemFull: {
    width: '100%',
  },

  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor:
      'rgba(0,229,168,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    flexShrink: 0,
  },

  infoContent: {
    flex: 1,
    minWidth: 0,
  },

  infoLabel: {
    color: '#475569',
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 0.5,
  },

  infoValue: {
    color: '#CBD5E1',
    fontSize: 11,
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
    borderRadius: 11,
    padding: 10,
    marginTop: 14,
    gap: 8,
  },

  vehicleInfo: {
    flex: 1,
    minWidth: 0,
  },

  vehicleLabel: {
    color: '#475569',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  vehicleText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },

  plateText: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 1,
    fontWeight: '500',
  },

  detailsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    marginTop: 12,
  },

  detailsHintText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '600',
  },

  cancelButton: {
    height: 40,
    borderTopWidth: 1,
    borderTopColor:
      'rgba(248,113,113,0.12)',
    backgroundColor:
      'rgba(239,68,68,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  cancelButtonPressed: {
    backgroundColor:
      'rgba(239,68,68,0.12)',
  },

  cancelButtonDisabled: {
    opacity: 0.6,
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
    fontSize: 12,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor:
      'rgba(0,229,168,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(0,229,168,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '900',
  },

  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },

  bookNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#00E5A8',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 11,
    marginTop: 20,
  },

  bookNowButtonPressed: {
    opacity: 0.8,
  },

  bookNowText: {
    color: '#020617',
    fontSize: 12,
    fontWeight: '900',
  },
});