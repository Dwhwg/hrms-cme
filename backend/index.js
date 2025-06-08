const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const net = require('net');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const employeeRoutes = require('./src/routes/employee.routes');
const officeLocationRoutes = require('./src/routes/officeLocation.routes');
const attendanceRoutes = require('./src/routes/attendance.routes');
const workScheduleRoutes = require('./src/routes/work-schedule.routes');
const liveAccountRoutes = require('./src/routes/liveAccountRoutes');

// Import app configuration
const app = require('./src/app');
const { errorHandler } = require('./src/middleware/errorHandler');

const server = http.createServer(app);

// Configure CORS
const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

// Socket.io configuration
const io = socketIo(server, {
    cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
const uploadPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadPath));

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/office-locations', officeLocationRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/work-schedules', workScheduleRoutes);
app.use('/api/live-accounts', liveAccountRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Handle specific error types
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size is too large. Max size is 5MB.'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Error uploading file.'
        });
    }

    // Handle database errors
    if (err.code === '23505') { // Unique violation
        return res.status(409).json({
            success: false,
            message: 'Duplicate entry found.'
        });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // Default error response
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Port availability check
const isPortAvailable = (port) => {
    return new Promise((resolve) => {
        const server = net.createServer()
            .once('error', () => {
                resolve(false);
            })
            .once('listening', () => {
                server.close();
                resolve(true);
            })
            .listen(port);
    });
};

// Server startup
const startServer = async () => {
    try {
        let PORT = process.env.PORT || 5000;
        let isAvailable = await isPortAvailable(PORT);
        
        while (!isAvailable && PORT < 5100) {
            PORT++;
            isAvailable = await isPortAvailable(PORT);
        }
        
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
            console.log(`Upload directory: ${uploadPath}`);
        });

        // Handle server errors
        server.on('error', (error) => {
            console.error('Server error:', error);
            process.exit(1);
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer(); 