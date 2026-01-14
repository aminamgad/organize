import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET() {
  try {
    await connectDB();
    const projects = await Project.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: projects });
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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'اسم المشروع مطلوب' },
        { status: 400 }
      );
    }

    // Check if project with same name already exists
    const existingProject = await Project.findOne({ name: name.trim() });
    if (existingProject) {
      return NextResponse.json(
        { success: false, error: 'يوجد مشروع بنفس الاسم بالفعل' },
        { status: 400 }
      );
    }

    const project = await Project.create({
      name,
      description,
    });

    return NextResponse.json(
      { success: true, data: project },
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

