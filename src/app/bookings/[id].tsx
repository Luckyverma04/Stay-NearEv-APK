import React, { useCallback, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useLocalSearchParams,
  useRouter,
  useFocusEffect,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import bookingService, {
  Booking,
} from '@/services/bookingService';

import stationService from '@/services/stationService';

export default function BookingDetailsScreen() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{ id: string }>();

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [cancelling, setCancelling] =
    useState(false);

  // =====================================================
  // FETCH BOOKING + STATION IMAGE
  // =====================================================

  const fetchBooking = useCallback(
    async () => {
      if (!id) return;

      try {
        setLoading(true);

        const result =
          await bookingService.getBookingById(id);

        if (!result?.success) {
          setBooking(null);
          return;
        }

        const receivedBooking =
          result?.data?.booking ??
          result?.data ??
          result?.booking;

        if (!receivedBooking) {
          setBooking(null);
          return;
        }

        // =================================================
        // IF BOOKING ALREADY HAS STATION IMAGE
        // =================================================

        if (
          receivedBooking.station?.images &&
          receivedBooking.station.images.length > 0
        ) {
          setBooking(receivedBooking);
          return;
        }

        // =================================================
        // FETCH STATION DETAILS IF IMAGE IS MISSING
        // =================================================

        if (
          receivedBooking.station?._id
        ) {
          try {
            const stationResult =
              await stationService.getStationById(
                receivedBooking.station._id
              );

            if (stationResult?.success) {
              const station =
                stationResult?.station ??
                stationResult?.data;

              setBooking({
                ...receivedBooking,

                station: {
                  ...receivedBooking.station,

                  images:
                    station?.images || [],
                },
              });

              return;
            }
          } catch (stationError) {
            console.warn(
              'Unable to fetch station details:',
              stationError
            );
          }
        }

        // If station image cannot be fetched,
        // still show booking details.
        setBooking(receivedBooking);

      } catch (error) {
        console.error(
          'Booking details error:',
          error
        );

        Alert.alert(
          'Error',
          'Unable to load booking details.'
        );

        setBooking(null);

      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  // =====================================================
  // REFRESH WHEN SCREEN OPENS
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      fetchBooking();
    }, [fetchBooking])
  );

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (
    dateString?: string
  ) => {
    if (!dateString) return '--';

    try {
      const date =
        new Date(dateString);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
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
    } catch {
      return '--';
    }
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (
    dateString?: string
  ) => {
    if (!dateString) return '--';

    try {
      const date =
        new Date(dateString);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
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
    } catch {
      return '--';
    }
  };

  // =====================================================
  // STATUS
  // =====================================================

  const getStatus = (
    status?: string
  ) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';

      case 'active':
        return 'Active';

      case 'completed':
        return 'Completed';

      case 'cancelled':
        return 'Cancelled';

      case 'no-show':
        return 'No Show';

      case 'pending':
      default:
        return 'Pending';
    }
  };

  // =====================================================
  // CANCEL CONDITION
  // =====================================================

  const canCancel =
    booking?.status === 'pending' ||
    booking?.status === 'confirmed';

  // =====================================================
  // CANCEL BOOKING
  // =====================================================

  const handleCancel = () => {
    if (
      !booking?._id ||
      cancelling
    ) {
      return;
    }

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
              setCancelling(true);

              const result =
                await bookingService.cancelBooking(
                  booking._id
                );

              if (result?.success) {
                Alert.alert(
                  'Booking Cancelled',
                  'Your booking has been cancelled.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        fetchBooking();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  'Cannot Cancel Booking',
                  result?.message ||
                    'Unable to cancel this booking.'
                );
              }
            } catch (error: any) {
              const message =
                error?.response?.data?.message ||
                'Unable to cancel this booking.';

              Alert.alert(
                'Cannot Cancel Booking',
                message
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top']}
      >
        <View style={styles.center}>

          <ActivityIndicator
            size="large"
            color="#00E5A8"
          />

          <Text
            style={styles.loadingText}
          >
            Loading booking...
          </Text>

        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // BOOKING NOT FOUND
  // =====================================================

  if (!booking) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top']}
      >

        <View style={styles.header}>

          <Pressable
            onPress={() =>
              router.back()
            }
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#111827"
            />
          </Pressable>

          <Text
            style={styles.headerTitle}
          >
            Booking Details
          </Text>

          <View
            style={styles.headerSpace}
          />

        </View>

        <View style={styles.center}>

          <Ionicons
            name="document-text-outline"
            size={60}
            color="#9CA3AF"
          />

          <Text
            style={styles.emptyTitle}
          >
            Booking not found
          </Text>

          <Pressable
            style={
              styles.backHomeButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={styles.backHomeText}
            >
              Go Back
            </Text>
          </Pressable>

        </View>

      </SafeAreaView>
    );
  }

  // =====================================================
  // STATION IMAGE
  // =====================================================

  const stationImage =
    booking.station?.images?.[0];

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >

      {/* HEADER */}

      <View style={styles.header}>

        <Pressable
          onPress={() =>
            router.back()
          }
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#111827"
          />
        </Pressable>

        <Text
          style={styles.headerTitle}
        >
          Booking Details
        </Text>

        <View
          style={styles.headerSpace}
        />

      </View>

      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* ================================================= */}
        {/* STATION */}
        {/* ================================================= */}

        <View
          style={styles.stationCard}
        >

          {stationImage ? (
            <Image
              source={{
                uri: stationImage,
              }}
              style={
                styles.stationImage
              }
              resizeMode="cover"
            />
          ) : (
            <View
              style={
                styles.imagePlaceholder
              }
            >
              <Ionicons
                name="flash-outline"
                size={45}
                color="#6B7280"
              />

              <Text
                style={
                  styles.imagePlaceholderText
                }
              >
                Station Image
              </Text>
            </View>
          )}

          <View
            style={styles.stationInfo}
          >

            <Text
              style={styles.stationName}
            >
              {booking.station?.name ||
                'Charging Station'}
            </Text>

            <View
              style={styles.locationRow}
            >

              <Ionicons
                name="location-outline"
                size={17}
                color="#6B7280"
              />

              <Text
                style={styles.locationText}
                numberOfLines={3}
              >
                {booking.station?.location ||
                  'Location unavailable'}
              </Text>

            </View>

          </View>

        </View>

        {/* ================================================= */}
        {/* STATUS */}
        {/* ================================================= */}

        <View style={styles.section}>

          <Text
            style={styles.sectionTitle}
          >
            Booking Status
          </Text>

          <View
            style={styles.statusCard}
          >

            <View
              style={styles.statusIcon}
            >
              <Ionicons
                name={
                  booking.status ===
                  'cancelled'
                    ? 'close-circle'
                    : booking.status ===
                        'completed'
                    ? 'checkmark-done-circle'
                    : 'checkmark-circle'
                }
                size={25}
                color={
                  booking.status ===
                  'cancelled'
                    ? '#DC2626'
                    : '#16A34A'
                }
              />
            </View>

            <View
              style={styles.statusContent}
            >

              <Text
                style={styles.statusLabel}
              >
                Status
              </Text>

              <Text
                style={styles.statusValue}
              >
                {getStatus(
                  booking.status
                )}
              </Text>

            </View>

          </View>

        </View>

        {/* ================================================= */}
        {/* SCHEDULE */}
        {/* ================================================= */}

        <View style={styles.section}>

          <Text
            style={styles.sectionTitle}
          >
            Charging Schedule
          </Text>

          <View
            style={styles.infoCard}
          >

            <InfoRow
              icon="calendar-outline"
              label="Date"
              value={formatDate(
                booking.startTime
              )}
            />

            <InfoRow
              icon="time-outline"
              label="Start Time"
              value={formatTime(
                booking.startTime
              )}
            />

            <InfoRow
              icon="time-outline"
              label="End Time"
              value={formatTime(
                booking.endTime
              )}
            />

            <InfoRow
              icon="hourglass-outline"
              label="Duration"
              value={`${booking.duration || 0} minutes`}
            />

          </View>

        </View>

        {/* ================================================= */}
        {/* VEHICLE */}
        {/* ================================================= */}

        <View style={styles.section}>

          <Text
            style={styles.sectionTitle}
          >
            Vehicle Information
          </Text>

          <View
            style={styles.infoCard}
          >

            <InfoRow
              icon="car-outline"
              label="Vehicle Type"
              value={
                booking.vehicleInfo
                  ?.vehicleType ||
                '--'
              }
            />

            <InfoRow
              icon="pricetag-outline"
              label="Model"
              value={
                booking.vehicleInfo
                  ?.model ||
                '--'
              }
            />

            <InfoRow
              icon="card-outline"
              label="License Plate"
              value={
                booking.vehicleInfo
                  ?.licensePlate ||
                '--'
              }
            />

            <InfoRow
              icon="battery-half-outline"
              label="Battery Capacity"
              value={
                booking.vehicleInfo
                  ?.batteryCapacity
                  ? `${booking.vehicleInfo.batteryCapacity} kWh`
                  : '--'
              }
            />

          </View>

        </View>

        {/* ================================================= */}
        {/* PAYMENT & CHARGING */}
        {/* ================================================= */}

        <View style={styles.section}>

          <Text
            style={styles.sectionTitle}
          >
            Payment & Charging
          </Text>

          <View
            style={styles.infoCard}
          >

            <InfoRow
              icon="flash-outline"
              label="Energy Consumed"
              value={
                booking.energyConsumed !==
                undefined
                  ? `${booking.energyConsumed} kWh`
                  : '0 kWh'
              }
            />

            <InfoRow
              icon="card-outline"
              label="Payment Status"
              value={
                booking.paymentStatus ||
                'Pending'
              }
            />

            <InfoRow
              icon="wallet-outline"
              label="Payment Method"
              value={
                booking.paymentMethod ||
                '--'
              }
            />

            <View
              style={styles.totalRow}
            >

              <Text
                style={styles.totalLabel}
              >
                Total Cost
              </Text>

              <Text
                style={styles.totalValue}
              >
                ₹
                {Number(
                  booking.totalCost || 0
                ).toFixed(2)}
              </Text>

            </View>

          </View>

        </View>

        {/* ================================================= */}
        {/* BOOKING ID */}
        {/* ================================================= */}

        <View style={styles.section}>

          <Text
            style={styles.sectionTitle}
          >
            Booking Information
          </Text>

          <View
            style={styles.bookingIdCard}
          >

            <Text
              style={
                styles.bookingIdLabel
              }
            >
              Booking ID
            </Text>

            <Text
              style={styles.bookingId}
              selectable
            >
              {booking._id}
            </Text>

          </View>

        </View>

        {/* ================================================= */}
        {/* CANCEL */}
        {/* ================================================= */}

        {canCancel && (
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              pressed &&
                styles.cancelButtonPressed,
              cancelling &&
                styles.cancelButtonDisabled,
            ]}
            onPress={handleCancel}
            disabled={cancelling}
          >

            {cancelling ? (
              <ActivityIndicator
                color="#DC2626"
              />
            ) : (
              <>
                <Ionicons
                  name="close-circle-outline"
                  size={21}
                  color="#DC2626"
                />

                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancel Booking
                </Text>
              </>
            )}

          </Pressable>
        )}

        <View
          style={styles.bottomSpace}
        />

      </ScrollView>

    </SafeAreaView>
  );
}

