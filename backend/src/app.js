const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');
const officeLocationRoutes = require('./routes/officeLocation.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const workScheduleRoutes = require('./routes/work-schedule.routes');
const approvalRoutes = require('./routes/approval.routes');
const liveAccountRoutes = require('./routes/liveAccountRoutes');
const liveScheduleRoutes = require('./routes/liveScheduleRoutes');
const hostAccountAssignmentRoutes = require('./routes/hostAccountAssignment.routes');

const app = express();

// Security middleware
app.use(helmet());

// Configure CORS
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:5000'],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/office-locations', officeLocationRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/work-schedules', workScheduleRoutes);
app.use('/api/approvals', approvalRoutes);

// Temporary test route
app.get('/api/test-live-accounts', (req, res) => {
    console.log('Test route for live accounts hit!');
    res.status(200).json({ message: 'Test route successful' });
});

app.use('/api/live-accounts', liveAccountRoutes);
app.use('/api/live-schedules', liveScheduleRoutes);
app.use('/api/host-account-assignments', hostAccountAssignmentRoutes);

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Error handling
app.use(errorHandler);

// Unhandled error handler
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

module.exports = app; 