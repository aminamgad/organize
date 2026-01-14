import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Feature from '@/models/Feature';
import { Types } from 'mongoose';
import { handleApiError } from '@/lib/api-error-handler';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { featureIds } = body;

    if (!Array.isArray(featureIds) || featureIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'قائمة معرفات الميزات مطلوبة' },
        { status: 400 }
      );
    }

    // Validate all IDs
    for (const id of featureIds) {
      if (!Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { success: false, error: `معرف الميزة غير صالح: ${id}` },
          { status: 400 }
        );
      }
    }

    // Update order for each feature
    const updatePromises = featureIds.map((id: string, index: number) => {
      return Feature.findByIdAndUpdate(
        id,
        { order: index },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ 
      success: true, 
      message: 'تم تحديث ترتيب الميزات بنجاح' 
    });
  } catch (error: unknown) {
    const { error: errorMessage, status } = handleApiError(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
}

