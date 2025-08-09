from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from models.prediction_model import PredictionModel
from utils.data_processor import DataProcessor
from utils.feature_engineer import FeatureEngineer
import json

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize ML components
prediction_model = PredictionModel()
data_processor = DataProcessor()
feature_engineer = FeatureEngineer()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'SmartRail ML Service',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': prediction_model.is_loaded()
    })

@app.route('/predict', methods=['POST'])
def predict_arrival():
    """Predict train arrival time"""
    try:
        data = request.get_json()
        
        # Validate input data
        required_fields = ['train_id', 'station_id']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Extract features
        features = feature_engineer.extract_features(data)
        
        # Make prediction
        prediction = prediction_model.predict(features)
        
        # Calculate confidence score
        confidence = prediction_model.calculate_confidence(features, prediction)
        
        # Determine delay
        scheduled_time = data.get('scheduled_time')
        delay_minutes = 0
        
        if scheduled_time:
            scheduled_dt = datetime.strptime(scheduled_time, '%H:%M:%S')
            predicted_dt = datetime.strptime(prediction['predicted_time'], '%H:%M:%S')
            delay_minutes = (predicted_dt - scheduled_dt).total_seconds() / 60
        
        response = {
            'predicted_time': prediction['predicted_time'],
            'confidence_score': round(confidence, 2),
            'delay_minutes': round(delay_minutes),
            'prediction_method': 'ml_model',
            'factors': prediction.get('factors', []),
            'model_version': prediction_model.get_version(),
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Prediction made for train {data['train_id']}, station {data['station_id']}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({
            'error': 'Prediction failed',
            'message': str(e)
        }), 500

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """Batch prediction for multiple train-station pairs"""
    try:
        data = request.get_json()
        predictions_data = data.get('predictions', [])
        
        if not predictions_data:
            return jsonify({'error': 'No prediction data provided'}), 400
        
        results = []
        
        for pred_data in predictions_data:
            try:
                features = feature_engineer.extract_features(pred_data)
                prediction = prediction_model.predict(features)
                confidence = prediction_model.calculate_confidence(features, prediction)
                
                results.append({
                    'train_id': pred_data['train_id'],
                    'station_id': pred_data['station_id'],
                    'predicted_time': prediction['predicted_time'],
                    'confidence_score': round(confidence, 2),
                    'factors': prediction.get('factors', [])
                })
            except Exception as e:
                logger.error(f"Batch prediction error for train {pred_data.get('train_id')}: {str(e)}")
                results.append({
                    'train_id': pred_data['train_id'],
                    'station_id': pred_data['station_id'],
                    'error': str(e)
                })
        
        return jsonify({
            'predictions': results,
            'total': len(results),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        return jsonify({
            'error': 'Batch prediction failed',
            'message': str(e)
        }), 500

@app.route('/retrain', methods=['POST'])
def retrain_model():
    """Retrain the ML model with new data"""
    try:
        data = request.get_json()
        
        # Get training parameters
        model_type = data.get('model_type', 'random_forest')
        use_recent_data_only = data.get('use_recent_data_only', False)
        
        # Start retraining process
        result = prediction_model.retrain(
            model_type=model_type,
            use_recent_data_only=use_recent_data_only
        )
        
        logger.info(f"Model retrained successfully: {result}")
        
        return jsonify({
            'message': 'Model retrained successfully',
            'model_type': model_type,
            'training_metrics': result.get('metrics', {}),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Retraining error: {str(e)}")
        return jsonify({
            'error': 'Retraining failed',
            'message': str(e)
        }), 500

@app.route('/model/info', methods=['GET'])
def model_info():
    """Get information about the current model"""
    try:
        info = prediction_model.get_model_info()
        return jsonify(info)
    except Exception as e:
        logger.error(f"Model info error: {str(e)}")
        return jsonify({
            'error': 'Failed to get model info',
            'message': str(e)
        }), 500

@app.route('/model/metrics', methods=['GET'])
def model_metrics():
    """Get model performance metrics"""
    try:
        metrics = prediction_model.get_performance_metrics()
        return jsonify(metrics)
    except Exception as e:
        logger.error(f"Model metrics error: {str(e)}")
        return jsonify({
            'error': 'Failed to get model metrics',
            'message': str(e)
        }), 500

@app.route('/data/stats', methods=['GET'])
def data_statistics():
    """Get data statistics for monitoring"""
    try:
        stats = data_processor.get_data_statistics()
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Data stats error: {str(e)}")
        return jsonify({
            'error': 'Failed to get data statistics',
            'message': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))
    
    # Initialize model
    try:
        prediction_model.load_model()
        logger.info("🤖 ML model loaded successfully")
    except Exception as e:
        logger.warning(f"Could not load existing model: {e}")
        logger.info("🔄 Training new model...")
        prediction_model.train_initial_model()
    
    # Start Flask app
    port = int(os.environ.get('ML_SERVICE_PORT', 8000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"🚀 Starting ML service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
