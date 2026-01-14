import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Feature from '@/models/Feature';
import { Types } from 'mongoose';
import { wouldCreateCircularReference } from '@/lib/feature-utils';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let query: any = {};
    if (projectId && Types.ObjectId.isValid(projectId)) {
      query.projectId = new Types.ObjectId(projectId);
    }

    const features = await Feature.find(query)
      .sort({ order: 1, createdAt: 1 })
      .populate('parentId', 'title');

    return NextResponse.json({ success: true, data: features });
  } catch (error: unknown) {
    const { error: errorMessage, status } = handleApiError(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { title, description, projectId, parentId, images, order, hasAccounting, isAccountingDone, isCompleted } = body;

    if (!title || !projectId) {
      return NextResponse.json(
        { success: false, error: 'العنوان ومعرف المشروع مطلوبان' },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { success: false, error: 'معرف المشروع غير صالح' },
        { status: 400 }
      );
    }

    // Check for circular reference (for new features, featureId would be empty, so skip)
    // This check is more relevant for updates

    // Validate accounting logic
    const finalHasAccounting = hasAccounting || false;
    const finalIsAccountingDone = isAccountingDone || false;

    // Cannot set isAccountingDone to true if hasAccounting is false
    if (finalIsAccountingDone && !finalHasAccounting) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن تعيين "تمت المحاسبة" إذا كانت الميزة لا تحتاج محاسبة' },
        { status: 400 }
      );
    }

    const feature = await Feature.create({
      title,
      description,
      projectId: new Types.ObjectId(projectId),
      parentId: parentId && Types.ObjectId.isValid(parentId) ? new Types.ObjectId(parentId) : null,
      images: images || [],
      order: order || 0,
      hasAccounting: finalHasAccounting,
      isAccountingDone: finalHasAccounting ? finalIsAccountingDone : false,
      isCompleted: isCompleted || false,
    });

    return NextResponse.json(
      { success: true, data: feature },
      { status: 201 }
    );
  } catch (error: unknown) {
    const { error: errorMessage, status } = handleApiError(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
}

