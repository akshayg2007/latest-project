"use client"

import React from "react"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface SmartEmbedProps {
    url: string
}

export function SmartEmbed({ url }: SmartEmbedProps) {
    // 1. Regex Suite
    const youtubeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const instagramPostMatch = url.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
    const instagramProfileMatch = url.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?!p\/|reel\/|tv\/|P\/)([A-Za-z0-9_.]+)\/?(?:\?.*)?$/);
    const spotifyMatch = url.match(/(?:https?:\/\/)?open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist|episode|artist|show)\/([a-zA-Z0-9]+)(?:\?.*)?$/);
    const twitchMatch = url.match(/(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)(?:\?.*)?$/);
    const twitchClipMatch = url.match(/(?:https?:\/\/)?(?:clips\.twitch\.tv\/([a-zA-Z0-9_-]+)|(?:www\.)?twitch\.tv\/[a-zA-Z0-9_]+\/clip\/([a-zA-Z0-9_-]+))/);
    const tiktokMatch = url.match(/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/.*\/video\/(\d+)/);
    const xMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)(?:\/status\/(\d+))?/);
    const linkedinMatch = url.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|posts|company|learning)\/([a-zA-Z0-9_-]+)/);
    const discordMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord\.com\/invite)\/([a-zA-Z0-9_-]+)/);
    const facebookMatch = url.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:[a-zA-Z0-9.]+\/posts\/[0-9]+|[a-zA-Z0-9.]+)/);
    const redditMatch = url.match(/(?:https?:\/\/)?(?:www\.)?reddit\.com\/r\/([a-zA-Z0-9_]+)/);
    const pinterestMatch = url.match(/(?:https?:\/\/)?(?:www\.)?pinterest\.com\/(?:pin\/(\d+)|([a-zA-Z0-9_-]+))/);
    const soundcloudMatch = url.match(/(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)/);

    let embedUrl: string | undefined = undefined;
    let ratio = "aspect-video";
    let platformTheme: { icon: React.ReactNode, label: string, color: string, textColor: string, action: string } | undefined = undefined;

    // 2. Platform Logic
    if (youtubeMatch) {
        embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    } else if (instagramPostMatch) {
        embedUrl = `https://www.instagram.com/p/${instagramPostMatch[1]}/embed`;
        ratio = "aspect-[4/5]";
    } else if (instagramProfileMatch) {
        platformTheme = {
            icon: <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.247 2.242 1.308 3.607.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.247-3.607 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-2.242-1.247-3.607 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-2.242-1.247-3.607-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>,
            label: "Instagram Profile",
            color: "bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888]",
            textColor: "text-white",
            action: "View Profile"
        };
    } else if (spotifyMatch) {
        embedUrl = `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`;
        // Tracks, Episodes look better compact
        ratio = (spotifyMatch[1] === "track" || spotifyMatch[1] === "episode") ? "h-[152px]" : "h-[352px]";
    } else if (twitchMatch) {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        embedUrl = `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${hostname}&autoplay=false`;
    } else if (twitchClipMatch) {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const clipId = twitchClipMatch[1] || twitchClipMatch[2];
        embedUrl = `https://clips.twitch.tv/embed?clip=${clipId}&parent=${hostname}&autoplay=false`;
    } else if (tiktokMatch) {
        embedUrl = `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
        ratio = "aspect-[9/16] max-w-[320px] mx-auto";
    } else if (xMatch) {
        platformTheme = {
            icon: <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
            label: xMatch[2] ? "X Post" : "X Profile",
            color: "bg-black",
            textColor: "text-white",
            action: xMatch[2] ? "View Post" : "View Profile"
        };
    } else if (linkedinMatch) {
        platformTheme = {
            icon: <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>,
            label: "LinkedIn Content",
            color: "bg-[#0077b5]",
            textColor: "text-white",
            action: "View LinkedIn"
        };
    } else if (discordMatch) {
        platformTheme = {
            icon: <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg>,
            label: "Discord Invite",
            color: "bg-[#5865F2]",
            textColor: "text-white",
            action: "Join Discord"
        };
    } else if (soundcloudMatch) {
        embedUrl = `https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/${soundcloudMatch[1]}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;
        ratio = "h-[166px]";
    }

    // 2. Return UI
    if (platformTheme) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    "flex items-center justify-between gap-4 p-4 rounded-xl hover:opacity-90 transition-all shadow-lg",
                    platformTheme.color
                )}
            >
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                            <div className={platformTheme.textColor}>{platformTheme.icon}</div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className={cn("text-lg font-black truncate", platformTheme.textColor)}>
                            {platformTheme.label === "Instagram Profile" && instagramProfileMatch
                                ? instagramProfileMatch[1]
                                : (url.split('/').pop()?.split('?')[0] || platformTheme.label)
                            }
                        </p>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-70", platformTheme.textColor)}>
                            {platformTheme.label}
                        </p>
                    </div>
                </div>
                <div className="px-5 py-2 bg-white rounded-xl text-sm font-black shadow-md transition-transform" style={{ color: platformTheme.color.match(/#[0-9a-fA-F]{6}/) ? platformTheme.color : 'inherit' }}>
                    {platformTheme.action}
                </div>
            </a>
        );
    }

    if (embedUrl) {
        // Special handling for Spotify to ensure exact height without aspect-ratio interference
        const isSpotify = !!spotifyMatch;
        const spotifyHeight = spotifyMatch ?
            ((spotifyMatch[1] === "track" || spotifyMatch[1] === "episode" || spotifyMatch[1] === "artist") ? 152 : 352)
            : undefined;

        return (
            <div
                className={cn(
                    "rounded-xl overflow-hidden border border-slate-100 shadow-lg block bg-white",
                    // Only apply aspect ratio class if it's NOT Spotify
                    !isSpotify && ratio
                )}
                style={isSpotify ? { height: `${spotifyHeight}px` } : undefined}
            >
                <iframe
                    src={embedUrl}
                    className="w-full h-full border-0 block"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                />
            </div>
        );
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-all group/link shadow-sm"
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                    <ExternalLink className="w-5 h-5 text-slate-400 group-hover/link:text-blue-600 transition-colors" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-slate-900 truncate">{url}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">External Link</p>
                </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover/link:scale-110 transition-transform shrink-0">
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover/link:text-blue-600" />
            </div>
        </a>
    );
}
