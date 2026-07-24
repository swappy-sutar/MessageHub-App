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

  // WebRTC Signaling
  CALL_USER: "callUser",
  INCOMING_CALL: "incomingCall",
  ANSWER_CALL: "answerCall",
  CALL_ACCEPTED: "callAccepted",
  REJECT_CALL: "rejectCall",
  CALL_REJECTED: "callRejected",
  END_CALL: "endCall",
  CALL_ENDED: "callEnded",
  ICE_CANDIDATE: "iceCandidate",

  // Room Subscription
  JOIN_ROOM: "joinRoom",
  LEAVE_ROOM: "leaveRoom",
};
