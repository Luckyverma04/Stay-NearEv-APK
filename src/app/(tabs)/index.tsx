import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import { useEffect, useMemo, useState } from 'react';

import { router } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';

import AsyncStorage from '@react-native-async-storage/async-storage';

import StationCard from '../../components/StationCard';

import stationService, {
  Station,
} from '../../services/stationService';

export default function HomeScreen() {
  const [stations, setStations] = useState<Station[]>([]);

  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetchStations();
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const token = await AsyncStorage.getItem('token');

    setIsLoggedIn(Boolean(token));
  };

  const fetchStations = async () => {
    try {
      const result =
        await stationService.getAllStations();

      if (result.success) {
        setStations(result.stations || []);
      } else {
        setStations([]);
      }
    } catch (error) {
      console.error(
        '❌ Error fetching stations:',
        error
      );

      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchStations();

    setRefreshing(false);
  };

  const filteredStations = useMemo(() => {
    const query = searchTerm
      .trim()
      .toLowerCase();

    if (!query) {
      return stations;
    }

    return stations.filter(
      (station) =>
        station.name
          ?.toLowerCase()
          .includes(query) ||
        station.location
          ?.toLowerCase()
          .includes(query)
    );
  }, [stations, searchTerm]);

  const chargerCount = stations.reduce(
    (total, station) =>
      total +
      (station.chargerTypes?.length || 0),
    0
  );

  return (
    <View style={styles.screen}>

      <FlatList
        data={filteredStations}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <StationCard station={item} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#00E5A8"
          />
        }

        ListHeaderComponent={
          <>

            {/* ───────── HEADER ───────── */}

            <View style={styles.header}>

              <View>
                <Text style={styles.smallGreeting}>
                  Welcome to
                </Text>

                <Text style={styles.logo}>
                  StayNear
                  <Text style={styles.logoAccent}>
                    EV
                  </Text>
                </Text>
              </View>

              <Pressable
                style={styles.headerButton}
                onPress={() => {
                  if (isLoggedIn) {
                    router.push(
                      '/bookings'
                    );
                  } else {
                    router.push(
                      '/auth/login'
                    );
                  }
                }}
              >
                <Ionicons
                  name={
                    isLoggedIn
                      ? 'person-outline'
                      : 'log-in-outline'
                  }
                  size={21}
                  color="#00E5A8"
                />
              </Pressable>

            </View>

            {/* ───────── HERO ───────── */}

            <LinearGradient
              colors={[
                '#071F1A',
                '#06151A',
                '#07101D',
              ]}
              style={styles.hero}
            >

              <View style={styles.heroGlow} />

              <View style={styles.heroContent}>

                <View style={styles.heroBadge}>
                  <Ionicons
                    name="flash"
                    size={13}
                    color="#00E5A8"
                  />

                  <Text style={styles.heroBadgeText}>
                    EV CHARGING NETWORK
                  </Text>
                </View>

                <Text style={styles.heroTitle}>
                  Charge
                  {'\n'}
                  Your
                  {'\n'}
                  <Text style={styles.heroAccent}>
                    EV Now
                  </Text>
                </Text>

                <Text style={styles.heroDescription}>
                  Find charging stations nearby,
                  check availability and book your
                  charging slot in seconds.
                </Text>

                <Pressable
                  style={styles.bookButton}
                  onPress={() =>
                    router.push(
                      '/bookings'
                    )
                  }
                >
                  <Ionicons
                    name="flash"
                    size={19}
                    color="#020617"
                  />

                  <Text style={styles.bookButtonText}>
                    Book a Charge
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color="#020617"
                  />
                </Pressable>

              </View>

              {/* EV Illustration */}
              <View style={styles.heroIconContainer}>

                <View style={styles.pulseCircle}>
                  <Ionicons
                    name="flash"
                    size={58}
                    color="#00E5A8"
                  />
                </View>

                <View style={styles.energyRing}>
                  <View style={styles.energyDot} />
                  <View style={styles.energyDot2} />
                </View>

              </View>

            </LinearGradient>

            {/* ───────── STATS ───────── */}

            <View style={styles.statsRow}>

              <View style={styles.statCard}>
                <Ionicons
                  name="flash"
                  size={21}
                  color="#00E5A8"
                />

                <Text style={styles.statValue}>
                  {stations.length}
                </Text>

                <Text style={styles.statLabel}>
                  Stations
                </Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons
                  name="battery-charging"
                  size={21}
                  color="#00E5A8"
                />

                <Text style={styles.statValue}>
                  {chargerCount}
                </Text>

                <Text style={styles.statLabel}>
                  Chargers
                </Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons
                  name="shield-checkmark"
                  size={21}
                  color="#00E5A8"
                />

                <Text style={styles.statValue}>
                  99.9%
                </Text>

                <Text style={styles.statLabel}>
                  Uptime
                </Text>
              </View>

            </View>

            {/* ───────── SEARCH ───────── */}

            <View style={styles.searchContainer}>

              <Ionicons
                name="search"
                size={21}
                color="#64748B"
              />

              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Search station or location..."
                placeholderTextColor="#64748B"
                style={styles.searchInput}
                autoCapitalize="none"
              />

              {searchTerm.length > 0 && (
                <Pressable
                  onPress={() =>
                    setSearchTerm('')
                  }
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color="#64748B"
                  />
                </Pressable>
              )}

            </View>

            {/* ───────── SECTION HEADER ───────── */}

            <View style={styles.sectionHeader}>

              <View>
                <Text style={styles.sectionTitle}>
                  Nearby Stations
                </Text>

                <Text style={styles.sectionSubtitle}>
                  {filteredStations.length}{' '}
                  charging stations available
                </Text>
              </View>

              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />

                <Text style={styles.liveText}>
                  LIVE
                </Text>
              </View>

            </View>

            {/* ───────── LOADING ───────── */}

            {loading && (
              <View style={styles.loadingContainer}>

                <ActivityIndicator
                  size="large"
                  color="#00E5A8"
                />

                <Text style={styles.loadingText}>
                  Finding charging stations...
                </Text>

              </View>
            )}

            {/* ───────── EMPTY ───────── */}

            {!loading &&
              filteredStations.length === 0 && (
                <View style={styles.emptyContainer}>

                  <View style={styles.emptyIcon}>
                    <Ionicons
                      name="flash-outline"
                      size={40}
                      color="#00E5A8"
                    />
                  </View>

                  <Text style={styles.emptyTitle}>
                    No Stations Found
                  </Text>

                  <Text style={styles.emptyText}>
                    Try searching with another
                    station name or location.
                  </Text>

                </View>
              )}

          </>
        }

        ListFooterComponent={
          !loading &&
          filteredStations.length > 0 ? (
            <LinearGradient
              colors={[
                '#071F1A',
                '#07101D',
              ]}
              style={styles.footerCard}
            >

              <Ionicons
                name="shield-checkmark"
                size={28}
                color="#00E5A8"
              />

              <View style={styles.footerTextContainer}>

                <Text style={styles.footerTitle}>
                  Safe & Reliable Charging
                </Text>

                <Text style={styles.footerText}>
                  Verified stations. Transparent
                  pricing. Easy booking.
                </Text>

              </View>

            </LinearGradient>
          ) : null
        }
      />

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#020617',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  header: {
    height: 75,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  smallGreeting: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 2,
  },

  logo: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '900',
  },

  logoAccent: {
    color: '#00E5A8',
  },

  headerButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,229,168,0.25)',
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  hero: {
    minHeight: 430,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,229,168,0.18)',
    padding: 22,
    marginBottom: 18,
    position: 'relative',
  },

  heroGlow: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 120,
    right: -70,
    top: -60,
    backgroundColor: 'rgba(0,229,168,0.09)',
  },

  heroContent: {
    zIndex: 2,
  },

  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,229,168,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,168,0.2)',
    marginBottom: 18,
  },

  heroBadgeText: {
    color: '#00E5A8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  heroTitle: {
    color: '#F8FAFC',
    fontSize: 48,
    lineHeight: 50,
    fontWeight: '900',
  },

  heroAccent: {
    color: '#00E5A8',
  },

  heroDescription: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
    maxWidth: 310,
  },

  bookButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00E5A8',
    paddingHorizontal: 17,
    paddingVertical: 13,
    borderRadius: 13,
    marginTop: 20,
  },

  bookButtonText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: '800',
  },

  heroIconContainer: {
    position: 'absolute',
    right: 15,
    bottom: 20,
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pulseCircle: {
    width: 105,
    height: 105,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: 'rgba(0,229,168,0.35)',
    backgroundColor: 'rgba(0,229,168,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  energyRing: {
    position: 'absolute',
    width: 145,
    height: 145,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(0,229,168,0.15)',
  },

  energyDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#00E5A8',
    top: 5,
    right: 35,
  },

  energyDot2: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    bottom: 18,
    left: 20,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },

  statValue: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 7,
  },

  statLabel: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },

  searchContainer: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
    backgroundColor: '#0F172A',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 24,
  },

  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 23,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 3,
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34,197,94,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },

  liveText: {
    color: '#86EFAC',
    fontSize: 9,
    fontWeight: '800',
  },

  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },

  loadingText: {
    color: '#64748B',
    fontSize: 13,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },

  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: 'rgba(0,229,168,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },

  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 18,
    marginTop: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,229,168,0.15)',
  },

  footerTextContainer: {
    flex: 1,
  },

  footerTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },

  footerText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 17,
  },
});