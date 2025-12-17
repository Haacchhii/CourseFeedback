import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  Paper,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle,
  Info,
  Warning,
  Error,
  Delete,
  DoneAll
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const NotificationBell = ({ userId }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return;
    
    try {
      const response = await axios.get(`${API_URL}/notifications`, {
        params: { user_id: userId, limit: 20 }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!userId) return;
    
    try {
      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        params: { user_id: userId }
      });
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    if (userId) {
      fetchNotifications();
      fetchUnreadCount();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [userId]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications(); // Refresh on open
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.post(
        `${API_URL}/notifications/${notificationId}/mark-read`,
        null,
        { params: { user_id: userId } }
      );
      // Update local state
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.post(
        `${API_URL}/notifications/mark-all-read`,
        null,
        { params: { user_id: userId } }
      );
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await axios.delete(`${API_URL}/notifications/${notificationId}`, {
        params: { user_id: userId }
      });
      // Update local state
      setNotifications(notifications.filter(n => n.id !== notificationId));
      if (!notifications.find(n => n.id === notificationId)?.is_read) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle color="success" fontSize="small" />;
      case 'warning':
        return <Warning color="warning" fontSize="small" />;
      case 'error':
        return <Error color="error" fontSize="small" />;
      default:
        return <Info color="info" fontSize="small" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return '#4caf50';
      case 'warning':
        return '#ff9800';
      case 'error':
        return '#f44336';
      default:
        return '#2196f3';
    }
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleClick}
          aria-label="notifications"
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 500,
            width: 400,
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAll />}
              onClick={handleMarkAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </Box>

        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              sx={{
                borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                backgroundColor: notification.is_read ? 'transparent' : 'action.hover',
                whiteSpace: 'normal',
                display: 'block',
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'action.selected',
                },
              }}
              onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                {getNotificationIcon(notification.type)}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: notification.is_read ? 400 : 600 }}>
                      {notification.title}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      sx={{ ml: 1 }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                  {notification.link && (
                    <Button
                      size="small"
                      sx={{ mt: 0.5 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = notification.link;
                      }}
                    >
                      View
                    </Button>
                  )}
                </Box>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
