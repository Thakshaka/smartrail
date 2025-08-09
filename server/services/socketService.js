const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
  }

  initialize(io) {
    this.io = io;
    
    // Authentication middleware for socket connections
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Handle socket connections
    io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('🔌 Socket.io service initialized');
  }

  handleConnection(socket) {
    const userId = socket.userId;
    
    // Store user connection
    this.connectedUsers.set(userId, socket.id);
    this.userSockets.set(socket.id, userId);
    
    logger.info(`👤 User ${userId} connected via socket ${socket.id}`);

    // Join user to their personal room
    socket.join(`user_${userId}`);

    // Handle train tracking subscription
    socket.on('subscribe_train_tracking', (trainId) => {
      socket.join(`train_${trainId}`);
      logger.debug(`User ${userId} subscribed to train ${trainId} tracking`);
    });

    // Handle train tracking unsubscription
    socket.on('unsubscribe_train_tracking', (trainId) => {
      socket.leave(`train_${trainId}`);
      logger.debug(`User ${userId} unsubscribed from train ${trainId} tracking`);
    });

    // Handle station alerts subscription
    socket.on('subscribe_station_alerts', (stationId) => {
      socket.join(`station_${stationId}`);
      logger.debug(`User ${userId} subscribed to station ${stationId} alerts`);
    });

    // Handle station alerts unsubscription
    socket.on('unsubscribe_station_alerts', (stationId) => {
      socket.leave(`station_${stationId}`);
      logger.debug(`User ${userId} unsubscribed from station ${stationId} alerts`);
    });

    // Handle booking updates subscription
    socket.on('subscribe_booking_updates', (bookingId) => {
      socket.join(`booking_${bookingId}`);
      logger.debug(`User ${userId} subscribed to booking ${bookingId} updates`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to SmartRail real-time service',
      userId: userId,
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnection(socket) {
    const userId = this.userSockets.get(socket.id);
    
    if (userId) {
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socket.id);
      logger.info(`👤 User ${userId} disconnected from socket ${socket.id}`);
    }
  }

  // Broadcast train location update
  broadcastTrainUpdate(trainId, locationData) {
    if (this.io) {
      this.io.to(`train_${trainId}`).emit('train_location_update', {
        trainId,
        location: locationData,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Broadcast train delay alert
  broadcastTrainDelay(trainId, delayInfo) {
    if (this.io) {
      this.io.to(`train_${trainId}`).emit('train_delay_alert', {
        trainId,
        delay: delayInfo,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Broadcast station announcement
  broadcastStationAnnouncement(stationId, announcement) {
    if (this.io) {
      this.io.to(`station_${stationId}`).emit('station_announcement', {
        stationId,
        announcement,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Send booking update to specific user
  sendBookingUpdate(userId, bookingData) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit('booking_update', {
        booking: bookingData,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Send notification to specific user
  sendUserNotification(userId, notification) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit('notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Broadcast system-wide announcement
  broadcastSystemAnnouncement(announcement) {
    if (this.io) {
      this.io.emit('system_announcement', {
        announcement,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Check if user is connected
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }
}

// Create singleton instance
const socketService = new SocketService();

module.exports = socketService;
