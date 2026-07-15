import { create } from 'zustand';
import { apiRequest, apiRequestWithoutSessionInvalidation } from '@/lib/api';

export type SubCategoryProductCounts = {
  total: number;
  active: number;
  inactive: number;
};

export type SubCategoryMetadata = {
  metaTitle: string;
  metaDescription: string;
};

export type SubCategoryItem = {
  id: string;
  name: string;
  subCategoryCode: string;
  description: string;
  icon: string;
  slug: string;
  parentCategoryId: string;
  parentCategoryName: string;
  level: number;
  productCount: number;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  productCounts?: SubCategoryProductCounts;
  metadata?: SubCategoryMetadata;
};

export type SubCategoryFormData = {
  name: string;
  subCategoryCode: string;
  description: string;
  parentCategoryId: string;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
  imageUrl: string;
  imageName: string;
  imageSize: number;
};

export type CreateSubCategoryInput = Pick<
  SubCategoryFormData,
  | 'name'
  | 'subCategoryCode'
  | 'description'
  | 'parentCategoryId'
  | 'active'
  | 'featured'
  | 'sortOrder'
  | 'metaTitle'
  | 'metaDescription'
  | 'imageUrl'
>;

type SubCategoryResponse = {
  id: string;
  name: string;
  sub_category_code: string;
  message: string;
};

type DeleteSubCategoryResponse = {
  id: string;
  message: string;
};

type ListSubCategoryResponse = {
  categories: SubCategoryItem[];
  message: string;
};

type SubCategoryStore = {
  subCategories: SubCategoryItem[];
  isLoading: boolean;
  error: string | null;
  fetchSubCategories: () => Promise<SubCategoryItem[]>;
  getSubCategoryById: (id: string) => SubCategoryItem | undefined;
  createSubCategory: (data: CreateSubCategoryInput) => Promise<SubCategoryResponse>;
  updateSubCategory: (id: string, data: CreateSubCategoryInput) => Promise<SubCategoryResponse>;
  deleteSubCategory: (id: string) => Promise<DeleteSubCategoryResponse>;
  clearError: () => void;
};

const useSubCategoryStore = create<SubCategoryStore>((set, get) => ({
  subCategories: [],
  isLoading: false,
  error: null,

  fetchSubCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiRequestWithoutSessionInvalidation<ListSubCategoryResponse>('/sub-categories');
      set({ subCategories: response.categories ?? [] });
      return response.categories ?? [];
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to load sub-categories.',
      });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  getSubCategoryById: (id) => get().subCategories.find((item) => item.id === id),

  createSubCategory: async (data) => {
    set({ isLoading: true, error: null });
    try {
      return await apiRequest<SubCategoryResponse>('/sub-categories', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          sub_category_code: data.subCategoryCode,
          description: data.description,
          parent_category_id: data.parentCategoryId,
          active: data.active,
          featured: data.featured,
          sort_order: data.sortOrder,
          meta_title: data.metaTitle,
          meta_description: data.metaDescription,
          image_url: data.imageUrl,
        }),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updateSubCategory: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      return await apiRequest<SubCategoryResponse>(`/sub-categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: data.name,
          sub_category_code: data.subCategoryCode,
          description: data.description,
          parent_category_id: data.parentCategoryId,
          active: data.active,
          featured: data.featured,
          sort_order: data.sortOrder,
          meta_title: data.metaTitle,
          meta_description: data.metaDescription,
          image_url: data.imageUrl,
        }),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteSubCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiRequest<DeleteSubCategoryResponse>(`/sub-categories/${id}`, {
        method: 'DELETE',
      });

      set((state) => ({
        subCategories: state.subCategories.filter((item) => item.id !== id),
      }));

      return response;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to delete sub-category.',
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export function useSubCategories() {
  return useSubCategoryStore();
}
