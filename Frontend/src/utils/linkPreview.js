// Helper to extract the first URL from text
export const extractFirstUrl = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex);
  return matches ? matches[0] : null;
};

// Helper to generate rich link preview metadata
export const getLinkPreviewData = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;

    let title = domain.replace(/^www\./, "");
    let description = `Visit ${domain} for more details.`;

    if (
      domain.includes("vercel.app") ||
      domain.includes("messagee-hub") ||
      domain.includes("messagehub")
    ) {
      title =
        "MessageHub — Real-time Messaging & WebRTC Video Calls | Developed by Er.Swappy";
      description =
        "Connect instantly with friends using real-time messaging, WebRTC video/voice calls, and custom theme personalization. Developed by Er.Swappy.";
    } else if (domain.includes("github.com")) {
      title = `GitHub — ${parsed.pathname.slice(1) || "Repository"}`;
      description =
        "Build, share, and collaborate on software projects using GitHub.";
    } else if (domain.includes("youtube.com") || domain.includes("youtu.be")) {
      title = "YouTube Video";
      description =
        "Enjoy the videos and music you love, upload original content, and share it all on YouTube.";
    } else if (domain.includes("google.com")) {
      title = "Google Search & Maps";
      description = "Search the world's information, including webpages, images, videos and more.";
    }

    return {
      url,
      domain,
      title,
      description,
    };
  } catch (e) {
    return null;
  }
};
