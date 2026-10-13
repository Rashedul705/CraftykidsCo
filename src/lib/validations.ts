import { z } from 'zod';

export const BD_PHONE_REGEX = /^(?:\+8801|8801|01)[3-9]\d{8}$/;

export const OrderItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, 'Product ID is required'),
  title: z.string().min(1, 'Product title is required'),
  variationSku: z.string().optional(),
  variationTitle: z.string().optional(),
  price: z.number().int({ message: 'Price must be a whole integer in Taka' }).positive(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const OrderCreateInputSchema = z.object({
  customerName: z.string().trim().min(2, 'গ্রাহকের নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
  customerPhone: z
    .string()
    .trim()
    .refine((val) => BD_PHONE_REGEX.test(val.replace(/[\s-]/g, '')), {
      message: 'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)',
    }),
  district: z.string().trim().min(2, 'ডেলিভারি জেলা নির্বাচন করুন'),
  fullAddress: z.string().trim().min(6, 'সম্পূর্ণ ঠিকানা বিস্তারিত লিখুন (কমপক্ষে ৬ অক্ষর)'),
  customerNote: z.string().trim().max(300, 'নোট ৩০০ অক্ষরের মধ্যে হতে হবে').optional(),
  paymentMethod: z.enum(['COD', 'BKASH', 'NAGAD']).default('COD'),
  couponCode: z.string().trim().optional(),
  items: z.array(OrderItemSchema).min(1, 'কার্টে অন্তত একটি পণ্য থাকতে হবে'),
});

export type OrderCreateInput = z.infer<typeof OrderCreateInputSchema>;

export const OtpRequestSchema = z.object({
  phone: z
    .string()
    .trim()
    .refine((val) => BD_PHONE_REGEX.test(val.replace(/[\s-]/g, '')), {
      message: 'সঠিক মোবাইল নম্বর দিন',
    }),
});

export const OtpVerifySchema = z.object({
  phone: z
    .string()
    .trim()
    .refine((val) => BD_PHONE_REGEX.test(val.replace(/[\s-]/g, '')), {
      message: 'সঠিক মোবাইল নম্বর দিন',
    }),
  code: z.string().trim().min(4, 'ওটিপি কোড কমপক্ষে ৪ সংখ্যার হতে হবে'),
});

export const AdminLoginSchema = z.object({
  email: z.string().trim().email('সঠিক ইমেইল এড্রেস দিন'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
});
