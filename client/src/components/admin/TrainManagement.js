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
  CircularProgress
} from '@mui/material';
import {
  Edit,
  Train,
  Build,
  PlayArrow,
  Stop
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import { useAlert } from '../../contexts/AlertContext';

const TrainManagement = () => {
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDialog, setEditDialog] = useState({
    open: false,
    train: null,
    newStatus: ''
  });
  const { showSuccess, showError } = useAlert();

  useEffect(() => {
    loadTrains();
  }, []);

  const loadTrains = async () => {
    try {
      setLoading(true);
      const response = await adminService.getTrains();
      setTrains(response.data.trains);
    } catch (error) {
      console.error('Failed to load trains:', error);
      showError('Failed to load trains');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStatus = (train) => {
    setEditDialog({
      open: true,
      train,
      newStatus: train.status
    });
  };

  const handleStatusUpdate = async () => {
    try {
      await adminService.updateTrainStatus(editDialog.train.id, editDialog.newStatus);
      showSuccess('Train status updated successfully');
      setEditDialog({ open: false, train: null, newStatus: '' });
      loadTrains();
    } catch (error) {
      console.error('Failed to update train status:', error);
      showError('Failed to update train status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'maintenance':
        return 'warning';
      case 'scheduled':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <PlayArrow />;
      case 'inactive':
        return <Stop />;
      case 'maintenance':
        return <Build />;
      case 'scheduled':
        return <Train />;
      default:
        return <Train />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'express':
        return 'error';
      case 'intercity':
        return 'warning';
      case 'local':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Train Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Train />}
          onClick={loadTrains}
        >
          Refresh
        </Button>
      </Box>

      {/* Trains Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Train Number</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Current Station</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : trains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                  No trains found
                </TableCell>
              </TableRow>
            ) : (
              trains.map((train) => (
                <TableRow key={train.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      #{train.number}
                    </Typography>
                  </TableCell>
                  <TableCell>{train.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={train.type}
                      color={getTypeColor(train.type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{train.capacity} passengers</TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(train.status)}
                      label={train.status}
                      color={getStatusColor(train.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {train.current_station_name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleEditStatus(train)}
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

      {/* Edit Status Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, train: null, newStatus: '' })}>
        <DialogTitle>Update Train Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Change status for: {editDialog.train?.name} (#{editDialog.train?.number})
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={editDialog.newStatus}
              label="Status"
              onChange={(e) => setEditDialog(prev => ({ ...prev, newStatus: e.target.value }))}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, train: null, newStatus: '' })}>
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

export default TrainManagement;