// =====================================================
// INFO ROW
// =====================================================

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.infoRow}
    >

      <View
        style={styles.infoIcon}
      >
        <Ionicons
          name={icon}
          size={19}
          color="#4B5563"
        />
      </View>

      <Text
        style={styles.infoLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.infoValue}
        numberOfLines={2}
      >
        {value}
      </Text>

    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerSpace: {
    width: 42,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  container: {
    padding: 16,
  },

  stationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  stationImage: {
    width: '100%',
    height: 200,
  },

  imagePlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },

  imagePlaceholderText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },

  stationInfo: {
    padding: 16,
  },

  stationName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },

  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },

  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  statusContent: {
    flex: 1,
  },

  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 3,
  },

  statusValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  infoRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  infoIcon: {
    width: 34,
    alignItems: 'center',
    marginRight: 8,
  },

  infoLabel: {
    width: 115,
    fontSize: 13,
    color: '#6B7280',
  },

  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },

  totalRow: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  bookingIdCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  bookingIdLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },

  bookingId: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },

  cancelButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  cancelButtonPressed: {
    opacity: 0.75,
  },

  cancelButtonDisabled: {
    opacity: 0.6,
  },

  cancelText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },

  bottomSpace: {
    height: 30,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  backHomeButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#111827',
  },

  backHomeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});