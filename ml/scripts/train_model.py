#!/usr/bin/env python3
"""
SmartRail ML Model Training Script
Trains the arrival prediction model using historical data
"""

import os
import sys
import logging
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.prediction_model import PredictionModel
from utils.data_processor import DataProcessor
from utils.feature_engineer import FeatureEngineer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def main():
    """Main training function"""
    try:
        logger.info("🚂 Starting SmartRail ML model training...")
        
        # Initialize components
        model = PredictionModel()
        data_processor = DataProcessor()
        feature_engineer = FeatureEngineer()
        
        # Load training data
        logger.info("📊 Loading training data...")
        df = data_processor.load_training_data(days_back=90)
        
        if df.empty:
            logger.warning("No training data found, generating synthetic data...")
            X, y = model.generate_synthetic_data(2000)
            feature_names = feature_engineer.feature_names
        else:
            logger.info(f"Loaded {len(df)} training records")
            
            # Preprocess data
            logger.info("🔧 Preprocessing data...")
            df_processed = data_processor.preprocess_data(df)
            
            # Extract features
            logger.info("⚙️ Engineering features...")
            features_list = []
            targets = []
            
            for _, row in df_processed.iterrows():
                try:
                    # Convert row to feature format
                    data_dict = {
                        'train_id': row['train_id'],
                        'station_id': row['station_id'],
                        'current_location': {
                            'latitude': row['latitude'],
                            'longitude': row['longitude'],
                            'speed': row['speed']
                        },
                        'time_features': {
                            'hour': row['hour'],
                            'day_of_week': row['day_of_week'],
                            'is_weekend': row.get('is_weekend', False),
                            'is_peak_hour': row.get('is_peak_hour', False)
                        },
                        'weather_data': {
                            'temperature': 28,  # Default values
                            'humidity': 75,
                            'rainfall': 0
                        }
                    }
                    
                    features = feature_engineer.extract_features(data_dict)
                    features_list.append([features[name] for name in feature_engineer.feature_names])
                    targets.append(row.get('actual_delay_minutes', 0))
                    
                except Exception as e:
                    logger.warning(f"Skipping row due to feature extraction error: {e}")
                    continue
            
            if not features_list:
                logger.warning("No valid features extracted, using synthetic data...")
                X, y = model.generate_synthetic_data(2000)
            else:
                X = np.array(features_list)
                y = np.array(targets)
                logger.info(f"Extracted features for {len(X)} samples")
        
        # Train different model types and compare
        model_types = ['random_forest', 'gradient_boosting', 'linear_regression']
        best_model = None
        best_score = float('inf')
        
        for model_type in model_types:
            logger.info(f"🤖 Training {model_type} model...")
            
            try:
                result = model.train(X, y, model_type)
                mae = result['metrics']['mae']
                
                logger.info(f"✅ {model_type} - MAE: {mae:.2f}, R²: {result['metrics']['r2']:.3f}")
                
                if mae < best_score:
                    best_score = mae
                    best_model = model_type
                    
            except Exception as e:
                logger.error(f"❌ Failed to train {model_type}: {e}")
        
        # Train final model with best performing algorithm
        if best_model:
            logger.info(f"🏆 Best model: {best_model} (MAE: {best_score:.2f})")
            logger.info("🔄 Training final model...")
            
            final_result = model.train(X, y, best_model)
            
            logger.info("💾 Saving trained model...")
            model.save_model()
            
            # Print final metrics
            metrics = final_result['metrics']
            logger.info("📈 Final Model Performance:")
            logger.info(f"   - Mean Absolute Error: {metrics['mae']:.2f} minutes")
            logger.info(f"   - Root Mean Square Error: {metrics['rmse']:.2f} minutes")
            logger.info(f"   - R² Score: {metrics['r2']:.3f}")
            logger.info(f"   - Cross-validation MAE: {metrics['cv_mae']:.2f} ± {metrics['cv_std']:.2f}")
            
            logger.info("🎉 Model training completed successfully!")
            
        else:
            logger.error("❌ No model could be trained successfully")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"❌ Training failed: {e}")
        sys.exit(1)

def evaluate_model():
    """Evaluate the trained model"""
    try:
        logger.info("📊 Evaluating model performance...")
        
        model = PredictionModel()
        if not model.load_model():
            logger.error("No trained model found")
            return
        
        # Get model info
        info = model.get_model_info()
        metrics = model.get_performance_metrics()
        
        logger.info("📋 Model Information:")
        logger.info(f"   - Type: {info['model_type']}")
        logger.info(f"   - Version: {info['version']}")
        logger.info(f"   - Features: {info['feature_count']}")
        
        logger.info("📈 Performance Metrics:")
        logger.info(f"   - MAE: {metrics['mae']} minutes")
        logger.info(f"   - RMSE: {metrics['rmse']} minutes")
        logger.info(f"   - R² Score: {metrics['r2_score']}")
        logger.info(f"   - Accuracy (±5min): {metrics['accuracy_within_5min']*100:.1f}%")
        logger.info(f"   - Accuracy (±10min): {metrics['accuracy_within_10min']*100:.1f}%")
        
    except Exception as e:
        logger.error(f"Evaluation failed: {e}")

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))
    
    # Check command line arguments
    if len(sys.argv) > 1 and sys.argv[1] == 'evaluate':
        evaluate_model()
    else:
        main()
