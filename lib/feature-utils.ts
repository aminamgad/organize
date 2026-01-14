import Feature from '@/models/Feature';
import { Types } from 'mongoose';

/**
 * Check if setting parentId would create a circular reference
 * @param featureId - The ID of the feature being updated
 * @param parentId - The proposed parent ID
 * @returns true if it would create a circular reference, false otherwise
 */
export async function wouldCreateCircularReference(
  featureId: string,
  parentId: string | null
): Promise<boolean> {
  if (!parentId || !Types.ObjectId.isValid(parentId)) {
    return false;
  }

  if (featureId === parentId) {
    return true; // Feature cannot be its own parent
  }

  // Check if the proposed parent is a descendant of the feature
  const proposedParent = await Feature.findById(parentId);
  if (!proposedParent) {
    return false;
  }

  // Traverse up the tree to check if featureId appears as an ancestor
  let currentParentId = proposedParent.parentId;
  const visited = new Set<string>();

  while (currentParentId && Types.ObjectId.isValid(currentParentId.toString())) {
    const parentIdStr = currentParentId.toString();
    
    if (parentIdStr === featureId) {
      return true; // Circular reference detected
    }

    if (visited.has(parentIdStr)) {
      break; // Prevent infinite loops
    }
    visited.add(parentIdStr);

    const parent = await Feature.findById(currentParentId);
    if (!parent) {
      break;
    }
    currentParentId = parent.parentId;
  }

  return false;
}

