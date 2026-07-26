/**
 * Centralized Socket.IO Event Constants
 * Shared across server and client for strict event naming consistency.
 */
export const SOCKET_EVENTS = {
  // Connection & Auth
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  AUTHENTICATE: "authenticate",
  HEARTBEAT: "heartbeat",
  HEARTBEAT_ACK: "heartbeatAck",

  // Messaging & Receipts
  NEW_MESSAGE: "newMessage",
  MESSAGE_DELIVERED: "messageDelivered",
  MESSAGES_DELIVERED: "messagesDelivered",
  MARK_MESSAGES_READ: "markMessagesRead",
  MESSAGES_READ: "messagesRead",
  EDIT_MESSAGE: "editMessage",
  MESSAGE_EDITED: "messageEdited",
  DELETE_MESSAGE: "deleteMessage",
  MESSAGE_DELETED: "messageDeletedForEveryone",
  ADD_REACTION: "addReaction",
  REMOVE_REACTION: "removeReaction",
  REACTION_UPDATED: "reactionUpdated",
  PIN_MESSAGE: "pinMessage",
  MESSAGE_PINNED: "messagePinned",

  // Typing & Presence
  TYPING: "typing",
  STOP_TYPING: "stopTyping",
  USER_TYPING: "userTyping",
  USER_STOPPED_TYPING: "userStoppedTyping",
  SET_INVISIBLE: "setInvisible",
  PRESENCE_CHANGE: "presenceChange",
  GET_ONLINE_USERS: "getOnlineUsers",
  USER_LAST_SEEN: "userLastSeen",

  // WebRTC Signaling — full production event set
  CALL_USER: "callUser",
  INCOMING_CALL: "incomingCall",
  ANSWER_CALL: "answerCall",
  CALL_ACCEPTED: "callAccepted",
  REJECT_CALL: "rejectCall",
  CALL_REJECTED: "callRejected",
  CANCEL_CALL: "cancelCall",
  CALL_CANCELLED: "callCancelled",
  END_CALL: "endCall",
  CALL_ENDED: "callEnded",
  CALL_FAILED: "callFailed",
  CALL_BUSY: "callBusy",
  CALL_TIMEOUT: "callTimeout",
  CALL_CONNECTED: "callConnected",
  ICE_CANDIDATE: "iceCandidate",
  ICE_RESTART: "iceRestart",
  ICE_RESTART_OFFER: "iceRestartOffer",
  NETWORK_QUALITY: "networkQuality",
  // Media state signaling (sent alongside ICE/SDP for sync)
  MUTE: "mute",
  UNMUTE: "unmute",
  VIDEO_ON: "videoOn",
  VIDEO_OFF: "videoOff",
  SCREEN_SHARE_START: "screenShareStart",
  SCREEN_SHARE_STOP: "screenShareStop",

  // Room Subscription
  JOIN_ROOM: "joinRoom",
  LEAVE_ROOM: "leaveRoom",
};
