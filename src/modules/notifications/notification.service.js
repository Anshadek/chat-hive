// src/modules/notifications/notification.service.js
export const pushNotification = async ({ userId, title, body, data }) => {
    // placeholder: integrate push provider (FCM / APNs) or email
    // store notification in DB if you want.
    console.log('pushNotification ->', userId, title);
    return true;
  };
  