import React, { useState } from 'react';
import { View, Button, Text, StyleSheet, Platform, SafeAreaView, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import Roam from 'roam-reactnative';
import { roam } from './services';

const App = () => {
  const [userId, setUserId] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('Not requested');
  const [trackingStatus, setTrackingStatus] = useState('Not started');
  const [lastLocation, setLastLocation] = useState(null);

  const setupForegroundNotification = (enabled) => {
    if (Platform.OS === 'android') {
      Roam.setForegroundNotification(
        enabled,
        'Roam Example',
        'Tap to open',
        'mipmap/ic_launcher',
        'com.roamreactnativeexampleselftracking.MainActivity',
        'com.roamreactnativeexampleselftracking.LocationService'
      );
    }
  };

  const onCreateUserPress = () => {
    roam.createTestUser().then((response) => {
      setUserId(response.userId);
      console.log('User Created: ', response.userId);
    });
  };

  const requestPermissions = () => {
    Roam.checkLocationPermission((locationStatus) => {
      if (locationStatus !== 'GRANTED') {
        Roam.requestLocationPermission();
      }

      if (Platform.OS === 'android' && Platform.Version >= 29) {
        Roam.checkBackgroundLocationPermission((backgroundStatus) => {
          if (backgroundStatus !== 'GRANTED') {
            Roam.requestBackgroundLocationPermission();
          }
          checkFinalPermissionStatus();
        });
      } else {
        checkFinalPermissionStatus();
      }
    });
  };

  const checkFinalPermissionStatus = () => {
    Roam.checkLocationPermission((locationStatus) => {
      if (Platform.OS === 'android' && Platform.Version >= 29) {
        Roam.checkBackgroundLocationPermission((backgroundStatus) => {
          setPermissionStatus(locationStatus === 'GRANTED' && backgroundStatus === 'GRANTED' ? 'Granted' : 'Denied');
        });
      } else {
        setPermissionStatus(locationStatus === 'GRANTED' ? 'Granted' : 'Denied');
      }
    });
  };

  const startTracking = () => {
    console.log('userid', userId);

    if (!userId) {
      console.log("User ID not found, can't start tracking.");
      return;
    }

    setupForegroundNotification(true);

    Roam.checkLocationPermission((status) => {
      if (status === 'GRANTED') {
        Roam.startListener('location', (locationData) => {
          if (locationData.error) {
            console.error('Error in location listener:', locationData.error);
            setTrackingStatus('Error');
          } else {
            console.log('Location update received:', JSON.stringify(locationData));
            const parsedLocation = locationData[0];
            setLastLocation(parsedLocation);
          }
        });

        Roam.startTrackingDistanceInterval(10, 10, Roam.DesiredAccuracy.HIGH);
        setTrackingStatus('Started');
      } else {
        console.log('Location permission not granted. Cannot start tracking.');
        setTrackingStatus('Permission Denied');
      }
    });
  };

  const stopTracking = () => {
    console.log('Stopping tracking...');
    Roam.stopTracking();
    Roam.stopListener('location');
    setupForegroundNotification(false);
    setTrackingStatus('Not started');
    setLastLocation(null);
  };

  const renderButton = (title, onPress, disabled, backgroundColor) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: disabled ? '#ccc' : backgroundColor },
      ]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Roam Location Tracker</Text>

        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Permission Status:
            <Text style={styles.statusValue}> {permissionStatus}</Text>
          </Text>
          <Text style={styles.statusText}>
            Tracking Status:
            <Text style={styles.statusValue}> {trackingStatus}</Text>
          </Text>
        </View>

        {lastLocation && (
          <View style={styles.locationContainer}>
            <Text style={styles.locationTitle}>Last Received Location:</Text>
            <Text style={styles.locationText}>
              Latitude: {lastLocation.location.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Longitude: {lastLocation.location.longitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Accuracy: {lastLocation.location.accuracy.toFixed(2)} meters
            </Text>
            <Text style={styles.locationText}>
              Altitude: {lastLocation.location.altitude.toFixed(2)} meters
            </Text>
            <Text style={styles.locationText}>
              Speed: {lastLocation.location.speed} m/s
            </Text>
            <Text style={styles.locationText}>Activity: {lastLocation.activity}</Text>
            <Text style={styles.locationText}>
              Timestamp: {new Date(lastLocation.recordedAt).toLocaleString()}
            </Text>
            <Text style={styles.locationText}>
              Timezone: {lastLocation.timezone}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {renderButton(
            'Request Permissions',
            requestPermissions,
            permissionStatus === 'Granted',
            '#007BFF'
          )}
          {renderButton(
            'Create User',
            onCreateUserPress,
            userId !== null,
            '#28a745'
          )}
          {renderButton(
            'Start Tracking',
            startTracking,
            permissionStatus !== 'Granted' || trackingStatus === 'Started' || !userId,
            '#FFC107'
          )}
          {renderButton(
            'Stop Tracking',
            stopTracking,
            trackingStatus !== 'Started',
            '#DC3545'
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  statusValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  locationContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2E7D32',
  },
  locationText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#1B5E20',
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default App;
