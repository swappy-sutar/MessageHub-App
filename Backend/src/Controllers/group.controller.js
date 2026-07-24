import { Group } from "../Models/group.model.js";
import { Conversation } from "../Models/conversation.model.js";
import { User } from "../Models/user.model.js";
import { Message } from "../Models/message.model.js";
import { emitToUser, io } from "../Config/socket.js";
import crypto from "crypto";

const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    const ownerId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Group name is required" });
    }

    const allMembers = Array.from(new Set([ownerId.toString(), ...(memberIds || []).map(String)]));

    // Create monotonic conversation container for group
    const conversation = await Conversation.create({
      type: "group",
      participants: allMembers,
      sequenceCounter: 0,
    });

    const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    const group = await Group.create({
      conversationId: conversation._id,
      name: name.trim(),
      description: (description || "").trim(),
      ownerId,
      admins: [ownerId],
      membersCount: allMembers.length,
      inviteCode,
    });

    // Create system message
    const systemMsg = await Message.create({
      conversationId: conversation._id,
      sequenceId: 1,
      senderId: ownerId,
      text: `Group "${group.name}" created`,
      type: "system",
      status: "delivered",
    });

    conversation.sequenceCounter = 1;
    conversation.lastMessage = {
      messageId: systemMsg._id,
      senderId: ownerId,
      text: systemMsg.text,
      sequenceId: 1,
      createdAt: systemMsg.createdAt,
    };
    await conversation.save();

    // Broadcast group creation to all members
    allMembers.forEach((memberId) => {
      emitToUser(memberId, "groupCreated", { group, conversation });
    });

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: { group, conversation },
    });
  } catch (error) {
    console.error("Error in createGroup:", error.stack || error);
    return res.status(500).json({ success: false, message: "Failed to create group" });
  }
};

const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId)
      .populate("ownerId", "firstName lastName profilePic email")
      .populate("admins", "firstName lastName profilePic email");

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const conversation = await Conversation.findById(group.conversationId).populate(
      "participants",
      "firstName lastName profilePic email lastSeen isInvisible"
    );

    return res.status(200).json({
      success: true,
      data: { group, conversation },
    });
  } catch (error) {
    console.error("Error in getGroupDetails:", error.stack || error);
    return res.status(500).json({ success: false, message: "Failed to fetch group details" });
  }
};

const addMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberIds } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const isAdmin = group.admins.some((id) => id.toString() === userId.toString());
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: "Only admins can add members" });
    }

    const conversation = await Conversation.findById(group.conversationId);
    const existingParticipants = new Set(conversation.participants.map((id) => id.toString()));

    const newMembers = (memberIds || []).filter((id) => !existingParticipants.has(String(id)));
    if (newMembers.length === 0) {
      return res.status(400).json({ success: false, message: "No new members to add" });
    }

    conversation.participants.push(...newMembers);
    await conversation.save();

    group.membersCount = conversation.participants.length;
    await group.save();

    // Broadcast update
    conversation.participants.forEach((mId) => {
      emitToUser(mId, "groupMembersUpdated", { groupId: group._id, membersCount: group.membersCount });
    });

    return res.status(200).json({
      success: true,
      message: "Members added successfully",
      data: group,
    });
  } catch (error) {
    console.error("Error in addMembers:", error.stack || error);
    return res.status(500).json({ success: false, message: "Failed to add members" });
  }
};

const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const isAdmin = group.admins.some((id) => id.toString() === userId.toString());
    if (!isAdmin && userId.toString() !== memberId.toString()) {
      return res.status(403).json({ success: false, message: "Permission denied" });
    }

    const conversation = await Conversation.findById(group.conversationId);
    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== memberId.toString()
    );
    await conversation.save();

    group.admins = group.admins.filter((id) => id.toString() !== memberId.toString());
    group.membersCount = conversation.participants.length;
    await group.save();

    emitToUser(memberId, "removedFromGroup", { groupId });

    return res.status(200).json({
      success: true,
      message: "Member removed from group",
      data: group,
    });
  } catch (error) {
    console.error("Error in removeMember:", error.stack || error);
    return res.status(500).json({ success: false, message: "Failed to remove member" });
  }
};

const promoteAdmin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    if (group.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Only the group owner can promote admins" });
    }

    if (!group.admins.some((id) => id.toString() === memberId.toString())) {
      group.admins.push(memberId);
      await group.save();
    }

    return res.status(200).json({
      success: true,
      message: "Member promoted to admin",
      data: group,
    });
  } catch (error) {
    console.error("Error in promoteAdmin:", error.stack || error);
    return res.status(500).json({ success: false, message: "Failed to promote admin" });
  }
};

const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all group conversations user belongs to
    const conversations = await Conversation.find({
      type: "group",
      participants: userId,
    }).sort({ updatedAt: -1 });

    const conversationIds = conversations.map((c) => c._id);
    const groups = await Group.find({ conversationId: { $in: conversationIds } }).lean();

    const groupMap = new Map();
    groups.forEach((g) => groupMap.set(g.conversationId.toString(), g));

    const result = conversations.map((conv) => {
      const g = groupMap.get(conv._id.toString()) || {};
      let lastMessageText = "";
      let lastMessageTime = null;

      if (conv.lastMessage) {
        lastMessageText = conv.lastMessage.text || "";
        lastMessageTime = conv.lastMessage.createdAt || conv.updatedAt;
      }

      return {
        _id: g._id || conv._id,
        conversationId: conv._id,
        name: g.name || "Group",
        description: g.description || "",
        profilePic: g.groupPic || "",
        isGroup: true,
        membersCount: g.membersCount || conv.participants.length,
        lastMessageText,
        lastMessageTime,
        updatedAt: conv.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in getUserGroups:", error.stack || error);
    return res.status(500).json({ success: false, message: "Failed to fetch groups" });
  }
};

export { createGroup, getGroupDetails, addMembers, removeMember, promoteAdmin, getUserGroups };
