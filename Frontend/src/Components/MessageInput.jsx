import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import {
  Image,
  Send,
  X,
  Paperclip,
  Camera,
  Smile,
  Mic,
  MapPin,
  User,
  Reply,
} from "lucide-react";
import toast from "react-hot-toast";
import EmojiPickerSheet from "./EmojiPickerSheet";
import CameraCaptureModal from "./CameraCaptureModal";
import { extractFirstUrl, getLinkPreviewData } from "../utils/linkPreview.js";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [showAttachSheet, setShowAttachSheet] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isLinkPreviewDismissed, setIsLinkPreviewDismissed] = useState(false);

  const detectedUrl = extractFirstUrl(text);
  const detectedUrlData = detectedUrl ? getLinkPreviewData(detectedUrl) : null;

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const sheetRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { sendMessage, replyingTo, setReplyingTo, selectedUser } = useChatStore();
  const socket = useAuthStore((state) => state.socket);

  // Close attachment sheet on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) {
        setShowAttachSheet(false);
      }
    };
    if (showAttachSheet) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAttachSheet]);

  // Handle typing indicator emission
  const handleTyping = (val) => {
    setText(val);

    if (!selectedUser?._id || !socket || !socket.connected) return;

    socket.emit("typing", { to: selectedUser._id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { to: selectedUser._id });
    }, 2500);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setShowAttachSheet(false);
  };

  const handleCapturedPhotoFromCamera = (photoFile) => {
    setImageFile(photoFile);
    setImagePreview(URL.createObjectURL(photoFile));
    setShowAttachSheet(false);
    toast.success("Camera photo captured!");
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    const toastId = toast.loading("Getting GPS Location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const locText = `📍 My Location: https://www.google.com/maps?q=${latitude},${longitude}`;
        handleTyping(locText);
        setShowAttachSheet(false);
        toast.success("Location added to message!", { id: toastId });
      },
      (err) => {
        toast.error("Unable to fetch location: " + err.message, { id: toastId });
      }
    );
  };

  const handleShareContact = () => {
    const authUser = useAuthStore.getState().authUser;
    const userObj = authUser?.data || authUser;
    const code = userObj?.inviteCode || userObj?._id;
    const contactText = `👤 Contact Card: ${userObj.firstName} ${userObj.lastName} (Invite Code: ${code})`;
    handleTyping(contactText);
    setShowAttachSheet(false);
    toast.success("Contact card added!");
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();

    if (!text.trim() && !imageFile) {
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (selectedUser?._id && socket && socket.connected) {
      socket.emit("stopTyping", { to: selectedUser._id });
    }

    const toastId = toast.loading("Sending...");

    const formData = new FormData();
    if (text.trim()) formData.append("text", text.trim());
    if (imageFile) formData.append("image", imageFile);

    try {
      await sendMessage(formData);
      setText("");
      removeImage();
      setShowEmojiPicker(false);
      setShowAttachSheet(false);
      toast.success("Sent!", { id: toastId });
    } catch (err) {
      toast.error("Failed to send message", { id: toastId });
    }
  };

  const canSend = text.trim() || imageFile;

  return (
    <div className="relative p-2.5 sm:p-3 w-full border-t border-base-300 bg-base-100 transition-colors duration-300">
      {/* Hidden File Inputs */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageChange}
      />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={cameraInputRef}
        onChange={handleImageChange}
      />

      {/* WhatsApp Style Link Preview Draft Banner (Screenshot 1) */}
      {detectedUrlData && !isLinkPreviewDismissed && (
        <div className="mb-2 p-3 bg-base-200 border border-base-300 rounded-2xl flex items-center justify-between shadow-md animate-fade-in text-xs">
          <div className="flex flex-col gap-0.5 min-w-0 pr-3">
            <span className="font-bold text-base-content truncate">
              {detectedUrlData.domain}
            </span>
            <span className="text-base-content/70 truncate text-[11px]">
              {detectedUrlData.url}
            </span>
            <span className="text-base-content/50 truncate text-[10px]">
              {detectedUrlData.domain}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsLinkPreviewDismissed(true)}
            className="p-1.5 rounded-full text-base-content/60 hover:text-base-content hover:bg-base-300 transition-colors flex-shrink-0 cursor-pointer"
            title="Dismiss link preview"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* WhatsApp Style Reply Banner Preview */}
      {replyingTo && (
        <div className="mb-2 p-2 bg-base-200 border-l-4 border-primary rounded-xl flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2 truncate flex-1">
            <Reply className="size-4 text-primary flex-shrink-0" />
            <div className="truncate">
              <span className="font-bold text-primary block truncate">
                Replying to message
              </span>
              <span className="text-base-content/80 truncate block">
                {replyingTo.text || (replyingTo.image ? "📷 Photo" : "Attachment")}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-base-content"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Image Preview Thumb */}
      {imagePreview && (
        <div className="mb-2 flex items-center gap-2 px-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-xl border border-base-300 shadow-md"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-error text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Style Categorized Emoji, GIF & Sticker Picker Sheet */}
      <EmojiPickerSheet
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={(emoji) => handleTyping(text + emoji)}
        onDeleteChar={() => handleTyping(text.slice(0, -1))}
      />

      {/* Live Camera Photo Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onSendCapturedPhoto={handleCapturedPhotoFromCamera}
      />

      {/* WhatsApp Style Attachment Bottom Sheet */}
      {showAttachSheet && (
        <div
          ref={sheetRef}
          className="absolute bottom-16 left-3 right-3 sm:left-auto sm:right-12 sm:w-96 bg-base-100 border border-base-300 rounded-3xl p-4 shadow-2xl z-40 animate-fade-in-up"
        >
          <div className="w-10 h-1 bg-base-300 rounded-full mx-auto mb-4" />

          <div className="grid grid-cols-4 gap-3 text-center">
            {/* Gallery Option */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="size-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <Image className="size-6" />
              </div>
              <span className="text-xs font-medium text-base-content/80">Gallery</span>
            </button>

            {/* Live Camera Option */}
            <button
              type="button"
              onClick={() => {
                setShowAttachSheet(false);
                setIsCameraModalOpen(true);
              }}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="size-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <Camera className="size-6" />
              </div>
              <span className="text-xs font-medium text-base-content/80">Camera</span>
            </button>

            {/* Location Option */}
            <button
              type="button"
              onClick={handleShareLocation}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <MapPin className="size-6" />
              </div>
              <span className="text-xs font-medium text-base-content/80">Location</span>
            </button>

            {/* Contact Option */}
            <button
              type="button"
              onClick={handleShareContact}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="size-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <User className="size-6" />
              </div>
              <span className="text-xs font-medium text-base-content/80">Contact</span>
            </button>
          </div>
        </div>
      )}

      {/* Main WhatsApp Pill Form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1.5 px-3 py-1.5 bg-base-200/90 rounded-full border border-base-300 shadow-inner focus-within:border-primary transition-colors">
          {/* Emoji Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEmojiPicker((prev) => !prev);
              setShowAttachSheet(false);
            }}
            className={`p-1 transition-colors ${
              showEmojiPicker ? "text-primary scale-110" : "text-base-content/50 hover:text-primary"
            }`}
            title="Emojis, GIFs & Stickers"
          >
            <Smile className="size-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            className="flex-1 bg-transparent border-0 outline-none text-sm text-base-content placeholder:text-base-content/40 px-1"
            placeholder="Message"
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
          />

          {/* Paperclip Attachment Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowAttachSheet((prev) => !prev);
              setShowEmojiPicker(false);
            }}
            className={`p-1 transition-colors ${
              showAttachSheet ? "text-primary" : "text-base-content/50 hover:text-base-content"
            }`}
            title="Attach file"
          >
            <Paperclip className="size-5 rotate-45" />
          </button>

          {/* Quick Camera Capture Button */}
          <button
            type="button"
            onClick={() => setIsCameraModalOpen(true)}
            className="text-base-content/50 hover:text-base-content transition-colors p-1"
            title="Live Camera Photo"
          >
            <Camera className="size-5" />
          </button>
        </div>

        {/* Floating Green WhatsApp Mic / Send Button */}
        {canSend ? (
          <button
            type="submit"
            className="btn btn-primary btn-circle size-11 shadow-lg hover:scale-105 transition-transform flex-shrink-0"
            title="Send Message"
          >
            <Send className="size-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              handleTyping(text + " 🎙️ ");
              toast("Voice note recorder active!", { icon: "🎙️" });
            }}
            className="btn btn-success btn-circle size-11 shadow-lg text-white hover:scale-105 transition-transform flex-shrink-0"
            title="Record Voice Note"
          >
            <Mic className="size-5" />
          </button>
        )}
      </form>
    </div>
  );
};

export default MessageInput;
