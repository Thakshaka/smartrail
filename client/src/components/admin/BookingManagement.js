import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress
} from '@mui/material';
import {
  Edit,
  BookOnline,
  CheckCircle,
  Cancel,
  Schedule
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import { useAlert } from '../../contexts/AlertContext';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [editDialog, setEditDialog] = useState({
    open: false,
    booking: null,
    newStatus: ''
  });
  const { showSuccess, showError } = useAlert();

  useEffect(() => {
    loadBookings();
  }, [pagination.page, statusFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getBookings({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter
      });
      setBookings(response.data.bookings);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }));
    } catch (error) {
      console.error('Failed to load bookings:', error);
      showError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleEditStatus = (booking) => {
    setEditDialog({
      open: true,
      booking,
      newStatus: booking.booking_status
    });
  };

  const handleStatusUpdate = async () => {
    try {
      await adminService.updateBookingStatus(editDialog.booking.id, editDialog.newStatus);
      showSuccess('Booking status updated successfully');
      setEditDialog({ open: false, booking: null, newStatus: '' });
      loadBookings();
    } catch (error) {
      console.error('Failed to update booking status:', error);
      showError('Failed to update booking status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle />;
      case 'pending':
        return <Schedule />;
      case 'cancelled':
        return <Cancel />;
      case 'completed':
        return <BookOnline />;
      default:
        return <BookOnline />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Booking Management
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            label="Filter by Status"
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Bookings Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Booking ID</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Train</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>Travel Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      #{booking.booking_reference}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {booking.first_name} {booking.last_name}
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {booking.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {booking.train_name}
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      #{booking.train_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {booking.from_station_name} → {booking.to_station_name}
                  </TableCell>
                  <TableCell>
                    {formatDate(booking.travel_date)}
                  </TableCell>
                  <TableCell>
                    Rs. {booking.total_amount}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(booking.booking_status)}
                      label={booking.booking_status}
                      color={getStatusColor(booking.booking_status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleEditStatus(booking)}
                    >
                      Edit Status
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.pages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Edit Status Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, booking: null, newStatus: '' })}>
        <DialogTitle>Update Booking Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Change status for booking: #{editDialog.booking?.booking_reference}
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={editDialog.newStatus}
              label="Status"
              onChange={(e) => setEditDialog(prev => ({ ...prev, newStatus: e.target.value }))}
            >
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, booking: null, newStatus: '' })}>
            Cancel
          </Button>
          <Button onClick={handleStatusUpdate} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingManagement;
