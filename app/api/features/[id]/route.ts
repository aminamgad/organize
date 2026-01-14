import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Feature from '@/models/Feature';
import { Types } from 'mongoose';
import { wouldCreateCircularReference } from '@/lib/feature-utils';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'معرف الميزة غير صالح' },
        { status: 400 }
      );
    }

    const feature = await Feature.findById(id).populate('parentId', 'title');

    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'الميزة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: feature });
  } catch (error: unknown) {
    const { error: errorMessage, status } = handleApiError(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();
    const { title, description, parentId, images, order, hasAccounting, isAccountingDone, isCompleted } = body;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'معرف الميزة غير صالح' },
        { status: 400 }
      );
    }

    // Check for circular reference if parentId is being set
    if (parentId !== undefined && parentId) {
      const isCircular = await wouldCreateCircularReference(id, parentId);
      if (isCircular) {
        return NextResponse.json(
          { success: false, error: 'لا يمكن تعيين ميزة أصلية ستؤدي إلى إنشاء حلقة مرجعية' },
          { status: 400 }
        );
      }
    }

    // Get current feature to validate accounting logic
    const currentFeature = await Feature.findById(id);
    if (!currentFeature) {
      return NextResponse.json(
        { success: false, error: 'الميزة غير موجودة' },
        { status: 404 }
      );
    }

    // Validate accounting logic
    const finalHasAccounting = hasAccounting !== undefined ? hasAccounting : currentFeature.hasAccounting;
    const finalIsAccountingDone = isAccountingDone !== undefined ? isAccountingDone : currentFeature.isAccountingDone;

    // Cannot set isAccountingDone to true if hasAccounting is false
    if (finalIsAccountingDone && !finalHasAccounting) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن تعيين "تمت المحاسبة" إذا كانت الميزة لا تحتاج محاسبة' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (parentId !== undefined) {
      updateData.parentId = parentId && Types.ObjectId.isValid(parentId) 
        ? new Types.ObjectId(parentId) 
        : null;
    }
    if (images !== undefined) updateData.images = images;
    if (order !== undefined) updateData.order = order;
    if (hasAccounting !== undefined) {
      updateData.hasAccounting = hasAccounting;
      // If hasAccounting is set to false, also set isAccountingDone to false
      if (!hasAccounting) {
        updateData.isAccountingDone = false;
      }
    }
    if (isAccountingDone !== undefined) {
      // Only allow isAccountingDone to be true if hasAccounting is true
      if (isAccountingDone && !finalHasAccounting) {
        return NextResponse.json(
          { success: false, error: 'لا يمكن تعيين "تمت المحاسبة" إذا كانت الميزة لا تحتاج محاسبة' },
          { status: 400 }
        );
      }
      updateData.isAccountingDone = isAccountingDone;
    }
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

    const feature = await Feature.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parentId', 'title');

    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'الميزة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: feature });
  } catch (error: unknown) {
    const { error: errorMessage, status } = handleApiError(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
}

// Recursive function to delete feature and all its children
async function deleteFeatureRecursive(featureId: string) {
  // Find all child features
  const childFeatures = await Feature.find({ parentId: featureId });
  
  // Recursively delete all children
  for (const child of childFeatures) {
    await deleteFeatureRecursive(child._id.toString());
  }
  
  // Delete the feature itself
  await Feature.findByIdAndDelete(featureId);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'معرف الميزة غير صالح' },
        { status: 400 }
      );
    }

    // Check if feature exists
    const feature = await Feature.findById(id);
    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'الميزة غير موجودة' },
        { status: 404 }
      );
    }

    // Delete feature and all its children recursively
    await deleteFeatureRecursive(id);

    return NextResponse.json({ success: true, message: 'تم حذف الميزة بنجاح' });
  } catch (error: unknown) {
    const { error: errorMessage, status } = handleApiError(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
}

