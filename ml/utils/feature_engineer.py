import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class FeatureEngineer:
    def __init__(self):
        self.feature_names = [
            'hour', 'day_of_week', 'is_weekend', 'is_peak_hour',
            'weather_temp', 'weather_humidity', 'weather_rainfall',
            'distance_to_station', 'current_speed', 'scheduled_time_minutes',
            'train_type_express', 'train_type_intercity', 'historical_avg_delay'
        ]

    def extract_features(self, data):
        """Extract features from input data for ML model"""
        try:
            features = {}
            
            # Time-based features
            time_features = data.get('time_features', {})
            features['hour'] = time_features.get('hour', datetime.now().hour)
            features['day_of_week'] = time_features.get('day_of_week', datetime.now().weekday())
            features['is_weekend'] = int(time_features.get('is_weekend', False))
            features['is_peak_hour'] = int(time_features.get('is_peak_hour', False))
            
            # Weather features
            weather_data = data.get('weather_data', {})
            features['weather_temp'] = weather_data.get('temperature', 28)
            features['weather_humidity'] = weather_data.get('humidity', 75)
            features['weather_rainfall'] = weather_data.get('rainfall', 0)
            
            # Location and movement features
            current_location = data.get('current_location', {})
            features['current_speed'] = current_location.get('speed', 45)
            features['distance_to_station'] = self.calculate_distance_to_station(
                current_location, data.get('station_id')
            )
            
            # Schedule features
            features['scheduled_time_minutes'] = self.convert_time_to_minutes(
                data.get('scheduled_time', '12:00:00')
            )
            
            # Train type features (one-hot encoding)
            train_type = self.get_train_type(data.get('train_id'))
            features['train_type_express'] = int(train_type == 'express')
            features['train_type_intercity'] = int(train_type == 'intercity')
            
            # Historical features
            features['historical_avg_delay'] = self.calculate_historical_delay(
                data.get('historical_data', [])
            )
            
            return features
            
        except Exception as e:
            logger.error(f"Feature extraction error: {e}")
            # Return default features
            return self.get_default_features()

    def get_default_features(self):
        """Get default feature values"""
        now = datetime.now()
        return {
            'hour': now.hour,
            'day_of_week': now.weekday(),
            'is_weekend': int(now.weekday() >= 5),
            'is_peak_hour': int(now.hour in [7, 8, 9, 17, 18, 19]),
            'weather_temp': 28,
            'weather_humidity': 75,
            'weather_rainfall': 0,
            'distance_to_station': 10,
            'current_speed': 45,
            'scheduled_time_minutes': now.hour * 60 + now.minute,
            'train_type_express': 1,
            'train_type_intercity': 0,
            'historical_avg_delay': 5
        }

    def calculate_distance_to_station(self, current_location, station_id):
        """Calculate distance from current location to target station"""
        try:
            if not current_location or 'latitude' not in current_location:
                return 10  # Default distance
            
            # In production, get actual station coordinates from database
            # For now, return simulated distance
            return np.random.uniform(0, 50)
            
        except Exception as e:
            logger.error(f"Distance calculation error: {e}")
            return 10

    def convert_time_to_minutes(self, time_str):
        """Convert time string to minutes since midnight"""
        try:
            if isinstance(time_str, str):
                time_obj = datetime.strptime(time_str, '%H:%M:%S').time()
                return time_obj.hour * 60 + time_obj.minute
            return 0
        except Exception as e:
            logger.error(f"Time conversion error: {e}")
            return 0

    def get_train_type(self, train_id):
        """Get train type from train ID"""
        try:
            # In production, query database for train type
            # For now, simulate based on train ID
            if train_id:
                train_id_str = str(train_id)
                if train_id_str.startswith('10'):
                    return 'express'
                elif train_id_str.startswith('80'):
                    return 'intercity'
                else:
                    return 'local'
            return 'local'
        except Exception as e:
            logger.error(f"Train type lookup error: {e}")
            return 'local'

    def calculate_historical_delay(self, historical_data):
        """Calculate average historical delay"""
        try:
            if not historical_data:
                return 5  # Default average delay
            
            delays = []
            for record in historical_data:
                if 'predicted_time' in record and 'actual_arrival_time' in record:
                    # Calculate delay from historical data
                    # This is simplified - in production, parse actual timestamps
                    delays.append(np.random.normal(5, 3))  # Simulated delay
            
            return np.mean(delays) if delays else 5
            
        except Exception as e:
            logger.error(f"Historical delay calculation error: {e}")
            return 5

    def create_time_features(self, timestamp):
        """Create time-based features from timestamp"""
        if isinstance(timestamp, str):
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        else:
            dt = timestamp
        
        return {
            'hour': dt.hour,
            'day_of_week': dt.weekday(),
            'day_of_month': dt.day,
            'month': dt.month,
            'quarter': (dt.month - 1) // 3 + 1,
            'is_weekend': int(dt.weekday() >= 5),
            'is_peak_hour': int(dt.hour in [7, 8, 9, 17, 18, 19]),
            'is_morning': int(6 <= dt.hour < 12),
            'is_afternoon': int(12 <= dt.hour < 18),
            'is_evening': int(18 <= dt.hour < 22)
        }

    def create_weather_features(self, weather_data):
        """Create weather-based features"""
        if not weather_data:
            return {
                'temp_normalized': 0.5,
                'humidity_normalized': 0.75,
                'rainfall_category': 0,
                'weather_severity': 0
            }
        
        # Normalize temperature (20-40°C range)
        temp_normalized = (weather_data.get('temperature', 28) - 20) / 20
        
        # Normalize humidity (0-100% range)
        humidity_normalized = weather_data.get('humidity', 75) / 100
        
        # Categorize rainfall
        rainfall = weather_data.get('rainfall', 0)
        if rainfall == 0:
            rainfall_category = 0  # No rain
        elif rainfall < 2.5:
            rainfall_category = 1  # Light rain
        elif rainfall < 10:
            rainfall_category = 2  # Moderate rain
        else:
            rainfall_category = 3  # Heavy rain
        
        # Calculate weather severity score
        weather_severity = (
            (rainfall_category * 0.4) +
            (abs(temp_normalized - 0.4) * 0.3) +  # Extreme temperatures
            (humidity_normalized * 0.3)
        )
        
        return {
            'temp_normalized': temp_normalized,
            'humidity_normalized': humidity_normalized,
            'rainfall_category': rainfall_category,
            'weather_severity': min(1.0, weather_severity)
        }

    def create_movement_features(self, tracking_data):
        """Create movement-based features from tracking data"""
        if not tracking_data:
            return {
                'avg_speed': 45,
                'speed_variance': 0,
                'stops_count': 0,
                'acceleration_changes': 0
            }
        
        speeds = [record.get('speed', 0) for record in tracking_data if record.get('speed')]
        
        if not speeds:
            return {
                'avg_speed': 45,
                'speed_variance': 0,
                'stops_count': 0,
                'acceleration_changes': 0
            }
        
        avg_speed = np.mean(speeds)
        speed_variance = np.var(speeds)
        stops_count = sum(1 for speed in speeds if speed < 5)
        
        # Calculate acceleration changes
        acceleration_changes = 0
        for i in range(1, len(speeds)):
            if abs(speeds[i] - speeds[i-1]) > 10:
                acceleration_changes += 1
        
        return {
            'avg_speed': avg_speed,
            'speed_variance': speed_variance,
            'stops_count': stops_count,
            'acceleration_changes': acceleration_changes
        }
