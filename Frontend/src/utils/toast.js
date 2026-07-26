import { toast as hotToast } from "react-hot-toast";

/**
 * Global Single-Toast Utility for MessageHub
 * Ensures only ONE toast notification is ever visible on screen at any time across the app.
 */
const singleToast = (message, options) => {
  hotToast.dismiss();
  return hotToast(message, options);
};

singleToast.success = (message, options) => {
  hotToast.dismiss();
  return hotToast.success(message, options);
};

singleToast.error = (message, options) => {
  hotToast.dismiss();
  return hotToast.error(message, options);
};

singleToast.loading = (message, options) => {
  hotToast.dismiss();
  return hotToast.loading(message, options);
};

singleToast.dismiss = (toastId) => {
  return hotToast.dismiss(toastId);
};

singleToast.custom = (message, options) => {
  hotToast.dismiss();
  return hotToast.custom(message, options);
};

export default singleToast;
export { singleToast as toast };
