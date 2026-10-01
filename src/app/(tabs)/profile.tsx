import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {
  router,
  useFocusEffect,
} from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Ionicons } from '@expo/vector-icons';

import { useCallback, useState } from 'react';

import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [isLoggedIn, setIsLoggedIn] =
    useState(false);

  const [checkingLogin, setCheckingLogin] =
    useState(true);

  // Check login whenever Profile screen opens
  useFocusEffect(
    useCallback(() => {
      checkLogin();
    }, [])
  );

  const checkLogin = async () => {
    try {
      setCheckingLogin(true);

      const token =
        await AsyncStorage.getItem('token');

      setIsLoggedIn(Boolean(token));
    } catch (error) {
      console.error(
        '❌ Profile login check error:',
        error
      );

      setIsLoggedIn(false);
    } finally {
      setCheckingLogin(false);
    }
  };

  // Logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',

          onPress: async () => {
            try {
              await AsyncStorage.removeItem(
                'token'
              );

              setIsLoggedIn(false);

              Alert.alert(
                'Logged Out',
                'You have been logged out successfully.'
              );
            } catch (error) {
              console.error(
                '❌ Logout error:',
                error
              );

              Alert.alert(
                'Error',
                'Unable to logout. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  // Open bookings
  const openBookings = () => {
    router.push('/bookings');
  };

  // Open login
  const openLogin = () => {
    router.push('/auth/login');
  };

  // Loading
  if (checkingLogin) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={['top', 'bottom']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#00E5A8"
          />

          <Text style={styles.loadingText}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // LOGGED OUT
  // =====================================================

  if (!isLoggedIn) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={['top', 'bottom']}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons
              name="person-outline"
              size={38}
              color="#00E5A8"
            />
          </View>

          <Text style={styles.title}>
            My Profile
          </Text>

          <Text style={styles.subtitle}>
            Login to manage your account
          </Text>
        </View>

        <View style={styles.loginCard}>
          <View style={styles.loginIconBox}>
            <Ionicons
              name="person-circle-outline"
              size={50}
              color="#00E5A8"
            />
          </View>

          <Text style={styles.loginTitle}>
            Welcome to StayNearEV
          </Text>

          <Text style={styles.loginDescription}>
            Login to view your bookings, manage
            your account and access your profile.
          </Text>

          {/* LOGIN BUTTON */}

          <Pressable
            style={styles.loginButton}
            onPress={openLogin}
          >
            <Ionicons
              name="log-in-outline"
              size={21}
              color="#020617"
            />

            <Text style={styles.loginButtonText}>
              Login
            </Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color="#64748B"
          />

          <Text style={styles.infoText}>
            You can browse charging stations
            without logging in. Login is required
            when you want to make a booking.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // LOGGED IN
  // =====================================================

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom']}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons
            name="person"
            size={38}
            color="#00E5A8"
          />
        </View>

        <Text style={styles.title}>
          My Profile
        </Text>

        <Text style={styles.subtitle}>
          Manage your account
        </Text>
      </View>

      {/* MENU */}

      <View style={styles.menu}>
        {/* MY BOOKINGS */}

        <Pressable
          style={styles.menuItem}
          onPress={openBookings}
        >
          <View style={styles.iconBox}>
            <Ionicons
              name="calendar-outline"
              size={22}
              color="#00E5A8"
            />
          </View>

          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>
              My Bookings
            </Text>

            <Text style={styles.menuSubtitle}>
              View your charging bookings
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#64748B"
          />
        </Pressable>

        {/* MY REVIEWS */}

        <Pressable
          style={styles.menuItem}
          onPress={() => {
            Alert.alert(
              'Coming Soon',
              'Your reviews section will be available soon.'
            );
          }}
        >
          <View style={styles.iconBox}>
            <Ionicons
              name="star-outline"
              size={22}
              color="#FBBF24"
            />
          </View>

          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>
              My Reviews
            </Text>

            <Text style={styles.menuSubtitle}>
              Manage your station reviews
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#64748B"
          />
        </Pressable>
      </View>

      {/* LOGOUT */}

      <Pressable
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons
          name="log-out-outline"
          size={22}
          color="#EF4444"
        />

        <Text style={styles.logoutText}>
          Logout
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },

  loadingText: {
    color: '#64748B',
    fontSize: 13,
  },

  header: {
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 35,
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor:
      'rgba(0,229,168,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(0,229,168,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  title: {
    color: '#F8FAFC',
    fontSize: 27,
    fontWeight: '900',
  },

  subtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 5,
  },

  /* LOGIN CARD */

  loginCard: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',
  },

  loginIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor:
      'rgba(0,229,168,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  loginTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },

  loginDescription: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },

  loginButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#00E5A8',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  loginButtonText: {
    color: '#020617',
    fontSize: 15,
    fontWeight: '900',
  },

  /* INFO */

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 18,
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.05)',
  },

  infoText: {
    flex: 1,
    color: '#64748B',
    fontSize: 11,
    lineHeight: 17,
  },

  /* LOGGED IN MENU */

  menu: {
    gap: 10,
  },

  menuItem: {
    minHeight: 75,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.06)',
  },

  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor:
      'rgba(0,229,168,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuContent: {
    flex: 1,
    marginLeft: 13,
  },

  menuTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },

  menuSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },

  /* LOGOUT */

  logoutButton: {
    height: 55,
    borderRadius: 15,
    borderWidth: 1,
    borderColor:
      'rgba(239,68,68,0.3)',
    backgroundColor:
      'rgba(239,68,68,0.06)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 30,
  },

  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '800',
  },
});