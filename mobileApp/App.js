import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, Button, Alert, ScrollView, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

export default function App() {
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [itemType, setItemType] = useState('light');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [offers, setOffers] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    calculateEstimatedPrice();
  }, [pickupCoords, dropCoords, itemType]);

  const fetchOffers = async () => {
    try {
      // Replace 'localhost' with your machine's IP address or emulator loopback address
      const response = await fetch('http://192.168.80.99:3000/api/customer/offers');
      const json = await response.json();
      if (json.success) {
        setOffers(json.offers.map(o => o.description));
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const calculateEstimatedPrice = () => {
    if (!pickupCoords || !dropCoords) {
      setEstimatedPrice(0);
      return;
    }
    const distanceKm = getDistanceFromLatLonInKm(
      pickupCoords.latitude,
      pickupCoords.longitude,
      dropCoords.latitude,
      dropCoords.longitude
    );
    let basePrice = 0;
    switch (itemType) {
      case 'light':
        basePrice = 20;
        break;
      case 'heavy':
        basePrice = 40;
        break;
      case 'vehicle':
        basePrice = 100;
        break;
    }
    const price = basePrice + distanceKm * 80;
    setEstimatedPrice(price.toFixed(2));
  };

  // Haversine formula to calculate distance between two lat/lon points
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event && event.type === 'set' && selectedDate) {
      setDate(selectedDate);
    }
  };

  const submitBooking = async () => {
    if (!pickupCoords || !dropCoords) {
      Alert.alert('Error', 'Please select both pickup and drop locations on the map.');
      return;
    }
    if (!name || !email || !phone) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    const bookingData = {
      pickup: pickup,
      drop: drop,
      name,
      email,
      phone,
      date: date.toISOString(),
      itemType,
      vehicleDetails,
      paymentMethod,
    };
    try {
      const token = ''; // TODO: get token from secure storage or login flow
      const response = await fetch('http://192.168.80.99:3000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData),
      });
      const json = await response.json();
      if (json.success) {
        Alert.alert('Success', 'Booking successful!');
        resetForm();
      } else {
        Alert.alert('Error', json.message || 'Booking failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error: ' + error.message);
    }
  };

  const resetForm = () => {
    setPickup('');
    setDrop('');
    setPickupCoords(null);
    setDropCoords(null);
    setName('');
    setEmail('');
    setPhone('');
    setDate(new Date());
    setItemType('light');
    setVehicleDetails('');
    setPaymentMethod('upi');
    setEstimatedPrice(0);
  };

  const onMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    if (!pickupCoords) {
      setPickupCoords(coordinate);
      setPickup(`Lat: ${coordinate.latitude.toFixed(4)}, Lng: ${coordinate.longitude.toFixed(4)}`);
    } else if (!dropCoords) {
      setDropCoords(coordinate);
      setDrop(`Lat: ${coordinate.latitude.toFixed(4)}, Lng: ${coordinate.longitude.toFixed(4)}`);
    } else {
      // Reset if both are set
      setPickupCoords(coordinate);
      setPickup(`Lat: ${coordinate.latitude.toFixed(4)}, Lng: ${coordinate.longitude.toFixed(4)}`);
      setDropCoords(null);
      setDrop('');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Book Your Ride</Text>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 20.5937,
          longitude: 78.9629,
          latitudeDelta: 10,
          longitudeDelta: 10,
        }}
        onPress={onMapPress}
      >
        {pickupCoords && <Marker coordinate={pickupCoords} pinColor="green" title="Pickup" />}
        {dropCoords && <Marker coordinate={dropCoords} pinColor="red" title="Drop" />}
        {pickupCoords && dropCoords && (
          <Polyline coordinates={[pickupCoords, dropCoords]} strokeColor="#6366f1" strokeWidth={4} />
        )}
      </MapView>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Pickup Location"
          value={pickup}
          onChangeText={setPickup}
        />
        <TextInput
          style={styles.input}
          placeholder="Drop Location"
          value={drop}
          onChangeText={setDrop}
        />
        <TextInput
          style={styles.input}
          placeholder="Your Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <View>
          <Button title="Select Date & Time" onPress={() => setShowDatePicker(true)} />
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={date}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            if (event.type === 'dismissed') {
              setShowDatePicker(false);
              return;
            }
            if (event.type === 'set' && selectedDate) {
              setDate(selectedDate);
            }
            setShowDatePicker(false);
          }}
          style={{ width: '100%' }}
          is24Hour={true}
          testID="dateTimePicker"
        />
      )}
      {Platform.OS === 'ios' && (
        <DateTimePicker
          value={date}
          mode="datetime"
          display="inline"
          onChange={onDateChange}
          style={{ width: '100%' }}
        />
      )}
        </View>
        <Text style={styles.label}>Item Type</Text>
        <Picker
          selectedValue={itemType}
          onValueChange={(itemValue) => setItemType(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Light Items" value="light" />
          <Picker.Item label="Heavy Items" value="heavy" />
          <Picker.Item label="Vehicle Moving" value="vehicle" />
        </Picker>
        <TextInput
          style={styles.input}
          placeholder="Vehicle Details (if applicable)"
          value={vehicleDetails}
          onChangeText={setVehicleDetails}
        />
        <Text style={styles.label}>Payment Method</Text>
        <Picker
          selectedValue={paymentMethod}
          onValueChange={(itemValue) => setPaymentMethod(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="UPI" value="upi" />
          <Picker.Item label="Paytm" value="paytm" />
          <Picker.Item label="Google Pay" value="googlepay" />
          <Picker.Item label="Credit/Debit Card" value="card" />
          <Picker.Item label="Net Banking" value="netbanking" />
        </Picker>
        <Text style={styles.estimatedPrice}>Estimated Price: ₹{estimatedPrice}</Text>
        <Text style={styles.label}>Available Offers:</Text>
        {offers.map((offer, index) => (
          <Text key={index} style={styles.offerItem}>- {offer}</Text>
        ))}
        <Button title="Book Now" onPress={submitBooking} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#111827',
    textAlign: 'center',
  },
  map: {
    height: 300,
    marginBottom: 20,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#374151',
  },
  picker: {
    marginBottom: 12,
  },
  estimatedPrice: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 12,
    color: '#4b5563',
  },
  offerItem: {
    color: '#10b981',
    marginBottom: 4,
  },
});
