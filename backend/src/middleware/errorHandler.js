const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = [];

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        errors = err.errors || [];
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
    } else if (err.code === '23505') { // PostgreSQL unique violation
        statusCode = 409;
        message = 'Duplicate entry';
    } else if (err.code === '23503') { // PostgreSQL foreign key violation
        statusCode = 400;
        message = 'Referenced record does not exist';
    } else if (err.code === '22P02') { // PostgreSQL invalid text representation
        statusCode = 400;
        message = 'Invalid input syntax';
    } else if (err.code === '42703') { // PostgreSQL undefined column
        statusCode = 400;
        message = 'Invalid column name';
    } else if (err.code === '42P01') { // PostgreSQL undefined table
        statusCode = 500;
        message = 'Database configuration error';
    }

    // Handle express-validator errors
    if (err.array) {
        statusCode = 400;
        message = 'Validation Error';
        errors = err.array();
    }

    // Log error details in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error Stack:', err.stack);
        console.error('Error Details:', {
            name: err.name,
            code: err.code,
            message: err.message,
            errors: errors
        });
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        errors: errors.length > 0 ? errors : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = { errorHandler }; 