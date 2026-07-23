import { PreKeyBundle } from "../Models/prekey.model.js";

const uploadPreKeys = async (req, res) => {
  try {
    const userId = req.user._id;
    const { identityPublicKey, signedPreKey, oneTimePreKeys } = req.body;

    if (!identityPublicKey || !signedPreKey) {
      return res.status(400).json({ success: false, message: "Identity key and signed prekey required" });
    }

    const bundle = await PreKeyBundle.findOneAndUpdate(
      { userId },
      {
        userId,
        identityPublicKey,
        signedPreKey,
        oneTimePreKeys: oneTimePreKeys || [],
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "PreKey bundle uploaded successfully",
      data: bundle,
    });
  } catch (error) {
    console.error("Error in uploadPreKeys:", error.stack || error);
    return res.status(500).json({ success: false, message: "Failed to upload PreKey bundle" });
  }
};

const getPreKeyBundle = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const bundle = await PreKeyBundle.findOne({ userId: targetUserId });

    if (!bundle) {
      return res.status(404).json({ success: false, message: "E2EE PreKey bundle not found for user" });
    }

    // Atomically pop one OneTimePreKey for session initiation (Signal protocol)
    let oneTimePreKey = null;
    if (bundle.oneTimePreKeys.length > 0) {
      oneTimePreKey = bundle.oneTimePreKeys.shift();
      await bundle.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: bundle.userId,
        identityPublicKey: bundle.identityPublicKey,
        signedPreKey: bundle.signedPreKey,
        oneTimePreKey: oneTimePreKey,
      },
    });
  } catch (error) {
    console.error("Error in getPreKeyBundle:", error.stack || error);
    return res.status(500).json({ success: false, message: "Failed to fetch PreKey bundle" });
  }
};

export { uploadPreKeys, getPreKeyBundle };
