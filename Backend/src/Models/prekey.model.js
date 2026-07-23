import mongoose, { Schema } from "mongoose";

const preKeyBundleSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    identityPublicKey: {
      type: String,
      required: true,
    },
    signedPreKey: {
      keyId: Number,
      publicKey: String,
      signature: String,
    },
    oneTimePreKeys: [
      {
        keyId: Number,
        publicKey: String,
      },
    ],
  },
  { timestamps: true }
);

export const PreKeyBundle = mongoose.model("PreKeyBundle", preKeyBundleSchema);
