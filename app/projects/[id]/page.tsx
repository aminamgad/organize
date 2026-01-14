'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit, ArrowRight, ArrowLeft, Search, Filter, Calculator, Receipt, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import FeatureList from '@/components/FeatureList';
import ImageUpload from '@/components/ImageUpload';
import DeleteDialog from '@/components/DeleteDialog';

interface Project {
  _id: string;
  name: string;
  description?: string;
}

interface Feature {
  _id: string;
  title: string;
  description?: string;
  projectId: string;
  parentId?: string | null;
  images?: string[];
  order: number;
  hasAccounting?: boolean;
  isAccountingDone?: boolean;
  isCompleted?: boolean;
  children?: Feature[];
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingFeatureId, setDeletingFeatureId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    parentId: '',
    images: [] as string[],
    hasAccounting: false,
    isAccountingDone: false,
    isCompleted: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchFeatures();
    }
  }, [projectId]);

  // Warn before closing if dialog is open with unsaved changes
  useEffect(() => {
    if (!isDialogOpen) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDialogOpen]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const result = await response.json();
      if (result.success) {
        setProject(result.data);
      } else {
        toast({
          title: 'خطأ',
          description: result.error || 'فشل في جلب المشروع',
          variant: 'destructive',
        });
        router.push('/projects');
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء جلب المشروع',
        variant: 'destructive',
      });
    }
  };

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/features?projectId=${projectId}`);
      const result = await response.json();
      if (result.success) {
        // Build tree structure
        const featuresMap = new Map<string, Feature>();
        const rootFeatures: Feature[] = [];

        result.data.forEach((feature: Feature) => {
          featuresMap.set(feature._id, { ...feature, children: [] });
        });

        result.data.forEach((feature: Feature) => {
          const featureWithChildren = featuresMap.get(feature._id)!;
          if (feature.parentId && featuresMap.has(feature.parentId)) {
            const parent = featuresMap.get(feature.parentId)!;
            if (!parent.children) parent.children = [];
            parent.children.push(featureWithChildren);
          } else {
            rootFeatures.push(featureWithChildren);
          }
        });

        setFeatures(rootFeatures);
      } else {
        toast({
          title: 'خطأ',
          description: result.error || 'فشل في جلب الميزات',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء جلب الميزات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingFeature
        ? `/api/features/${editingFeature._id}`
        : '/api/features';
      const method = editingFeature ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        projectId,
        parentId: formData.parentId || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'نجح',
          description: editingFeature
            ? 'تم تحديث الميزة بنجاح'
            : 'تم إنشاء الميزة بنجاح',
        });
        setIsDialogOpen(false);
        setEditingFeature(null);
        setParentId(null);
        setFormData({
          title: '',
          description: '',
          parentId: '',
          images: [],
          hasAccounting: false,
          isAccountingDone: false,
          isCompleted: false,
        });
        fetchFeatures();
      } else {
        toast({
          title: 'خطأ',
          description: result.error || 'فشلت العملية',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الحفظ',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingFeatureId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingFeatureId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/features/${deletingFeatureId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'نجح',
          description: 'تم حذف الميزة بنجاح',
        });
        setIsDeleteDialogOpen(false);
        setDeletingFeatureId(null);
        fetchFeatures();
      } else {
        toast({
          title: 'خطأ',
          description: result.error || 'فشل في حذف الميزة',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الحذف',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (feature: Feature) => {
    setEditingFeature(feature);
    setFormData({
      title: feature.title,
      description: feature.description || '',
      parentId: feature.parentId || '',
      images: feature.images || [],
      hasAccounting: feature.hasAccounting || false,
      isAccountingDone: feature.isAccountingDone || false,
      isCompleted: feature.isCompleted || false,
    });
    setIsDialogOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    setParentId(parentId);
    setEditingFeature(null);
    setFormData({
      title: '',
      description: '',
      parentId: parentId,
      images: [],
      hasAccounting: false,
      isAccountingDone: false,
      isCompleted: false,
    });
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingFeature(null);
      setParentId(null);
      setFormData({
        title: '',
        description: '',
        parentId: '',
        images: [],
        hasAccounting: false,
        isAccountingDone: false,
        isCompleted: false,
      });
    }
  };

  const getAllFeaturesFlat = (features: Feature[]): Feature[] => {
    const result: Feature[] = [];
    features.forEach((feature) => {
      result.push(feature);
      if (feature.children) {
        result.push(...getAllFeaturesFlat(feature.children));
      }
    });
    return result;
  };

  const filterFeaturesByStatus = (features: Feature[]): Feature[] => {
    if (filterStatus === 'all') return features;

    const filterFn = (feature: Feature): boolean => {
      switch (filterStatus) {
        case 'completed':
          return feature.isCompleted === true;
        case 'not-completed':
          return feature.isCompleted !== true;
        case 'with-accounting':
          return feature.hasAccounting === true;
        case 'without-accounting':
          return feature.hasAccounting !== true;
        case 'accounting-done':
          return feature.isAccountingDone === true;
        default:
          return true;
      }
    };

    const result: Feature[] = [];
    features.forEach((feature) => {
      const filteredChildren = feature.children
        ? filterFeaturesByStatus(feature.children)
        : [];
      if (filterFn(feature) || filteredChildren.length > 0) {
        result.push({ ...feature, children: filteredChildren });
      }
    });
    return result;
  };

  let filteredFeatures = features;
  
  // Apply status filter
  if (filterStatus !== 'all') {
    filteredFeatures = filterFeaturesByStatus(features);
  }
  
  // Apply search filter
  if (searchQuery) {
    filteredFeatures = getAllFeaturesFlat(filteredFeatures).filter((f) =>
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">جاري التحميل...</div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push('/projects')}>
          <ArrowLeft className="ml-2 h-4 w-4" />
          رجوع
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-2">{project.description}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="بحث في الميزات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <Filter className="ml-2 h-4 w-4" />
              <SelectValue placeholder="فلترة حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="completed">مكتملة</SelectItem>
              <SelectItem value="not-completed">غير مكتملة</SelectItem>
              <SelectItem value="with-accounting">مع محاسبة</SelectItem>
              <SelectItem value="without-accounting">بدون محاسبة</SelectItem>
              <SelectItem value="accounting-done">تمت المحاسبة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة ميزة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFeature
                  ? 'تعديل الميزة'
                  : parentId
                  ? 'إضافة ميزة فرعية'
                  : 'إضافة ميزة جديدة'}
              </DialogTitle>
              <DialogDescription>
                {editingFeature
                  ? 'قم بتعديل بيانات الميزة'
                  : 'أدخل بيانات الميزة الجديدة'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">عنوان الميزة</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                  />
                </div>
                {!parentId && (
                  <div className="grid gap-2">
                    <Label htmlFor="parentId">الميزة الأصلية (اختياري)</Label>
                    <select
                      id="parentId"
                      value={formData.parentId}
                      onChange={(e) =>
                        setFormData({ ...formData, parentId: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">بدون ميزة أصلية</option>
                      {getAllFeaturesFlat(features)
                        .filter((f) => f._id !== editingFeature?._id)
                        .map((f) => (
                          <option key={f._id} value={f._id}>
                            {f.title}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>الصور</Label>
                  <ImageUpload
                    images={formData.images}
                    onChange={(images) =>
                      setFormData({ ...formData, images })
                    }
                    maxImages={10}
                  />
                </div>
                <div className="grid gap-4 pt-4 border-t">
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${formData.hasAccounting ? 'bg-blue-50 dark:bg-blue-950' : ''}`}>
                    <Checkbox
                      id="hasAccounting"
                      checked={formData.hasAccounting}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, hasAccounting: checked === true, isAccountingDone: checked === true ? formData.isAccountingDone : false })
                      }
                      className={formData.hasAccounting ? 'border-blue-500 data-[state=checked]:bg-blue-500' : ''}
                    />
                    <Label htmlFor="hasAccounting" className={`cursor-pointer flex items-center gap-1.5 ${formData.hasAccounting ? 'text-blue-700 dark:text-blue-300 font-medium' : ''}`}>
                      <Calculator className="h-3.5 w-3.5" />
                      الميزة تحتاج محاسبة
                    </Label>
                  </div>
                  {formData.hasAccounting && (
                    <div className={`flex items-center gap-2 mr-6 px-2 py-1 rounded-md transition-colors ${formData.isAccountingDone ? 'bg-green-50 dark:bg-green-950' : ''}`}>
                      <Checkbox
                        id="isAccountingDone"
                        checked={formData.isAccountingDone}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isAccountingDone: checked === true })
                        }
                        className={formData.isAccountingDone ? 'border-green-500 data-[state=checked]:bg-green-500' : ''}
                      />
                      <Label htmlFor="isAccountingDone" className={`cursor-pointer flex items-center gap-1.5 ${formData.isAccountingDone ? 'text-green-700 dark:text-green-300 font-medium' : ''}`}>
                        <Receipt className="h-3.5 w-3.5" />
                        تمت المحاسبة
                      </Label>
                    </div>
                  )}
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${formData.isCompleted ? 'bg-emerald-50 dark:bg-emerald-950' : ''}`}>
                    <Checkbox
                      id="isCompleted"
                      checked={formData.isCompleted}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isCompleted: checked === true })
                      }
                      className={formData.isCompleted ? 'border-emerald-500 data-[state=checked]:bg-emerald-500' : ''}
                    />
                    <Label htmlFor="isCompleted" className={`cursor-pointer flex items-center gap-1.5 ${formData.isCompleted ? 'text-emerald-700 dark:text-emerald-300 font-medium' : ''}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      تم الانتهاء من الميزة
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : editingFeature ? 'حفظ التغييرات' : 'إضافة'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <FeatureList
        features={filteredFeatures}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onAddChild={handleAddChild}
        onStatusChange={fetchFeatures}
        searchQuery={searchQuery}
      />

      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="حذف الميزة"
        description="هل أنت متأكد من حذف هذه الميزة؟ سيتم حذف جميع الميزات الفرعية."
        isLoading={isDeleting}
      />
    </div>
  );
}

