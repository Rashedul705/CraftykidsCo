'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  MessageSquare,
  ShieldAlert,
  BookOpen,
  HelpCircle,
  BarChart3,
  CheckCircle,
  Plus,
  Trash2,
  ExternalLink,
  Phone,
  Save,
  Truck,
  TrendingUp,
} from 'lucide-react';
import { StatusPill } from '@/components/ui/Pill';

interface SystemSettingsManagerProps {
  activeTab: 'payments-sms' | 'block-list' | 'blog' | 'faq-policies' | 'reports';
  onNavigateTab?: (tab: string) => void;
}

export function SystemSettingsManager({ activeTab, onNavigateTab }: SystemSettingsManagerProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  // Payments & SMS states
  const [codEnabled, setCodEnabled] = useState(true);
  const [bkashNumber, setBkashNumber] = useState('01712345678');
  const [nagadNumber, setNagadNumber] = useState('01812345678');
  const [storeBrandName, setStoreBrandName] = useState('CraftyKidsCo');
  const [supportPhone, setSupportPhone] = useState('+880 1712-345678');
  const [supportEmail, setSupportEmail] = useState('support@craftykidsco.com');

  // Blocklist states
  const [blockList, setBlockList] = useState<Array<{ id: string; phone: string; reason: string; date: string }>>([
    { id: 'blk-1', phone: '01899999999', reason: 'Fake orders repeated 4 times', date: '2026-10-12' },
    { id: 'blk-2', phone: '01700000000', reason: 'Refused courier delivery 3 times consecutively', date: '2026-10-15' },
  ]);
  const [newBlockPhone, setNewBlockPhone] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');

  // Blog states
  const [blogs, setBlogs] = useState<Array<{ id: string; title: string; category: string; date: string; status: string }>>([
    { id: 'blog-1', title: 'শিশুদের জন্য নিরাপদ মোমের রং চেনার ৫টি উপায়', category: 'Parenting Guide', date: 'Oct 14, 2026', status: 'Published' },
    { id: 'blog-2', title: 'মন্টেসরি কাঠের খেলনা শিশুর মস্তিষ্কের বিকাশে কীভাবে সহায়তা করে?', category: 'Child Development', date: 'Oct 08, 2026', status: 'Published' },
    { id: 'blog-3', title: 'ন্যাচারাল মৌচাকের মোম কেন শিশুদের জন্য শতভাগ নিরাপদ', category: 'Product Insight', date: 'Oct 02, 2026', status: 'Published' },
  ]);

  // FAQs states
  const [faqs, setFaqs] = useState<Array<{ id: string; question: string; answer: string; category: string }>>([
    {
      id: 'faq-1',
      question: 'CraftyKidsCo মোমের রঙ কি সত্যিই শতভাগ শিশু-নিরাপদ?',
      answer: 'হ্যাঁ, আমাদের প্রতিটি রঙ প্রাকৃতিক মৌচাকের মোম (Beeswax) এবং ফুড-গ্রেড অরগানিক পিগমেন্ট দিয়ে তৈরি। ক্ষতিকর প্যারাফিন বা ভারী ধাতু সম্পূর্ণ মুক্ত।',
      category: 'নিরাপত্তা',
    },
    {
      id: 'faq-2',
      question: 'ডেলিভারি পেতে কতদিন সময় লাগবে?',
      answer: 'ঢাকা সিটির ভেতরে ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে যেকোনো জেলায় ২ থেকে ৪ কার্যদিবসের মধ্যে স্টিডফাস্ট কুরিয়ারের মাধ্যমে ডেলিভারি সম্পন্ন হয়।',
      category: 'ডেলিভারি',
    },
    {
      id: 'faq-3',
      question: 'পণ্য পছন্দ না হলে বা ক্ষতিগ্রস্ত হলে কি রিটার্ন করা যাবে?',
      answer: 'হ্যাঁ, পণ্য পাওয়ার ৭ দিনের মধ্যে আমাদের হোয়াটসঅ্যাপে জানালে সম্পূর্ণ ফ্রিতে এক্সচেঞ্জ বা শতভাগ রিফান্ড প্রদান করা হয়।',
      category: 'রিটার্ন ও রিফান্ড',
    },
  ]);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('System settings saved successfully!');
  };

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockPhone) return;
    setBlockList((prev) => [
      { id: `blk-${Date.now()}`, phone: newBlockPhone, reason: newBlockReason || 'High return risk', date: new Date().toISOString().split('T')[0] },
      ...prev,
    ]);
    setNewBlockPhone('');
    setNewBlockReason('');
    showToast('Phone number added to block list.');
  };

  const handleUnblock = (id: string) => {
    setBlockList((prev) => prev.filter((b) => b.id !== id));
    showToast('Number removed from block list.');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast */}
      {feedback && (
        <div className="p-3.5 rounded-[12px] bg-[#DDF3E6] border border-[#BDE7CC] text-xs font-bold text-[#1F6B43] flex items-center justify-between shadow-xs">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-[#6B6B6B] hover:text-[#2B2B2B]">
            ✕
          </button>
        </div>
      )}

      {/* VIEW: PAYMENTS & SMS */}
      {activeTab === 'payments-sms' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Brand Info */}
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
            <h3 className="font-heading font-black text-base text-[#2B2B2B]">Storefront Brand Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">Brand Name:</label>
                <input
                  type="text"
                  value={storeBrandName}
                  onChange={(e) => setStoreBrandName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B]"
                />
              </div>
              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">Customer Support Phone:</label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B]"
                />
              </div>
              <div>
                <label className="font-bold text-[#2B2B2B] block mb-1">Support Email:</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EFE9E0] focus:outline-[#D6403B]"
                />
              </div>
            </div>
          </div>

          {/* Payment Gateways */}
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
            <h3 className="font-heading font-black text-base text-[#2B2B2B] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#D6403B]" /> Payment Methods Configuration
            </h3>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] flex items-center justify-between">
                <div>
                  <strong className="text-sm text-[#2B2B2B] block">Cash on Delivery (COD)</strong>
                  <span className="text-[#6B6B6B]">Allow customers to pay cash when Steadfast delivers the parcel.</span>
                </div>
                <input
                  type="checkbox"
                  checked={codEnabled}
                  onChange={(e) => setCodEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#D6403B] rounded cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#EFE9E0] space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs text-[#2B2B2B]">bKash Payment Gateway</strong>
                    <StatusPill variant="green" dot>Active</StatusPill>
                  </div>
                  <label className="text-[11px] text-[#6B6B6B] block">Merchant Number / Account:</label>
                  <input
                    type="text"
                    value={bkashNumber}
                    onChange={(e) => setBkashNumber(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#EFE9E0] font-mono text-xs focus:outline-[#D6403B]"
                  />
                </div>

                <div className="p-4 rounded-xl border border-[#EFE9E0] space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs text-[#2B2B2B]">Nagad Payment Gateway</strong>
                    <StatusPill variant="green" dot>Active</StatusPill>
                  </div>
                  <label className="text-[11px] text-[#6B6B6B] block">Merchant Number / Account:</label>
                  <input
                    type="text"
                    value={nagadNumber}
                    onChange={(e) => setNagadNumber(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#EFE9E0] font-mono text-xs focus:outline-[#D6403B]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SMS & Courier Gateway status */}
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
            <h3 className="font-heading font-black text-base text-[#2B2B2B] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#1F6B43]" /> SMS &amp; Courier Service Status
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-[#2B2B2B]">SMS Gateway (BulkSMSBD)</strong>
                  <StatusPill variant="green" dot>Connected</StatusPill>
                </div>
                <p className="text-[#6B6B6B]">Live Balance: <strong className="text-[#1F6B43]">৳2,450.00</strong></p>
                <p className="text-[#6B6B6B]">Approved Sender Mask: <strong className="font-mono text-[#2B2B2B]">CraftyKids</strong></p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-[#2B2B2B]">Courier Gateway (Steadfast)</strong>
                  <StatusPill variant="green" dot>Connected</StatusPill>
                </div>
                <p className="text-[#6B6B6B]">API Key: <strong className="font-mono text-[#2B2B2B]">stf_••••••••281</strong></p>
                <p className="text-[#6B6B6B]">Secret: <strong className="font-mono text-[#2B2B2B]">sec_••••••••419</strong></p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#B5322E] flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" /> Save System Settings
              </button>
            </div>
          </div>
        </form>
      )}

      {/* VIEW: BLOCK LIST */}
      {activeTab === 'block-list' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
            <h3 className="font-heading font-black text-base text-[#2B2B2B] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D6403B]" /> Restrict Suspicious Numbers
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Phone numbers on this list are prevented from placing COD orders to protect against high return rates.
            </p>

            <form onSubmit={handleAddBlock} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                placeholder="Phone number (e.g. 017XXXXXXXX)"
                value={newBlockPhone}
                onChange={(e) => setNewBlockPhone(e.target.value)}
                className="p-2.5 rounded-xl border border-[#EFE9E0] text-xs font-mono focus:outline-[#D6403B]"
              />
              <input
                type="text"
                placeholder="Reason (e.g. Repeated fake COD orders)"
                value={newBlockReason}
                onChange={(e) => setNewBlockReason(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-[#EFE9E0] text-xs focus:outline-[#D6403B]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#B5322E] shrink-0"
              >
                + Block Number
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-[#EFE9E0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F2] text-[#6B6B6B] border-b border-[#EFE9E0] text-[11px] font-semibold">
                    <th className="py-3 px-4">Blocked Phone</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Date Added</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE9E0]">
                  {blockList.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF7F2]/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#D6403B]">{item.phone}</td>
                      <td className="py-3.5 px-4 text-[#2B2B2B]">{item.reason}</td>
                      <td className="py-3.5 px-4 text-[#6B6B6B]">{item.date}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleUnblock(item.id)}
                          className="px-2.5 py-1 rounded-lg border border-[#EFE9E0] hover:bg-[#DDF3E6] hover:text-[#1F6B43] text-[11px] font-bold"
                        >
                          Unblock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: BLOG */}
      {activeTab === 'blog' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-black text-lg text-[#2B2B2B]">Parenting &amp; Safety Blog Posts</h3>
              <p className="text-xs text-[#6B6B6B]">Educational articles for parents about child development and safety.</p>
            </div>
            <button
              onClick={() => showToast('Blog article editor opened.')}
              className="px-4 py-2 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#B5322E] flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> + Write Article
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogs.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-[#EFE9E0] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#D6403B]">{b.category}</span>
                  <StatusPill variant="green" dot>{b.status}</StatusPill>
                </div>
                <h4 className="font-heading font-bold text-sm text-[#2B2B2B] leading-snug">{b.title}</h4>
                <div className="pt-2 border-t border-[#EFE9E0] flex items-center justify-between text-[11px] text-[#6B6B6B]">
                  <span>{b.date}</span>
                  <button onClick={() => showToast('Article editing modal')} className="text-[#D6403B] font-bold hover:underline">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: FAQ & POLICIES */}
      {activeTab === 'faq-policies' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-black text-lg text-[#2B2B2B]">Frequently Asked Questions &amp; Policies</h3>
              <p className="text-xs text-[#6B6B6B]">Manage customer trust FAQs, return policies, and safety standards.</p>
            </div>
            <button
              onClick={() => showToast('Add FAQ modal opened.')}
              className="px-4 py-2 rounded-xl bg-[#D6403B] text-white text-xs font-bold hover:bg-[#B5322E] flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> + Add FAQ
            </button>
          </div>

          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.id} className="bg-white rounded-2xl border border-[#EFE9E0] p-5 shadow-xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#D6403B] text-[11px]">{f.category}</span>
                  <button onClick={() => showToast('FAQ updated.')} className="text-[#6B6B6B] hover:text-[#2B2B2B] text-[11px]">
                    Edit
                  </button>
                </div>
                <h4 className="font-heading font-bold text-sm text-[#2B2B2B]">{f.question}</h4>
                <p className="text-[#6B6B6B] leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
              <span className="text-xs font-medium text-[#6B6B6B] block">30-Day Gross Revenue</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-heading font-black text-2xl text-[#2B2B2B]">৳142,650</span>
                <span className="text-[11px] font-bold text-[#1F6B43]">+14.2%</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
              <span className="text-xs font-medium text-[#6B6B6B] block">COD In Transit</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-heading font-black text-2xl text-[#0B5F85]">৳28,450</span>
                <span className="text-[11px] text-[#0B5F85]">24 parcels</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
              <span className="text-xs font-medium text-[#6B6B6B] block">Overall Return Rate</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-heading font-black text-2xl text-[#1F6B43]">4.2%</span>
                <span className="text-[11px] font-bold text-[#1F6B43]">Industry low</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#EFE9E0] p-4 shadow-xs">
              <span className="text-xs font-medium text-[#6B6B6B] block">Delivered Orders</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-heading font-black text-2xl text-[#2B2B2B]">151</span>
                <span className="text-[11px] text-[#6B6B6B]">Past 30 days</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
            <h4 className="font-heading font-bold text-sm text-[#2B2B2B]">Top Selling Products By Volume</h4>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EFE9E0] text-[11px] text-[#6B6B6B]">
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Units Sold</th>
                    <th className="py-2.5 px-3">Revenue (৳)</th>
                    <th className="py-2.5 px-3 text-right">Return Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE9E0]">
                  <tr>
                    <td className="py-3 px-3 font-bold text-[#2B2B2B]">CraftyKidsCo Natural Wax Crayons - 24 Shades</td>
                    <td className="py-3 px-3 font-semibold">142 units</td>
                    <td className="py-3 px-3 font-bold text-[#D6403B]">৳42,458</td>
                    <td className="py-3 px-3 text-right text-[#1F6B43] font-bold">1.4%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-[#2B2B2B]">Toddler Triangular Grip Chunky Crayons 12 Set</td>
                    <td className="py-3 px-3 font-semibold">98 units</td>
                    <td className="py-3 px-3 font-bold text-[#D6403B]">৳21,560</td>
                    <td className="py-3 px-3 text-right text-[#1F6B43] font-bold">2.1%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-[#2B2B2B]">অর্গানিক প্লে-ডো অ্যান্ড ক্লে ক্রাফট কিট</td>
                    <td className="py-3 px-3 font-semibold">76 units</td>
                    <td className="py-3 px-3 font-bold text-[#D6403B]">৳37,924</td>
                    <td className="py-3 px-3 text-right text-[#1F6B43] font-bold">3.8%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default SystemSettingsManager;
