import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useNotification } from './NotificationContext';

const NotificationItem = ({ notification, onDismiss }) => {
  const { id, message, type } = notification;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {

    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDismiss = () => {

    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {onDismiss(id);});
  };

  const getTypeStyle = () => {
    switch (type) {
      case 'success':
        return styles.success;
      case 'error':
        return styles.error;
      case 'warning':
        return styles.warning;
      default:
        return styles.info;
    }
  };

  return (
    <Animated.View style={[styles.notification, getTypeStyle(), { opacity: opacityAnim }]}>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const NotificationsContainer = () => {
  const { notifications, dismissNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={dismissNotification}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
  },
  notification: {
    marginVertical: 5,
    padding: 12,
    borderRadius: 8,
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  success: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  error: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  warning: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
  },
  info: {
    backgroundColor: '#d1ecf1',
    borderColor: '#bee5eb',
  },
  message: {
    flex: 1,
    fontSize: 14,
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default NotificationsContainer;