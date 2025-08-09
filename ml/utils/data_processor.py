import pandas as pd
import numpy as np
import psycopg2
import os
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class DataProcessor:
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'smartrail_db'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'password')
        }

    def get_connection(self):
        """Get database connection"""
        try:
            return psycopg2.connect(**self.db_config)
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            raise e

    def load_training_data(self, days_back=90):
        """Load training data from database"""
        try:
            conn = self.get_connection()
            
            query = """
            SELECT 
                td.train_id,
                td.station_id,
                td.latitude,
                td.longitude,
                td.speed,
                td.heading,
                td.estimated_arrival,
                td.accuracy,
                td.timestamp,
                t.type as train_type,
                t.capacity,
                s.latitude as station_lat,
                s.longitude as station_lon,
                p.predicted_time,
                p.actual_arrival_time,
                p.confidence_score,
                EXTRACT(HOUR FROM td.timestamp) as hour,
                EXTRACT(DOW FROM td.timestamp) as day_of_week,
                EXTRACT(EPOCH FROM (p.actual_arrival_time - p.predicted_time))/60 as actual_delay_minutes
            FROM tracking_data td
            JOIN trains t ON td.train_id = t.id
            JOIN stations s ON td.station_id = s.id
            LEFT JOIN predictions p ON td.train_id = p.train_id 
                AND td.station_id = p.station_id 
                AND DATE(td.timestamp) = DATE(p.created_at)
            WHERE td.timestamp > NOW() - INTERVAL '%s days'
            AND p.actual_arrival_time IS NOT NULL
            ORDER BY td.timestamp DESC
            """ % days_back
            
            df = pd.read_sql_query(query, conn)
            conn.close()
            
            logger.info(f"Loaded {len(df)} training records from database")
            return df
            
        except Exception as e:
            logger.error(f"Error loading training data: {e}")
            return pd.DataFrame()

    def load_real_time_data(self, train_id, hours_back=2):
        """Load recent tracking data for a specific train"""
        try:
            conn = self.get_connection()
            
            query = """
            SELECT 
                td.*,
                t.type as train_type,
                t.capacity,
                s.name as station_name,
                s.latitude as station_lat,
                s.longitude as station_lon
            FROM tracking_data td
            JOIN trains t ON td.train_id = t.id
            LEFT JOIN stations s ON td.station_id = s.id
            WHERE td.train_id = %s 
            AND td.timestamp > NOW() - INTERVAL '%s hours'
            ORDER BY td.timestamp DESC
            """ % (train_id, hours_back)
            
            df = pd.read_sql_query(query, conn)
            conn.close()
            
            return df
            
        except Exception as e:
            logger.error(f"Error loading real-time data: {e}")
            return pd.DataFrame()

    def preprocess_data(self, df):
        """Preprocess data for ML model"""
        try:
            if df.empty:
                return df
            
            # Handle missing values
            df = df.fillna({
                'speed': df['speed'].median() if 'speed' in df else 45,
                'accuracy': df['accuracy'].median() if 'accuracy' in df else 10,
                'weather_temp': 28,
                'weather_humidity': 75,
                'weather_rainfall': 0
            })
            
            # Create derived features
            df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
            df['is_peak_hour'] = df['hour'].apply(lambda x: int(x in [7, 8, 9, 17, 18, 19]))
            
            # Train type encoding
            df['train_type_express'] = (df['train_type'] == 'express').astype(int)
            df['train_type_intercity'] = (df['train_type'] == 'intercity').astype(int)
            
            # Calculate distance features
            if 'latitude' in df.columns and 'station_lat' in df.columns:
                df['distance_to_station'] = self.calculate_distance(
                    df['latitude'], df['longitude'],
                    df['station_lat'], df['station_lon']
                )
            else:
                df['distance_to_station'] = 10  # Default distance
            
            # Time-based features
            if 'timestamp' in df.columns:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                df['hour'] = df['timestamp'].dt.hour
                df['day_of_week'] = df['timestamp'].dt.dayofweek
                df['month'] = df['timestamp'].dt.month
            
            # Remove outliers
            df = self.remove_outliers(df)
            
            logger.info(f"Preprocessed {len(df)} records")
            return df
            
        except Exception as e:
            logger.error(f"Data preprocessing error: {e}")
            return df

    def calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two points using Haversine formula"""
        try:
            # Convert to radians
            lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
            
            # Haversine formula
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
            c = 2 * np.arcsin(np.sqrt(a))
            
            # Earth's radius in kilometers
            r = 6371
            
            return c * r
            
        except Exception as e:
            logger.error(f"Distance calculation error: {e}")
            return 10  # Default distance

    def remove_outliers(self, df, columns=None):
        """Remove outliers using IQR method"""
        try:
            if columns is None:
                columns = ['speed', 'actual_delay_minutes', 'distance_to_station']
            
            for column in columns:
                if column in df.columns:
                    Q1 = df[column].quantile(0.25)
                    Q3 = df[column].quantile(0.75)
                    IQR = Q3 - Q1
                    
                    # Define outlier bounds
                    lower_bound = Q1 - 1.5 * IQR
                    upper_bound = Q3 + 1.5 * IQR
                    
                    # Remove outliers
                    df = df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]
            
            return df
            
        except Exception as e:
            logger.error(f"Outlier removal error: {e}")
            return df

    def create_lag_features(self, df, columns, lags=[1, 2, 3]):
        """Create lag features for time series data"""
        try:
            df_sorted = df.sort_values(['train_id', 'timestamp'])
            
            for column in columns:
                if column in df_sorted.columns:
                    for lag in lags:
                        df_sorted[f'{column}_lag_{lag}'] = df_sorted.groupby('train_id')[column].shift(lag)
            
            return df_sorted
            
        except Exception as e:
            logger.error(f"Lag feature creation error: {e}")
            return df

    def create_rolling_features(self, df, columns, windows=[3, 5, 10]):
        """Create rolling window features"""
        try:
            df_sorted = df.sort_values(['train_id', 'timestamp'])
            
            for column in columns:
                if column in df_sorted.columns:
                    for window in windows:
                        df_sorted[f'{column}_rolling_mean_{window}'] = (
                            df_sorted.groupby('train_id')[column]
                            .rolling(window=window, min_periods=1)
                            .mean()
                            .reset_index(0, drop=True)
                        )
                        
                        df_sorted[f'{column}_rolling_std_{window}'] = (
                            df_sorted.groupby('train_id')[column]
                            .rolling(window=window, min_periods=1)
                            .std()
                            .reset_index(0, drop=True)
                        )
            
            return df_sorted
            
        except Exception as e:
            logger.error(f"Rolling feature creation error: {e}")
            return df

    def get_data_statistics(self):
        """Get data statistics for monitoring"""
        try:
            conn = self.get_connection()
            
            # Get basic statistics
            stats_query = """
            SELECT 
                COUNT(*) as total_tracking_records,
                COUNT(DISTINCT train_id) as unique_trains,
                COUNT(DISTINCT station_id) as unique_stations,
                MIN(timestamp) as earliest_record,
                MAX(timestamp) as latest_record
            FROM tracking_data
            WHERE timestamp > NOW() - INTERVAL '30 days'
            """
            
            cursor = conn.cursor()
            cursor.execute(stats_query)
            basic_stats = cursor.fetchone()
            
            # Get prediction accuracy
            accuracy_query = """
            SELECT 
                COUNT(*) as total_predictions,
                AVG(confidence_score) as avg_confidence,
                AVG(ABS(EXTRACT(EPOCH FROM (actual_arrival_time - predicted_time))/60)) as avg_error_minutes
            FROM predictions 
            WHERE actual_arrival_time IS NOT NULL 
            AND created_at > NOW() - INTERVAL '7 days'
            """
            
            cursor.execute(accuracy_query)
            accuracy_stats = cursor.fetchone()
            
            conn.close()
            
            return {
                'total_tracking_records': basic_stats[0],
                'unique_trains': basic_stats[1],
                'unique_stations': basic_stats[2],
                'earliest_record': basic_stats[3].isoformat() if basic_stats[3] else None,
                'latest_record': basic_stats[4].isoformat() if basic_stats[4] else None,
                'total_predictions': accuracy_stats[0] if accuracy_stats[0] else 0,
                'avg_confidence': float(accuracy_stats[1]) if accuracy_stats[1] else 0,
                'avg_error_minutes': float(accuracy_stats[2]) if accuracy_stats[2] else 0,
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting data statistics: {e}")
            return {
                'error': str(e),
                'last_updated': datetime.now().isoformat()
            }
