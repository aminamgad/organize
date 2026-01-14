import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import Feature from '@/models/Feature';
import { Types } from 'mongoose';
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
        { success: false, error: 'معرف المشروع غير صالح' },
        { status: 400 }
      );
    }

    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'المشروع غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project });
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
    const { name, description } = body;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'معرف المشروع غير صالح' },
        { status: 400 }
      );
    }

    // Check if project with same name already exists (excluding current project)
    if (name) {
      const existingProject = await Project.findOne({ 
        name: name.trim(),
        _id: { $ne: id }
      });
      if (existingProject) {
        return NextResponse.json(
          { success: false, error: 'يوجد مشروع بنفس الاسم بالفعل' },
          { status: 400 }
        );
      }
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'المشروع غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error: unknown) {
    const { error: errorMessage, status } = handleApiError(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
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
        { success: false, error: 'معرف المشروع غير صالح' },
        { status: 400 }
      );
    }

    // Delete all features associated with this project
    await Feature.deleteMany({ projectId: id });

    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'المشروع غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'تم حذف المشروع بنجاح' });
  } catch (error: unknown) {
    const { error: errorMessage, status } = handleApiError(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
}

