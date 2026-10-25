'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { BRAND_CONFIG } from '@/lib/brand';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'সাধারণ জিজ্ঞাসা',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) {
      alert('দয়া করে আপনার নাম, ফোন নম্বর এবং বার্তা লিখুন।');
      return;
    }
    setIsSubmitting(true);
    // Simulate instantaneous smooth submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: '',
        phone: '',
        email: '',
        subject: 'সাধারণ জিজ্ঞাসা',
        message: '',
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 md:pb-12 text-[#2B2B2B]">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#6B6B6B] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#D6403B] transition-colors">
            হোম
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#AAAAAA]" />
          <span className="font-bold text-[#2B2B2B]">যোগাযোগ</span>
        </nav>

        {/* Hero Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D6403B]/10 text-[#D6403B] font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>আমরা আপনার সহায়তায় সদা প্রস্তুত</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#2B2B2B] tracking-tight">
            যোগাযোগ করুন
          </h1>
          <p className="text-xs sm:text-base text-[#6B6B6B] leading-relaxed">
            শিশুদের নিরাপদ মোমের রঙ, খেলনা বা আপনার অর্ডার সংক্রান্ত যেকোনো তথ্যের জন্য সরাসরি আমাদের সাথে যুক্ত থাকুন।
          </p>
        </div>

        {/* 4 Quick Contact Channels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Hotline */}
          <a
            href={`tel:${BRAND_CONFIG.defaultHotline.replace(/[^\d+]/g, '')}`}
            id="contact-call-card"
            className="group p-5 rounded-2xl bg-white border border-[#EFE9E0] hover:border-[#D6403B] shadow-xs hover:shadow-md transition-all space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#D6403B]/10 text-[#D6403B] flex items-center justify-center group-hover:scale-110 transition-transform">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">সরাসরি কল</p>
              <h3 className="font-heading font-black text-base text-[#2B2B2B] mt-0.5">
                {BRAND_CONFIG.defaultHotline}
              </h3>
              <p className="text-[11px] text-[#6B6B6B] mt-1">সরাসরি কথা বলতে ট্যাপ করুন</p>
            </div>
          </a>

          {/* Card 2: WhatsApp */}
          <a
            href={`https://wa.me/${BRAND_CONFIG.defaultWhatsapp}?text=${encodeURIComponent(
              'হ্যালো, CraftyKidsCo! আমি আপনাদের প্রোডাক্ট ও অর্ডার সম্পর্কে জানতে চাই।'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            id="contact-whatsapp-card"
            className="group p-5 rounded-2xl bg-white border border-[#EFE9E0] hover:border-[#25D366] shadow-xs hover:shadow-md transition-all space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">হোয়াটসঅ্যাপ চ্যাট</p>
              <h3 className="font-heading font-black text-base text-[#2B2B2B] mt-0.5">
                {BRAND_CONFIG.defaultHotline}
              </h3>
              <p className="text-[11px] text-[#25D366] font-semibold mt-1">সবচেয়ে দ্রুত উত্তর পেতে মেসেজ দিন</p>
            </div>
          </a>

          {/* Card 3: Email */}
          <a
            href={`mailto:${BRAND_CONFIG.defaultEmail}`}
            id="contact-email-card"
            className="group p-5 rounded-2xl bg-white border border-[#EFE9E0] hover:border-[#5BC0EB] shadow-xs hover:shadow-md transition-all space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#5BC0EB]/15 text-[#0284C7] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">ইমেইল ঠিকানা</p>
              <h3 className="font-heading font-black text-sm text-[#2B2B2B] mt-0.5 break-all">
                {BRAND_CONFIG.defaultEmail}
              </h3>
              <p className="text-[11px] text-[#6B6B6B] mt-1">বাল্ক বা অফিসিয়াল অনুসন্ধানের জন্য</p>
            </div>
          </a>

          {/* Card 4: Location & Hours */}
          <div
            id="contact-location-card"
            className="p-5 rounded-2xl bg-white border border-[#EFE9E0] shadow-xs space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1F6B43]/10 text-[#1F6B43] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">অফিস ও শোরুম</p>
              <h3 className="font-heading font-black text-sm text-[#2B2B2B] mt-0.5">
                ধানমন্ডি, ঢাকা, বাংলাদেশ
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-[#6B6B6B] mt-1">
                <Clock className="w-3 h-3 text-[#1F6B43]" />
                <span>শনি - বৃহস্পতি: সকাল ১০টা - রাত ৮টা</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form & Side Banner Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Interactive Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-[28px] border border-[#EFE9E0] p-6 sm:p-8 shadow-sm">
            <div className="space-y-1 mb-6">
              <h2 className="font-heading font-black text-xl text-[#2B2B2B]">
                আমাদের বার্তা পাঠান (Send Us a Message)
              </h2>
              <p className="text-xs sm:text-sm text-[#6B6B6B]">
                আপনার মতামত বা প্রশ্ন লিখে পাঠান, আমাদের কাস্টমার কেয়ার টিম দ্রুত আপনার সাথে যোগাযোগ করবে।
              </p>
            </div>

            {isSubmitted ? (
              <div
                id="contact-success-state"
                className="py-10 text-center space-y-4 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] p-6"
              >
                <div className="w-14 h-14 rounded-full bg-[#22C55E]/15 text-[#16A34A] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-heading font-black text-lg text-[#166534]">
                    ধন্যবাদ! আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে।
                  </h3>
                  <p className="text-xs sm:text-sm text-[#15803D]">
                    আমাদের প্রতিনিধি শীঘ্রই আপনার দেওয়া ফোন নম্বরে যোগাযোগ করবেন।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="mt-2 px-5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  আরেকটি বার্তা পাঠান
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} id="contact-form" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="block text-xs font-bold text-[#2B2B2B]">
                      আপনার নাম <span className="text-[#D6403B]">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder="উদাঃ সাকিব আহমেদ"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] text-xs sm:text-sm text-[#2B2B2B] placeholder-[#999999] focus:bg-white focus:outline-none focus:border-[#D6403B] focus:ring-2 focus:ring-[#D6403B]/10 transition-all"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone" className="block text-xs font-bold text-[#2B2B2B]">
                      মোবাইল নম্বর <span className="text-[#D6403B]">*</span>
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      required
                      placeholder="01XXXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] text-xs sm:text-sm text-[#2B2B2B] placeholder-[#999999] focus:bg-white focus:outline-none focus:border-[#D6403B] focus:ring-2 focus:ring-[#D6403B]/10 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="block text-xs font-bold text-[#2B2B2B]">
                      ইমেইল (ঐচ্ছিক)
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] text-xs sm:text-sm text-[#2B2B2B] placeholder-[#999999] focus:bg-white focus:outline-none focus:border-[#D6403B] focus:ring-2 focus:ring-[#D6403B]/10 transition-all"
                    />
                  </div>

                  {/* Subject Dropdown */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-subject" className="block text-xs font-bold text-[#2B2B2B]">
                      বিষয়ের ধরণ
                    </label>
                    <select
                      id="contact-subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] text-xs sm:text-sm text-[#2B2B2B] focus:bg-white focus:outline-none focus:border-[#D6403B] transition-all"
                    >
                      <option value="সাধারণ জিজ্ঞাসা">সাধারণ জিজ্ঞাসা</option>
                      <option value="অর্ডার ও ট্র্যাকিং সহায়তা">অর্ডার ও ট্র্যাকিং সহায়তা</option>
                      <option value="স্কুল বা বাল্ক অর্ডার">স্কুল বা বাল্ক অর্ডার</option>
                      <option value="রিপ্লেসমেন্ট বা রিটার্ন">রিপ্লেসমেন্ট বা রিটার্ন</option>
                      <option value="অন্যান্য পরামর্শ">অন্যান্য পরামর্শ</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="block text-xs font-bold text-[#2B2B2B]">
                    আপনার বার্তা <span className="text-[#D6403B]">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    placeholder="আপনার বার্তা বা প্রশ্নের বিস্তারিত লিখুন..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE9E0] bg-[#FAF7F2] text-xs sm:text-sm text-[#2B2B2B] placeholder-[#999999] focus:bg-white focus:outline-none focus:border-[#D6403B] focus:ring-2 focus:ring-[#D6403B]/10 transition-all"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  id="contact-submit-btn"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#D6403B] hover:bg-[#BF3430] active:scale-[0.99] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'পাঠানো হচ্ছে...' : 'বার্তা পাঠান'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Side Info Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* WhatsApp Priority Card */}
            <div className="rounded-[28px] bg-gradient-to-br from-[#128C7E] to-[#075E54] p-6 text-white space-y-3 shadow-md">
              <div className="flex items-center gap-2 text-[#A7F3D0]">
                <MessageCircle className="w-5 h-5 text-white" />
                <span className="text-xs font-bold uppercase tracking-wider">দ্রুততম সেবা</span>
              </div>
              <h3 className="font-heading font-black text-lg text-white">
                তাত্ক্ষণিক WhatsApp চ্যাট সাপোর্ট
              </h3>
              <p className="text-xs text-white/90 leading-relaxed">
                পণ্য নির্বাচন, বয়স উপযোগী খেলনার পরামর্শ বা যেকোনো প্রশ্নের সরাসরি সমাধানের জন্য আমাদের WhatsApp এ মেসেজ দিন।
              </p>
              <a
                href={`https://wa.me/${BRAND_CONFIG.defaultWhatsapp}?text=${encodeURIComponent(
                  'হ্যালো CraftyKidsCo! আমি সরাসরি কিছু জানতে চাই।'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#075E54] hover:bg-[#F0FDF4] font-black text-xs transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>WhatsApp এ মেসেজ দিন</span>
              </a>
            </div>

            {/* Guarantees Box */}
            <div className="rounded-[28px] bg-white border border-[#EFE9E0] p-6 space-y-3 shadow-sm">
              <h4 className="font-heading font-bold text-sm text-[#2B2B2B] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1F6B43]" />
                <span>আমাদের গ্রাহক সেবা প্রতিশ্রুতি</span>
              </h4>
              <ul className="space-y-2 text-xs text-[#6B6B6B] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1F6B43] shrink-0 mt-1.5" />
                  <span>কর্মদিবসে সাধারণত ৩০ মিনিটের মধ্যে রেসপন্স করা হয়।</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1F6B43] shrink-0 mt-1.5" />
                  <span>৭ দিনের মধ্যে পণ্য রিপ্লেসমেন্টে পূর্ণ সহায়তা।</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1F6B43] shrink-0 mt-1.5" />
                  <span>সারা দেশে ক্যাশ অন ডেলিভারিতে প্যাকেট চেক করার সুবিধা।</span>
                </li>
              </ul>
              <div className="pt-2 border-t border-[#EFE9E0]">
                <Link
                  href="/faq"
                  className="text-xs font-bold text-[#D6403B] hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>সাধারণ প্রশ্নোত্তর (FAQ) পেজ দেখুন</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav activeTab="home" />
    </div>
  );
}
