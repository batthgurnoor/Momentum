import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);


export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const newNotification = { id, message, type, duration };
    
    setNotifications(current => [...current, newNotification]);
    
    // auto dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, duration);
    }
    
    return id;
  };

  // remove a notification
  const dismissNotification = (id) => {
    setNotifications(current => 
      current.filter(notification => notification.id !== id)
    );
  };


  const contextValue = {
    notifications,
    showNotification,
    dismissNotification,
    showSuccess: (message, duration) => showNotification(message, 'success', duration),
    showError: (message, duration) => showNotification(message, 'error', duration),
    showWarning: (message, duration) => showNotification(message, 'warning', duration),
    showInfo: (message, duration) => showNotification(message, 'info', duration),
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;