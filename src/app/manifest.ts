import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FixFlow — Consumer Complaint Tracker & Dispute Organizer",
    short_name: "FixFlow",
    description:
      "Track, manage, and escalate consumer complaints with legal notices, timelines, and statutory consumer rights.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#4F46E5",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "New Complaint",
        url: "/issues/new",
        description: "File a new consumer dispute or grievance",
      },
      {
        name: "Dashboard",
        url: "/dashboard",
        description: "View active complaints and pending deadlines",
      },
    ],
    categories: ["productivity", "utilities", "finance"],
  };
}
