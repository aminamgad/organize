'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit, ChevronDown, ChevronRight, Image as ImageIcon, Loader2, CheckCircle2, Circle, Calculator, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ImageGallery from './ImageGallery';

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

interface FeatureListProps {
  features: Feature[];
  onEdit: (feature: Feature) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onStatusChange?: () => void;
  searchQuery?: string;
  level?: number;
}

export default function FeatureList({
  features,
  onEdit,
  onDelete,
  onAddChild,
  onStatusChange,
  searchQuery,
  level = 0,
}: FeatureListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [optimisticFeatures, setOptimisticFeatures] = useState<Feature[]>(features);
  const { toast } = useToast();

  // Sync optimistic features with props
  useEffect(() => {
    setOptimisticFeatures(features);
  }, [features]);

  // Helper function to update feature in nested structure
  const updateFeatureInTree = (features: Feature[], featureId: string, updates: Partial<Feature>): Feature[] => {
    return features.map(feature => {
      if (feature._id === featureId) {
        return { ...feature, ...updates };
      }
      if (feature.children) {
        return { ...feature, children: updateFeatureInTree(feature.children, featureId, updates) };
      }
      return feature;
    });
  };

  const handleStatusChange = async (featureId: string, field: 'hasAccounting' | 'isAccountingDone' | 'isCompleted', value: boolean) => {
    setUpdating(prev => new Set(prev).add(featureId));
    
    // Optimistic update
    const previousFeatures = optimisticFeatures;
    const updateData: any = { [field]: value };
    
    // If hasAccounting is being set to false, also set isAccountingDone to false
    if (field === 'hasAccounting' && !value) {
      updateData.isAccountingDone = false;
    }
    
    // Apply optimistic update immediately
    setOptimisticFeatures(prev => updateFeatureInTree(prev, featureId, updateData));
    
    try {
      const response = await fetch(`/api/features/${featureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const result = await response.json();
      if (result.success) {
        if (onStatusChange) {
          onStatusChange();
        }
      } else {
        // Rollback optimistic update on error
        setOptimisticFeatures(previousFeatures);
        toast({
          title: 'خطأ',
          description: result.error || 'فشل في تحديث الحالة',
          variant: 'destructive',
        });
      }
    } catch (error) {
      // Rollback optimistic update on error
      setOptimisticFeatures(previousFeatures);
      console.error('Failed to update status:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الحالة',
        variant: 'destructive',
      });
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(featureId);
        return newSet;
      });
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  // Use optimistic features for rendering
  const displayFeatures = useMemo(() => optimisticFeatures, [optimisticFeatures]);

  const renderFeature = (feature: Feature) => {
    const hasChildren = feature.children && feature.children.length > 0;
    const isExpanded = expanded.has(feature._id);

    return (
      <div key={feature._id} className="mb-4">
        <Card className={level > 0 ? 'mr-8 border-r-4 border-primary/20' : ''}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {hasChildren && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleExpand(feature._id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
                {feature.description && (
                  <CardDescription className="mt-2">
                    {feature.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onAddChild(feature._id)}
                  title="إضافة ميزة فرعية"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(feature)}
                  title="تعديل"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => onDelete(feature._id)}
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(feature.images && feature.images.length > 0) && (
              <ImageGallery images={feature.images} title={feature.title} />
            )}
            <div className="flex flex-wrap gap-4 pt-2 border-t">
              <div className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${feature.hasAccounting ? 'bg-blue-50 dark:bg-blue-950' : ''}`}>
                {updating.has(feature._id) ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Checkbox
                    id={`hasAccounting-${feature._id}`}
                    checked={feature.hasAccounting || false}
                    onCheckedChange={(checked) => handleStatusChange(feature._id, 'hasAccounting', checked === true)}
                    disabled={updating.has(feature._id)}
                    className={feature.hasAccounting ? 'border-blue-500 data-[state=checked]:bg-blue-500' : ''}
                  />
                )}
                <Label htmlFor={`hasAccounting-${feature._id}`} className={`text-sm cursor-pointer flex items-center gap-1.5 ${updating.has(feature._id) ? 'opacity-50' : ''} ${feature.hasAccounting ? 'text-blue-700 dark:text-blue-300 font-medium' : ''}`}>
                  <Calculator className="h-3.5 w-3.5" />
                  يحتاج محاسبة
                </Label>
              </div>
              {feature.hasAccounting && (
                <div className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${feature.isAccountingDone ? 'bg-green-50 dark:bg-green-950' : ''}`}>
                  {updating.has(feature._id) ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Checkbox
                      id={`isAccountingDone-${feature._id}`}
                      checked={feature.isAccountingDone || false}
                      onCheckedChange={(checked) => handleStatusChange(feature._id, 'isAccountingDone', checked === true)}
                      disabled={updating.has(feature._id)}
                      className={feature.isAccountingDone ? 'border-green-500 data-[state=checked]:bg-green-500' : ''}
                    />
                  )}
                  <Label htmlFor={`isAccountingDone-${feature._id}`} className={`text-sm cursor-pointer flex items-center gap-1.5 ${updating.has(feature._id) ? 'opacity-50' : ''} ${feature.isAccountingDone ? 'text-green-700 dark:text-green-300 font-medium' : ''}`}>
                    <Receipt className="h-3.5 w-3.5" />
                    تمت المحاسبة
                  </Label>
                </div>
              )}
              <div className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${feature.isCompleted ? 'bg-emerald-50 dark:bg-emerald-950' : ''}`}>
                {updating.has(feature._id) ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Checkbox
                    id={`isCompleted-${feature._id}`}
                    checked={feature.isCompleted || false}
                    onCheckedChange={(checked) => handleStatusChange(feature._id, 'isCompleted', checked === true)}
                    disabled={updating.has(feature._id)}
                    className={feature.isCompleted ? 'border-emerald-500 data-[state=checked]:bg-emerald-500' : ''}
                  />
                )}
                <Label htmlFor={`isCompleted-${feature._id}`} className={`text-sm cursor-pointer flex items-center gap-1.5 ${updating.has(feature._id) ? 'opacity-50' : ''} ${feature.isCompleted ? 'text-emerald-700 dark:text-emerald-300 font-medium' : ''}`}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  تم الانتهاء
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
        {hasChildren && isExpanded && (
          <div className="mt-2">
            <FeatureList
              features={feature.children || []}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onStatusChange={onStatusChange}
              searchQuery={searchQuery}
              level={level + 1}
            />
          </div>
        )}
      </div>
    );
  };

  if (features.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد ميزات حالياً'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {displayFeatures.map((feature) => renderFeature(feature))}
    </div>
  );
}

