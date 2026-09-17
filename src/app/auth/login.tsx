import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authService from '../../services/authService';

export default function LoginScreen() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(
    'login'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [name, setName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');

    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.login(
        email.trim(),
        password
      );

      console.log('🔐 Login response:', result);

      if (result.success && result.data) {
        await AsyncStorage.setItem(
          'token',
          result.data.token
        );

        console.log('✅ Login successful');

        router.replace('/');
      } else {
        setError(
          result.message || 'Login failed.'
        );
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);

      setError(
        err?.response?.data?.message ||
          'Network error. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setError('');

    if (!name || !email || !password) {
      setError('Please fill all fields.');
      return;
    }

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters.'
      );
      return;
    }

    setLoading(true);

    try {
      const result = await authService.signup({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      console.log('📝 Signup response:', result);

      if (result.success) {
        if (
          result.data?.requiresVerification
        ) {
          router.push({
            pathname: '/auth/verify-otp',
            params: {
              email: email.trim(),
            },
          });
        } else {
          setActiveTab('login');
          setPassword('');
          setName('');

          setError(
            'Account created successfully. Please login.'
          );
        }
      } else {
        setError(
          result.message || 'Signup failed.'
        );
      }
    } catch (err: any) {
      console.error('❌ Signup error:', err);

      setError(
        err?.response?.data?.message ||
          'Network error. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    setError('Google signup coming soon.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>
              ⚡
            </Text>
          </View>

          <Text style={styles.brandName}>
            StayNearEv ✨
          </Text>

          <Text style={styles.tagline}>
            Charge closer, drive farther.
          </Text>
        </View>

        {/* Main Card */}
        <View style={styles.card}>

          {/* Tabs */}
          <View style={styles.tabs}>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'login' &&
                  styles.activeTab,
              ]}
              onPress={() => {
                setActiveTab('login');
                setError('');
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'login' &&
                    styles.activeTabText,
                ]}
              >
                Login
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.tab,
                activeTab === 'signup' &&
                  styles.activeTab,
              ]}
              onPress={() => {
                setActiveTab('signup');
                setError('');
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'signup' &&
                    styles.activeTabText,
                ]}
              >
                Sign Up
              </Text>
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.form}>

            {activeTab === 'login' ? (
              <>
                <Text style={styles.heading}>
                  Welcome Back! 👋
                </Text>

                <Text style={styles.description}>
                  Sign in to access your account
                </Text>

                {/* Email */}
                <Text style={styles.label}>
                  Email
                </Text>

                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {/* Password */}
                <Text style={styles.label}>
                  Password
                </Text>

                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#999"
                  secureTextEntry
                />

                {/* Error */}
                {error !== '' && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                      {error}
                    </Text>
                  </View>
                )}

                {/* Login */}
                <Pressable
                  style={[
                    styles.loginButton,
                    loading &&
                      styles.disabledButton,
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Login
                    </Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.heading}>
                  Create Account 🚀
                </Text>

                <Text style={styles.description}>
                  Join us and start your journey
                </Text>

                {/* Name */}
                <Text style={styles.label}>
                  Name
                </Text>

                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor="#999"
                />

                {/* Email */}
                <Text style={styles.label}>
                  Email
                </Text>

                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {/* Password */}
                <Text style={styles.label}>
                  Password
                </Text>

                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min 6 characters"
                  placeholderTextColor="#999"
                  secureTextEntry
                />

                {/* Error */}
                {error !== '' && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                      {error}
                    </Text>
                  </View>
                )}

                {/* Signup */}
                <Pressable
                  style={[
                    styles.signupButton,
                    loading &&
                      styles.disabledButton,
                  ]}
                  onPress={handleSignup}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Sign Up
                    </Text>
                  )}
                </Pressable>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.divider} />

                  <Text style={styles.orText}>
                    OR
                  </Text>

                  <View style={styles.divider} />
                </View>

                {/* Google */}
                <Pressable
                  style={styles.googleButton}
                  onPress={handleGoogle}
                  disabled={loading}
                >
                  <Text style={styles.googleIcon}>
                    G
                  </Text>

                  <Text style={styles.googleText}>
                    Sign up with Google
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {activeTab === 'login'
                ? "Don't have an account? "
                : 'Already have an account? '}

              <Text
                style={styles.footerLink}
                onPress={() => {
                  setActiveTab(
                    activeTab === 'login'
                      ? 'signup'
                      : 'login'
                  );
                  setError('');
                }}
              >
                {activeTab === 'login'
                  ? 'Sign up now'
                  : 'Login here'}
              </Text>
            </Text>
          </View>
        </View>

        <Text style={styles.copyright}>
          © 2025 StayNearBy. Charge closer,
          drive farther.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#2563eb',
  },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },

  brand: {
    alignItems: 'center',
    marginBottom: 25,
  },

  logo: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  logoText: {
    fontSize: 35,
  },

  brandName: {
    fontSize: 34,
    fontWeight: 'bold',
    color: 'white',
  },

  tagline: {
    marginTop: 5,
    fontSize: 16,
    color: '#dbeafe',
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 25,
    overflow: 'hidden',
  },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },

  activeTab: {
    borderBottomWidth: 4,
    borderBottomColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },

  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },

  activeTabText: {
    color: '#2563eb',
  },

  form: {
    padding: 25,
  },

  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },

  description: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 5,
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
  },

  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
  },

  errorText: {
    color: '#b91c1c',
    fontSize: 14,
  },

  loginButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },

  signupButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 20,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },

  orText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },

  googleButton: {
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
  },

  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },

  footer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    alignItems: 'center',
  },

  footerText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },

  footerLink: {
    color: '#2563eb',
    fontWeight: 'bold',
  },

  copyright: {
    textAlign: 'center',
    color: '#dbeafe',
    fontSize: 12,
    marginTop: 20,
  },
});