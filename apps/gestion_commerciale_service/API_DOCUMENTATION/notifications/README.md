# Notifications API Documentation

## Overview

The Notifications API in Wanzo allows managing user notifications including retrieving, marking as read, and deleting notifications. The system supports various notification types such as information alerts, success confirmations, warnings, errors, as well as business-specific notifications like low stock alerts, sales notifications, and payment notifications.

## Models

### NotificationModel

The `NotificationModel` represents a notification in the system with the following properties:

```json
{
  "id": "string",
  "title": "string (optional)",
  "message": "string",
  "type": "string (enum: info, success, warning, error, lowStock, sale, payment)",
  "timestamp": "datetime",
  "isRead": "boolean",
  "actionRoute": "string (optional)",
  "additionalData": "string (optional)"
}
```

### NotificationType Enum

Represents the type of notification:

- `info`: General information notification
- `success`: Success confirmation notification
- `warning`: Warning notification
- `error`: Error notification
- `lowStock`: Low inventory stock alert
- `sale`: Sales-related notification
- `payment`: Payment-related notification

## API Endpoints

### Get Notifications

Retrieves a list of notifications for the authenticated user.

- **Endpoint**: `/commerce/api/v1/notifications`
- **Method**: GET
- **Authorization**: Bearer token required
- **Query Parameters**:
  - `page`: Page number for pagination (optional)
  - `limit`: Number of items per page (optional)
  - `status`: Filter by status - 'read' or 'unread' (optional)
- **Response**: 
  ```json
  {
    "success": true,
    "data": [NotificationModel],
    "message": "string",
    "statusCode": 200
  }
  ```

### Mark Notification as Read

Marks a specific notification as read.

- **Endpoint**: `/notifications/{notificationId}/mark-read`
- **Method**: POST
- **Authorization**: Bearer token required
- **URL Parameters**:
  - `notificationId`: ID of the notification to mark as read
- **Response**:
  ```json
  {
    "success": true,
    "data": NotificationModel,
    "message": "Notification marked as read",
    "statusCode": 200
  }
  ```

### Mark All Notifications as Read

Marks all notifications for the authenticated user as read.

- **Endpoint**: `/notifications/mark-all-read`
- **Method**: POST
- **Authorization**: Bearer token required
- **Response**:
  ```json
  {
    "success": true,
    "data": null,
    "message": "All notifications marked as read",
    "statusCode": 200
  }
  ```

### Delete Notification

Deletes a specific notification.

- **Endpoint**: `/notifications/{notificationId}`
- **Method**: DELETE
- **Authorization**: Bearer token required
- **URL Parameters**:
  - `notificationId`: ID of the notification to delete
- **Response**:
  ```json
  {
    "success": true,
    "data": null,
    "message": "Notification deleted successfully",
    "statusCode": 200
  }
  ```

## Factory Methods

The `NotificationModel` class provides factory methods for creating common notification types:

### Low Stock Notification

```dart
NotificationModel.lowStock({
  required String productName,
  required int quantity,
  String? productId,
});
```

### New Sale Notification

```dart
NotificationModel.newSale({
  required String invoiceNumber,
  required double amount,
  required String customerName,
  String? saleId,
});
```

## Usage Example

```dart
// Get notifications
final ApiResponse<List<NotificationModel>> response = await notificationApiService.getNotifications(
  page: 1,
  limit: 10,
  status: 'unread',
);

// Mark notification as read
final ApiResponse<NotificationModel> readResponse = await notificationApiService.markNotificationAsRead('notification-id');

// Mark all notifications as read
final ApiResponse<void> markAllResponse = await notificationApiService.markAllNotificationsAsRead();

// Delete notification
final ApiResponse<void> deleteResponse = await notificationApiService.deleteNotification('notification-id');
```

## Error Handling

The Notifications API handles errors gracefully by:

1. Returning standardized `ApiResponse` objects with success flag, status code, and error messages
2. Handling different response formats from the backend (direct lists or wrapped objects)
3. Providing detailed error messages for debugging

## Implementation Notes

1. Notifications are designed to work with the app's offline-first architecture
2. The system supports local creation of notifications (e.g., for offline operations)
3. Notifications can include action routes for navigation when tapped
4. Additional data can be stored in the `additionalData` field for complex notification scenarios
