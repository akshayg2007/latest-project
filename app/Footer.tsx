"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube
} from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="bg-[#001731] text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">

        {/* TOP SECTION: Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-16">

          {/* 1. Logo Column (Spans 2 cols on large screens for spacing) */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 font-bold text-2xl mb-4">
              <Image src="/logo.png" alt="Truework Logo" width={32} height={32} className="w-8 h-8 object-contain" />
              <span>Truework</span>
            </div>
          </div>

          {/* 2. Platform Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Platform</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>How it Works</li>
              <li>Community</li>
              <li>Discover Talent</li>
              <li>Find Work</li>
              <li>Pricing</li>
            </ul>
          </div>

          {/* 3. For Freelancers */}
          <div>
            <h3 className="font-semibold text-lg mb-4">For Freelancers</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>Create Profile</li>
              <li>Post Work</li>
              <li>Find Services</li>
              <li>Payments</li>
              <li>Reviews & Ratings</li>
            </ul>
          </div>

          {/* 4. For Clients */}
          <div>
            <h3 className="font-semibold text-lg mb-4">For Clients</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>Hire Talent</li>
              <li>Post a Job</li>
              <li>Browse Creators</li>
              <li>Project Safety</li>
              <li>Support</li>
            </ul>
          </div>

          {/* 5. Subscribe Section */}
          <div className="lg:col-span-1 min-w-[200px]">
            <h3 className="font-semibold text-lg mb-4">Subscribe</h3>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Get updates on new features, community highlights, and opportunities.
            </p>
            <div className="flex flex-col gap-3">
              <div className="bg-transparent border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-500">
                Enter your email
              </div>
              <div className="bg-transparent border border-slate-600 rounded-md px-4 py-2 text-sm text-white text-center">
                Subscribe
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-3">
              By subscribing you agree to our Privacy Policy and provide consent to receive updates.
            </p>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="border-t border-slate-800 my-8" />

        {/* BOTTOM SECTION */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Copyright & Legal */}
          <div className="flex flex-col md:flex-row items-center gap-4 text-xs text-slate-400">
            <span>© 2026 Truework. All rights reserved.</span>
            <div className="flex gap-4">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-800 p-2 rounded-full text-white">
              <Facebook className="w-4 h-4" />
            </div>
            <div className="bg-slate-800 p-2 rounded-full text-white">
              <Instagram className="w-4 h-4" />
            </div>
            <div className="bg-slate-800 p-2 rounded-full text-white">
              <Twitter className="w-4 h-4" />
            </div>
            <div className="bg-slate-800 p-2 rounded-full text-white">
              <Linkedin className="w-4 h-4" />
            </div>
            <div className="bg-slate-800 p-2 rounded-full text-white">
              <Youtube className="w-4 h-4" />
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}