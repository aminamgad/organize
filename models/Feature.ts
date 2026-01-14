import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IFeature extends Document {
  title: string;
  description?: string;
  projectId: Types.ObjectId;
  parentId?: Types.ObjectId | null;
  images?: string[];
  order: number;
  hasAccounting: boolean;
  isAccountingDone: boolean;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'عنوان الميزة مطلوب'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'معرف المشروع مطلوب'],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Feature',
      default: null,
    },
    images: [
      {
        type: String,
      },
    ],
    order: {
      type: Number,
      default: 0,
    },
    hasAccounting: {
      type: Boolean,
      default: false,
    },
    isAccountingDone: {
      type: Boolean,
      default: false,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
FeatureSchema.index({ projectId: 1, parentId: 1, order: 1 });
FeatureSchema.index({ hasAccounting: 1 });
FeatureSchema.index({ isAccountingDone: 1 });
FeatureSchema.index({ isCompleted: 1 });
FeatureSchema.index({ projectId: 1, hasAccounting: 1 });
FeatureSchema.index({ projectId: 1, isCompleted: 1 });

const Feature: Model<IFeature> =
  mongoose.models.Feature || mongoose.model<IFeature>('Feature', FeatureSchema);

export default Feature;

