import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. Blog Post
export interface IBlogPost extends Document {
  titleBn: string;
  titleEn: string;
  slug: string;
  contentBn: string;
  contentEn: string;
  coverImage?: string;
  authorName: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    titleBn: { type: String, required: true },
    titleEn: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    contentBn: { type: String, required: true },
    contentEn: { type: String, required: true },
    coverImage: { type: String },
    authorName: { type: String, default: 'CraftyKidsCo Editorial' },
    isPublished: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const BlogPost: Model<IBlogPost> =
  mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);

// 2. FAQ
export interface IFaq extends Document {
  questionBn: string;
  questionEn: string;
  answerBn: string;
  answerEn: string;
  displayOrder: number;
  isActive: boolean;
}

const FaqSchema = new Schema<IFaq>(
  {
    questionBn: { type: String, required: true },
    questionEn: { type: String, required: true },
    answerBn: { type: String, required: true },
    answerEn: { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: false }
);

export const Faq: Model<IFaq> =
  mongoose.models.Faq || mongoose.model<IFaq>('Faq', FaqSchema);

// 3. Policy Page
export interface IPolicyPage extends Document {
  slug: string; // e.g. "delivery-return", "privacy-terms"
  titleBn: string;
  titleEn: string;
  contentBn: string;
  contentEn: string;
  updatedAt: Date;
}

const PolicyPageSchema = new Schema<IPolicyPage>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    titleBn: { type: String, required: true },
    titleEn: { type: String, required: true },
    contentBn: { type: String, required: true },
    contentEn: { type: String, required: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const PolicyPage: Model<IPolicyPage> =
  mongoose.models.PolicyPage ||
  mongoose.model<IPolicyPage>('PolicyPage', PolicyPageSchema);
