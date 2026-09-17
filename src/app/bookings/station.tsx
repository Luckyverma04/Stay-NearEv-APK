import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';

import { useEffect, useMemo, useState } from 'react';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import bookingService, {
  BookingSlot,
  VehicleInfo,
} from '../../services/bookingService';

export default function BookingStationScreen() {
  const {
    stationId,
    stationName,
  } = useLocalSearchParams<{
    stationId: string;
    stationName?: string;
  }>();

  const [selectedDate, setSelectedDate] =
    useState('');

  const [duration, setDuration] =
    useState(60);

  const [slots, setSlots] =
    useState<BookingSlot[]>([]);

  const [selectedSlot, setSelectedSlot] =
    useState<BookingSlot | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [booking, setBooking] =
    useState(false);

  const [vehicleType, setVehicleType] =
    useState<
      VehicleInfo['vehicleType'] | ''
    >('');

  const [vehicleModel, setVehicleModel] =
    useState('');

  const [licensePlate, setLicensePlate] =
    useState('');

  const [batteryCapacity, setBatteryCapacity] =
    useState('');

  // =====================================================
  // LOCAL DATE HELPER
  // Important:
  // Do NOT use toISOString() for calendar dates.
  // It converts time to UTC and can shift the date.
  // =====================================================

  const getLocalDateString = (
    date: Date
  ) => {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // =====================================================
  // GET LOCAL DATE FROM SLOT
  // Backend sends timestamps.
  // JS converts them to user's local timezone.
  // User is in India, so this correctly handles IST.
  // =====================================================

  const getSlotLocalDate = (
    dateString: string
  ) => {
    const date =
      new Date(dateString);

    return getLocalDateString(date);
  };

  // =====================================================
  // NEXT 7 DAYS
  // =====================================================

  const dates = useMemo(() => {
    const result: {
      value: string;
      day: string;
      date: string;
      month: string;
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date();

      date.setHours(0, 0, 0, 0);

      date.setDate(
        date.getDate() + i
      );

      result.push({
        value:
          getLocalDateString(date),

        day: date.toLocaleDateString(
          'en-US',
          {
            weekday: 'short',
          }
        ),

        date:
          date
            .getDate()
            .toString(),

        month:
          date.toLocaleDateString(
            'en-US',
            {
              month: 'short',
            }
          ),
      });
    }

    return result;
  }, []);

  // =====================================================
  // DEFAULT DATE
  // =====================================================

  useEffect(() => {
    if (dates.length > 0) {
      setSelectedDate(
        dates[0].value
      );
    }
  }, [dates]);

  // =====================================================
  // FETCH AVAILABLE SLOTS
  // =====================================================

  useEffect(() => {
    if (
      stationId &&
      selectedDate
    ) {
      fetchSlots();
    }
  }, [
    stationId,
    selectedDate,
    duration,
  ]);

  const fetchSlots = async () => {
    if (
      !stationId ||
      !selectedDate
    ) {
      return;
    }

    try {
      setLoading(true);

      setSelectedSlot(null);

      const result =
        await bookingService.getAvailableSlots(
          stationId,
          selectedDate,
          duration
        );

      console.log(
        '📅 Available slots response:',
        result
      );

      if (
        result.success &&
        result.data
      ) {
        const receivedSlots =
          Array.isArray(
            result.data.availableSlots
          )
            ? result.data.availableSlots
            : [];

        // =================================================
        // IMPORTANT DATE FILTER
        //
        // Example:
        //
        // 16 Sep:
        // 11:00 PM - 12:00 AM  ✅
        //
        // 17 Sep:
        // 12:00 AM - 1:00 AM   ❌ for 16 Sep
        //
        // When user selects 17 Sep,
        // that same 12:00 AM slot will appear there.
        // =================================================

        const filteredSlots =
          receivedSlots.filter(
            (slot: BookingSlot) => {
              const slotStartDate =
                getSlotLocalDate(
                  slot.startTime
                );

              return (
                slotStartDate ===
                selectedDate
              );
            }
          );

        console.log(
          '📅 Selected date:',
          selectedDate
        );

        console.log(
          '📅 Filtered slots:',
          filteredSlots
        );

        setSlots(
          filteredSlots
        );
      } else {
        setSlots([]);
      }
    } catch (error: any) {
      console.log(
        '❌ Available slots error:',
        error?.response?.data ||
          error.message
      );

      setSlots([]);

      Alert.alert(
        'Unable to load slots',
        error?.response?.data
          ?.message ||
          'Something went wrong while loading available slots.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (
    dateString: string
  ) => {
    const date =
      new Date(dateString);

    return date.toLocaleTimeString(
      'en-US',
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    );
  };

  // =====================================================
  // FORMAT SELECTED DATE
  // =====================================================

  const formattedSelectedDate =
    selectedDate
      ? new Date(
          `${selectedDate}T00:00:00`
        ).toLocaleDateString(
          'en-US',
          {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          }
        )
      : '';

  // =====================================================
  // CREATE BOOKING
  // =====================================================

  const handleBooking = async () => {
    if (!stationId) {
      Alert.alert(
        'Error',
        'Station information is missing.'
      );

      return;
    }

    if (!selectedSlot) {
      Alert.alert(
        'Select a slot',
        'Please select a charging time slot.'
      );

      return;
    }

    if (!vehicleType) {
      Alert.alert(
        'Vehicle type required',
        'Please select your vehicle type.'
      );

      return;
    }

    if (!licensePlate.trim()) {
      Alert.alert(
        'License plate required',
        'Please enter your vehicle license plate.'
      );

      return;
    }

    try {
      setBooking(true);

      const vehicleInfo:
        VehicleInfo = {
        vehicleType,

        model:
          vehicleModel.trim(),

        licensePlate:
          licensePlate
            .trim()
            .toUpperCase(),

        ...(batteryCapacity.trim()
          ? {
              batteryCapacity:
                Number(
                  batteryCapacity
                ),
            }
          : {}),
      };

      const result =
        await bookingService.createBooking(
          {
            stationId,

            startTime:
              selectedSlot.startTime,

            duration:
              selectedSlot.duration,

            vehicleInfo,
          }
        );

      console.log(
        '✅ Booking result:',
        result
      );

      if (result.success) {
        Alert.alert(
          'Booking Successful 🎉',
          'Your charging slot has been booked successfully.',
          [
            {
              text: 'Done',

              onPress: () => {
                router.back();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Booking Failed',
          result.message ||
            'Unable to create booking.'
        );
      }
    } catch (error: any) {
      console.log(
        '❌ Booking error:',
        error?.response?.data ||
          error.message
      );

      Alert.alert(
        'Booking Failed',
        error?.response?.data
          ?.message ||
          'Something went wrong while creating your booking.'
      );
    } finally {
      setBooking(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={
        false
      }
      keyboardShouldPersistTaps="handled"
    >
      {/* HEADER */}

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#F8FAFC"
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>
            Book Charging
          </Text>

          <Text
            style={styles.stationName}
            numberOfLines={1}
          >
            {stationName ||
              'Charging Station'}
          </Text>
        </View>
      </View>

      {/* DATE */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Select Date
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.dateList
          }
        >
          {dates.map((item) => {
            const selected =
              selectedDate ===
              item.value;

            return (
              <Pressable
                key={item.value}
                onPress={() =>
                  setSelectedDate(
                    item.value
                  )
                }
                style={[
                  styles.dateCard,
                  selected &&
                    styles.dateCardSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dateDay,
                    selected &&
                      styles.selectedText,
                  ]}
                >
                  {item.day}
                </Text>

                <Text
                  style={[
                    styles.dateNumber,
                    selected &&
                      styles.selectedText,
                  ]}
                >
                  {item.date}
                </Text>

                <Text
                  style={[
                    styles.dateMonth,
                    selected &&
                      styles.selectedText,
                  ]}
                >
                  {item.month}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.selectedDateText}>
          {formattedSelectedDate}
        </Text>
      </View>

      {/* DURATION */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Charging Duration
        </Text>

        <View style={styles.durationRow}>
          {[30, 60, 90, 120].map(
            (minutes) => {
              const selected =
                duration === minutes;

              return (
                <Pressable
                  key={minutes}
                  onPress={() =>
                    setDuration(
                      minutes
                    )
                  }
                  style={[
                    styles.durationButton,
                    selected &&
                      styles.durationSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.durationText,
                      selected &&
                        styles.selectedText,
                    ]}
                  >
                    {minutes < 60
                      ? `${minutes} min`
                      : `${minutes / 60} hr`}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>
      </View>

      {/* AVAILABLE SLOTS */}

      <View style={styles.section}>
        <View
          style={
            styles.sectionHeader
          }
        >
          <Text style={styles.sectionTitle}>
            Available Slots
          </Text>

          <Text
            style={styles.slotInfo}
          >
            {duration} min
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="large"
              color="#00E5A8"
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Checking available slots...
            </Text>
          </View>
        ) : slots.length === 0 ? (
          <View style={styles.emptyBox}>
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="calendar-outline"
                size={30}
                color="#64748B"
              />
            </View>

            <Text
              style={styles.emptyTitle}
            >
              No slots available
            </Text>

            <Text
              style={styles.emptyText}
            >
              No charging slots are
              available on this date.
              Try another date or duration.
            </Text>
          </View>
        ) : (
          <View style={styles.slotGrid}>
            {slots.map(
              (slot, index) => {
                const selected =
                  selectedSlot?.startTime ===
                    slot.startTime &&
                  selectedSlot?.endTime ===
                    slot.endTime;

                return (
                  <Pressable
                    key={`${slot.startTime}-${index}`}
                    onPress={() =>
                      setSelectedSlot(
                        slot
                      )
                    }
                    style={[
                      styles.slotCard,
                      selected &&
                        styles.slotCardSelected,
                    ]}
                  >
                    <View
                      style={
                        styles.slotIcon
                      }
                    >
                      <Ionicons
                        name={
                          selected
                            ? 'checkmark'
                            : 'time-outline'
                        }
                        size={19}
                        color={
                          selected
                            ? '#020617'
                            : '#00E5A8'
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.slotContent
                      }
                    >
                      <Text
                        style={[
                          styles.slotTime,
                          selected &&
                            styles.slotTimeSelected,
                        ]}
                      >
                        {formatTime(
                          slot.startTime
                        )}
                      </Text>

                      <Text
                        style={[
                          styles.slotEnd,
                          selected &&
                            styles.slotEndSelected,
                        ]}
                      >
                        Until{' '}
                        {formatTime(
                          slot.endTime
                        )}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.slotPrice,
                        selected &&
                          styles.slotPriceSelected,
                      ]}
                    >
                      ₹
                      {Number(
                        slot.estimatedCost
                      ).toFixed(2)}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>
        )}
      </View>

      {/* VEHICLE DETAILS */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Vehicle Details
        </Text>

        {/* Vehicle Type */}

        <Text
          style={styles.inputLabel}
        >
          Vehicle Type
        </Text>

        <View style={styles.vehicleGrid}>
          {[
            {
              value:
                'Electric Car' as const,

              label:
                'Electric Car',

              icon:
                'car-outline' as const,
            },

            {
              value:
                'Electric Bike' as const,

              label:
                'Electric Bike',

              icon:
                'bicycle-outline' as const,
            },

            {
              value:
                'Electric Scooter' as const,

              label:
                'E-Scooter',

              icon:
                'speedometer-outline' as const,
            },

            {
              value:
                'Electric Auto' as const,

              label:
                'E-Auto',

              icon:
                'car-sport-outline' as const,
            },
          ].map((vehicle) => {
            const selected =
              vehicleType ===
              vehicle.value;

            return (
              <Pressable
                key={vehicle.value}
                onPress={() =>
                  setVehicleType(
                    vehicle.value
                  )
                }
                style={[
                  styles.vehicleCard,
                  selected &&
                    styles.vehicleSelected,
                ]}
              >
                <Ionicons
                  name={vehicle.icon}
                  size={23}
                  color={
                    selected
                      ? '#020617'
                      : '#00E5A8'
                  }
                />

                <Text
                  style={[
                    styles.vehicleText,
                    selected &&
                      styles.vehicleTextSelected,
                  ]}
                >
                  {vehicle.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Vehicle Model */}

        <Text
          style={styles.inputLabel}
        >
          Vehicle Model
        </Text>

        <View style={styles.inputWrapper}>
          <Ionicons
            name="car-outline"
            size={20}
            color="#64748B"
          />

          <TextInput
            value={vehicleModel}
            onChangeText={
              setVehicleModel
            }
            placeholder="e.g. Tata Nexon EV"
            placeholderTextColor="#64748B"
            style={styles.input}
          />
        </View>

        {/* License Plate */}

        <Text
          style={styles.inputLabel}
        >
          License Plate *
        </Text>

        <View style={styles.inputWrapper}>
          <Ionicons
            name="card-outline"
            size={20}
            color="#64748B"
          />

          <TextInput
            value={licensePlate}
            onChangeText={
              setLicensePlate
            }
            placeholder="e.g. MP09AB1234"
            placeholderTextColor="#64748B"
            autoCapitalize="characters"
            style={styles.input}
          />
        </View>

        {/* Battery */}

        <Text
          style={styles.inputLabel}
        >
          Battery Capacity (kWh)
        </Text>

        <View style={styles.inputWrapper}>
          <Ionicons
            name="battery-charging-outline"
            size={20}
            color="#64748B"
          />

          <TextInput
            value={
              batteryCapacity
            }
            onChangeText={
              setBatteryCapacity
            }
            placeholder="e.g. 40"
            placeholderTextColor="#64748B"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
      </View>

      {/* BOOKING SUMMARY */}

      {selectedSlot && (
        <View style={styles.summary}>
          <View
            style={
              styles.summaryHeader
            }
          >
            <Text
              style={
                styles.summaryTitle
              }
            >
              Booking Summary
            </Text>

            <Ionicons
              name="receipt-outline"
              size={22}
              color="#00E5A8"
            />
          </View>

          <View
            style={
              styles.summaryRow
            }
          >
            <Text
              style={
                styles.summaryLabel
              }
            >
              Date
            </Text>

            <Text
              style={
                styles.summaryValue
              }
            >
              {selectedDate}
            </Text>
          </View>

          <View
            style={
              styles.summaryRow
            }
          >
            <Text
              style={
                styles.summaryLabel
              }
            >
              Time
            </Text>

            <Text
              style={
                styles.summaryValue
              }
            >
              {formatTime(
                selectedSlot.startTime
              )}{' '}
              -{' '}
              {formatTime(
                selectedSlot.endTime
              )}
            </Text>
          </View>

          <View
            style={
              styles.summaryRow
            }
          >
            <Text
              style={
                styles.summaryLabel
              }
            >
              Duration
            </Text>

            <Text
              style={
                styles.summaryValue
              }
            >
              {selectedSlot.duration}{' '}
              minutes
            </Text>
          </View>

          <View
            style={
              styles.divider
            }
          />

          <View
            style={
              styles.totalRow
            }
          >
            <Text
              style={styles.totalLabel}
            >
              Estimated Total
            </Text>

            <Text
              style={styles.totalPrice}
            >
              ₹
              {Number(
                selectedSlot.estimatedCost
              ).toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* CONFIRM BOOKING */}

      <Pressable
        disabled={
          !selectedSlot ||
          !vehicleType ||
          !licensePlate.trim() ||
          booking
        }
        onPress={
          handleBooking
        }
        style={[
          styles.confirmButton,
          (!selectedSlot ||
            !vehicleType ||
            !licensePlate.trim() ||
            booking) &&
            styles.confirmDisabled,
        ]}
      >
        {booking ? (
          <ActivityIndicator
            color="#020617"
          />
        ) : (
          <>
            <Ionicons
              name="flash"
              size={22}
              color="#020617"
            />

            <Text
              style={
                styles.confirmText
              }
            >
              Confirm Booking
            </Text>
          </>
        )}
      </Pressable>

      <Text
        style={styles.footerNote}
      >
        Same-day bookings are shown only
        within the selected calendar date.
      </Text>

      <View
        style={{ height: 30 }}
      />
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

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  headerText: {
    flex: 1,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '900',
  },

  stationName: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 3,
  },

  section: {
    marginTop: 25,
    paddingHorizontal: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 13,
  },

  slotInfo: {
    color: '#00E5A8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 13,
  },

  dateList: {
    gap: 10,
    paddingRight: 20,
  },

  dateCard: {
    width: 68,
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.06)',
  },

  dateCardSelected: {
    backgroundColor: '#00E5A8',
    borderColor: '#00E5A8',
  },

  dateDay: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },

  dateNumber: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 2,
  },

  dateMonth: {
    color: '#64748B',
    fontSize: 11,
  },

  selectedText: {
    color: '#020617',
  },

  selectedDateText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 10,
  },

  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',
  },

  durationSelected: {
    backgroundColor: '#00E5A8',
    borderColor: '#00E5A8',
  },

  durationText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },

  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  loadingText: {
    color: '#64748B',
    marginTop: 10,
    fontSize: 13,
  },

  emptyBox: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },

  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    fontSize: 13,
  },

  slotGrid: {
    gap: 10,
  },

  slotCard: {
    backgroundColor: '#0F172A',
    borderRadius: 15,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.06)',
  },

  slotCardSelected: {
    backgroundColor: '#00E5A8',
    borderColor: '#00E5A8',
  },

  slotIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },

  slotContent: {
    flex: 1,
    marginLeft: 11,
  },

  slotTime: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },

  slotTimeSelected: {
    color: '#020617',
  },

  slotEnd: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },

  slotEndSelected: {
    color: 'rgba(2,6,23,0.65)',
  },

  slotPrice: {
    color: '#00E5A8',
    fontSize: 14,
    fontWeight: '800',
  },

  slotPriceSelected: {
    color: '#020617',
  },

  inputLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 13,
    marginBottom: 7,
  },

  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  vehicleCard: {
    width: '48%',
    minHeight: 70,
    borderRadius: 13,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    gap: 5,
  },

  vehicleSelected: {
    backgroundColor: '#00E5A8',
    borderColor: '#00E5A8',
  },

  vehicleText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  vehicleTextSelected: {
    color: '#020617',
  },

  inputWrapper: {
    height: 52,
    borderRadius: 13,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },

  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
  },

  summary: {
    marginHorizontal: 20,
    marginTop: 28,
    backgroundColor: '#0F172A',
    borderRadius: 17,
    padding: 17,
    borderWidth: 1,
    borderColor:
      'rgba(0,229,168,0.18)',
  },

  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  summaryTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },

  summaryLabel: {
    color: '#64748B',
    fontSize: 13,
  },

  summaryValue: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor:
      'rgba(255,255,255,0.07)',
    marginVertical: 10,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },

  totalPrice: {
    color: '#00E5A8',
    fontSize: 21,
    fontWeight: '900',
  },

  confirmButton: {
    marginHorizontal: 20,
    marginTop: 22,
    height: 56,
    borderRadius: 15,
    backgroundColor: '#00E5A8',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },

  confirmDisabled: {
    backgroundColor: '#334155',
  },

  confirmText: {
    color: '#020617',
    fontSize: 16,
    fontWeight: '900',
  },

  footerNote: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 11,
    paddingHorizontal: 25,
    lineHeight: 17,
  },
});