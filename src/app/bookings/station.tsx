import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import bookingService, {
  BookingSlot,
  VehicleInfo,
} from '../../services/bookingService';

const { width } = Dimensions.get('window');

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
  // =====================================================

  const getLocalDateString = useCallback(
    (date: Date) => {
      try {
        const year = date.getFullYear();
        const month = String(
          date.getMonth() + 1
        ).padStart(2, '0');
        const day = String(
          date.getDate()
        ).padStart(2, '0');

        return `${year}-${month}-${day}`;
      } catch (error) {
        console.warn('Date parse error:', error);
        return '';
      }
    },
    []
  );

  const getSlotLocalDate = useCallback(
    (dateString: string) => {
      try {
        if (!dateString) return '';
        const date = new Date(dateString);
        return getLocalDateString(date);
      } catch (error) {
        console.warn('Slot date error:', error);
        return '';
      }
    },
    [getLocalDateString]
  );

  // =====================================================
  // NEXT 7 DAYS
  // =====================================================

  const dates = useMemo(() => {
    try {
      const result: {
        value: string;
        day: string;
        date: string;
        month: string;
      }[] = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + i);

        result.push({
          value: getLocalDateString(date),
          day: date.toLocaleDateString('en-US', {
            weekday: 'short',
          }),
          date: date.getDate().toString(),
          month: date.toLocaleDateString('en-US', {
            month: 'short',
          }),
        });
      }

      return result;
    } catch (error) {
      console.warn('Date array error:', error);
      return [];
    }
  }, [getLocalDateString]);

  // =====================================================
  // DEFAULT DATE
  // =====================================================

  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0].value);
    }
  }, [dates, selectedDate]);

  // =====================================================
  // FETCH AVAILABLE SLOTS
  // =====================================================

  const fetchSlots = useCallback(async () => {
    if (!stationId || !selectedDate) {
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

      if (result.success && result.data) {
        const receivedSlots = Array.isArray(
          result.data.availableSlots
        )
          ? result.data.availableSlots
          : [];

        const filteredSlots = receivedSlots.filter(
          (slot: BookingSlot) => {
            try {
              const slotStartDate =
                getSlotLocalDate(slot.startTime);
              return slotStartDate === selectedDate;
            } catch (error) {
              console.warn('Slot filter error:', error);
              return false;
            }
          }
        );

        setSlots(filteredSlots);
      } else {
        setSlots([]);
      }
    } catch (error: any) {
      console.error('Slots error:', error);
      setSlots([]);

      Alert.alert(
        'Unable to load slots',
        error?.response?.data?.message ||
          'Something went wrong while loading available slots.'
      );
    } finally {
      setLoading(false);
    }
  }, [stationId, selectedDate, duration, getSlotLocalDate]);

  useEffect(() => {
    if (stationId && selectedDate) {
      fetchSlots();
    }
  }, [stationId, selectedDate, duration, fetchSlots]);

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = useCallback((dateString: string) => {
    try {
      if (!dateString) return '--';
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '--';

      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch (error) {
      console.warn('Time format error:', error);
      return '--';
    }
  }, []);

  // =====================================================
  // FORMAT SELECTED DATE
  // =====================================================

  const formattedSelectedDate = useMemo(() => {
    try {
      if (!selectedDate) return '';
      const date = new Date(`${selectedDate}T00:00:00`);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.warn('Date format error:', error);
      return '';
    }
  }, [selectedDate]);

  // =====================================================
  // CREATE BOOKING
  // =====================================================

  const handleBooking = useCallback(async () => {
    if (!stationId) {
      Alert.alert('Error', 'Station information is missing.');
      return;
    }

    if (!selectedSlot) {
      Alert.alert('Select a slot', 'Please select a charging time slot.');
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

      const vehicleInfo: VehicleInfo = {
        vehicleType,
        model: vehicleModel.trim(),
        licensePlate: licensePlate.trim().toUpperCase(),
        ...(batteryCapacity.trim()
          ? { batteryCapacity: Number(batteryCapacity) }
          : {}),
      };

      const result =
        await bookingService.createBooking({
          stationId,
          startTime: selectedSlot.startTime,
          duration: selectedSlot.duration,
          vehicleInfo,
        });

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
          result.message || 'Unable to create booking.'
        );
      }
    } catch (error: any) {
      console.error('Booking error:', error);

      Alert.alert(
        'Booking Failed',
        error?.response?.data?.message ||
          'Something went wrong while creating your booking.'
      );
    } finally {
      setBooking(false);
    }
  }, [stationId, selectedSlot, vehicleType, licensePlate, vehicleModel, batteryCapacity]);

  // =====================================================
  // UI
  // =====================================================

  const isFormValid = Boolean(
    selectedSlot && vehicleType && licensePlate.trim()
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color="#F8FAFC"
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text
            style={styles.title}
            numberOfLines={1}
          >
            Book Charging
          </Text>

          <Text
            style={styles.stationName}
            numberOfLines={1}
          >
            {stationName || 'Charging Station'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* DATE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Select Date
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateList}
            scrollEventThrottle={16}
          >
            {dates.map((item) => {
              const selected =
                selectedDate === item.value;

              return (
                <Pressable
                  key={item.value}
                  onPress={() =>
                    setSelectedDate(item.value)
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
                    numberOfLines={1}
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
                    numberOfLines={1}
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
            {[30, 60, 90, 120].map((minutes) => {
              const selected = duration === minutes;

              return (
                <Pressable
                  key={minutes}
                  onPress={() => setDuration(minutes)}
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
                      ? `${minutes}m`
                      : `${minutes / 60}h`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* AVAILABLE SLOTS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Available Slots
            </Text>

            <Text style={styles.slotInfo}>
              {duration}m
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator
                size="large"
                color="#00E5A8"
              />

              <Text style={styles.loadingText}>
                Checking available slots...
              </Text>
            </View>
          ) : slots.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={28}
                  color="#64748B"
                />
              </View>

              <Text style={styles.emptyTitle}>
                No slots available
              </Text>

              <Text style={styles.emptyText}>
                No charging slots are available on
                this date. Try another date or
                duration.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.slotsScrollContainer
              }
              scrollEventThrottle={16}
            >
              {slots.map((slot, index) => {
                const selected =
                  selectedSlot?.startTime ===
                    slot.startTime &&
                  selectedSlot?.endTime ===
                    slot.endTime;

                return (
                  <Pressable
                    key={`${slot.startTime}-${index}`}
                    onPress={() =>
                      setSelectedSlot(slot)
                    }
                    style={[
                      styles.slotCard,
                      selected &&
                        styles.slotCardSelected,
                    ]}
                  >
                    <View
                      style={styles.slotIcon}
                    >
                      <Ionicons
                        name={
                          selected
                            ? 'checkmark'
                            : 'time-outline'
                        }
                        size={18}
                        color={
                          selected
                            ? '#020617'
                            : '#00E5A8'
                        }
                      />
                    </View>

                    <View
                      style={styles.slotContent}
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
              })}
            </ScrollView>
          )}
        </View>

        {/* VEHICLE DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Vehicle Details
          </Text>

          {/* Vehicle Type */}
          <Text style={styles.inputLabel}>
            Vehicle Type
          </Text>

          <View style={styles.vehicleGrid}>
            {[
              {
                value: 'Electric Car' as const,
                label: 'Car',
                icon: 'car-outline' as const,
              },
              {
                value: 'Electric Bike' as const,
                label: 'Bike',
                icon: 'bicycle-outline' as const,
              },
              {
                value: 'Electric Scooter' as const,
                label: 'Scooter',
                icon:
                  'speedometer-outline' as const,
              },
              {
                value: 'Electric Auto' as const,
                label: 'Auto',
                icon: 'car-sport-outline' as const,
              },
            ].map((vehicle) => {
              const selected =
                vehicleType === vehicle.value;

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
                    size={21}
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
                    numberOfLines={1}
                  >
                    {vehicle.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Vehicle Model */}
          <Text style={styles.inputLabel}>
            Vehicle Model
          </Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="car-outline"
              size={18}
              color="#64748B"
            />

            <TextInput
              value={vehicleModel}
              onChangeText={setVehicleModel}
              placeholder="e.g. Nexon EV"
              placeholderTextColor="#64748B"
              style={styles.input}
            />
          </View>

          {/* License Plate */}
          <Text style={styles.inputLabel}>
            License Plate *
          </Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="card-outline"
              size={18}
              color="#64748B"
            />

            <TextInput
              value={licensePlate}
              onChangeText={setLicensePlate}
              placeholder="e.g. MP09AB1234"
              placeholderTextColor="#64748B"
              autoCapitalize="characters"
              style={styles.input}
            />
          </View>

          {/* Battery */}
          <Text style={styles.inputLabel}>
            Battery Capacity (kWh)
          </Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="battery-charging-outline"
              size={18}
              color="#64748B"
            />

            <TextInput
              value={batteryCapacity}
              onChangeText={setBatteryCapacity}
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
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>
                Booking Summary
              </Text>

              <Ionicons
                name="receipt-outline"
                size={20}
                color="#00E5A8"
              />
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Date
              </Text>

              <Text style={styles.summaryValue}>
                {selectedDate}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Time
              </Text>

              <Text style={styles.summaryValue}>
                {formatTime(selectedSlot.startTime)}{' '}
                - {formatTime(selectedSlot.endTime)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Duration
              </Text>

              <Text style={styles.summaryValue}>
                {selectedSlot.duration}m
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Estimated Total
              </Text>

              <Text style={styles.totalPrice}>
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
          disabled={!isFormValid || booking}
          onPress={handleBooking}
          style={[
            styles.confirmButton,
            (!isFormValid || booking) &&
              styles.confirmDisabled,
          ]}
        >
          {booking ? (
            <ActivityIndicator color="#020617" />
          ) : (
            <>
              <Ionicons
                name="flash"
                size={20}
                color="#020617"
              />

              <Text style={styles.confirmText}>
                Confirm Booking
              </Text>
            </>
          )}
        </Pressable>

        <Text style={styles.footerNote}>
          Same-day bookings are shown only within
          the selected calendar date.
        </Text>

        <View style={{ height: 25 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#020617',
  },

  header: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(255,255,255,0.06)',
  },

  headerText: {
    flex: 1,
    minWidth: 0,
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

  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
  },

  stationName: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },

  scrollView: {
    flex: 1,
  },

  container: {
    paddingBottom: 25,
  },

  section: {
    marginTop: 20,
    paddingHorizontal: 14,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 11,
  },

  slotInfo: {
    color: '#00E5A8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 11,
  },

  dateList: {
    gap: 8,
    paddingRight: 14,
  },

  dateCard: {
    width: 62,
    paddingVertical: 10,
    borderRadius: 13,
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
    fontSize: 10,
    fontWeight: '700',
  },

  dateNumber: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
    marginVertical: 1,
  },

  dateMonth: {
    color: '#64748B',
    fontSize: 10,
  },

  selectedText: {
    color: '#020617',
  },

  selectedDateText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 9,
  },

  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  durationButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
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
    fontSize: 12,
    fontWeight: '700',
  },

  loadingBox: {
    alignItems: 'center',
    paddingVertical: 35,
  },

  loadingText: {
    color: '#64748B',
    marginTop: 9,
    fontSize: 12,
  },

  emptyBox: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 11,
  },

  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    fontSize: 12,
  },

  slotsScrollContainer: {
    gap: 9,
    paddingRight: 14,
  },

  slotCard: {
    width: 140,
    backgroundColor: '#0F172A',
    borderRadius: 13,
    padding: 11,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.06)',
  },

  slotCardSelected: {
    backgroundColor: '#00E5A8',
    borderColor: '#00E5A8',
  },

  slotIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 7,
  },

  slotContent: {
    alignItems: 'center',
    marginBottom: 8,
  },

  slotTime: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },

  slotTimeSelected: {
    color: '#020617',
  },

  slotEnd: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },

  slotEndSelected: {
    color: 'rgba(2,6,23,0.65)',
  },

  slotPrice: {
    color: '#00E5A8',
    fontSize: 12,
    fontWeight: '800',
  },

  slotPriceSelected: {
    color: '#020617',
  },

  inputLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 11,
    marginBottom: 6,
  },

  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  vehicleCard: {
    width: '48.5%',
    minHeight: 65,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 7,
    gap: 4,
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
    height: 48,
    borderRadius: 11,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 9,
  },

  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
  },

  summary: {
    marginHorizontal: 14,
    marginTop: 24,
    backgroundColor: '#0F172A',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor:
      'rgba(0,229,168,0.18)',
  },

  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  summaryTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },

  summaryLabel: {
    color: '#64748B',
    fontSize: 12,
  },

  summaryValue: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor:
      'rgba(255,255,255,0.07)',
    marginVertical: 9,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },

  totalPrice: {
    color: '#00E5A8',
    fontSize: 18,
    fontWeight: '900',
  },

  confirmButton: {
    marginHorizontal: 14,
    marginTop: 18,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#00E5A8',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  confirmDisabled: {
    backgroundColor: '#334155',
  },

  confirmText: {
    color: '#020617',
    fontSize: 15,
    fontWeight: '900',
  },

  footerNote: {
    color: '#475569',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
    lineHeight: 16,
  },
});