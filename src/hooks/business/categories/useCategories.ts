import { create } from 'zustand';
import { apiRequest } from '@/lib/api';

export type CategoryItem = {
  id: string;
  name: string;
  categoryCode: string;
  description: string;
  icon: string;
  slug: string;
  parentId: string | null;
  level: number;
  productCount: number;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  subCategories: CategoryItem[];
};

export type CategoryFormData = {
  name: string;
  categoryCode: string;
  description: string;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
  imageUrl: string;
  imageName: string;
  imageSize: number;
};

export type CreateCategoryInput = Pick<
  CategoryFormData,
  'name' | 'categoryCode' | 'description' | 'metaTitle' | 'metaDescription' | 'imageUrl'
>;

type CreateCategoryResponse = {
  id: string;
  name: string;
  category_code: string;
  active: boolean;
  featured: boolean;
  sort_order: number;
  message: string;
};

type UpdateCategoryResponse = {
  id: string;
  name: string;
  category_code: string;
  active: boolean;
  featured: boolean;
  sort_order: number;
  message: string;
};

type DeleteCategoryResponse = {
  id: string;
  message: string;
};

type ListCategoryResponse = {
  categories: CategoryItem[];
  message: string;
};

type CategoryStore = {
  categories: CategoryItem[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<CategoryItem[]>;
  getCategoryById: (id: string) => CategoryItem | undefined;
  getCategoryBySlug: (slug: string) => CategoryItem | undefined;
  createCategory: (data: CreateCategoryInput) => Promise<CreateCategoryResponse>;
  updateCategory: (id: string, data: Partial<CategoryFormData>) => Promise<UpdateCategoryResponse>;
  deleteCategory: (id: string) => Promise<DeleteCategoryResponse>;
  clearError: () => void;
};

const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiRequest<ListCategoryResponse>('/categories');
      set({ categories: response.categories ?? [] });
      return response.categories ?? [];
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to load categories.',
      });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  getCategoryById: (id) => get().categories.find((category) => category.id === id),

  getCategoryBySlug: (slug) => get().categories.find((category) => category.slug === slug),

  createCategory: async (data) => {
    set({ isLoading: true, error: null });
    try {
      return await apiRequest<CreateCategoryResponse>('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          category_code: data.categoryCode,
          description: data.description,
          meta_title: data.metaTitle,
          meta_description: data.metaDescription,
          image_url: data.imageUrl,
        }),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updateCategory: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiRequest<UpdateCategoryResponse>(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: data.name,
          category_code: data.categoryCode,
          description: data.description,
          meta_title: data.metaTitle,
          meta_description: data.metaDescription,
          image_url: data.imageUrl,
          active: data.active,
          featured: data.featured,
          sort_order: data.sortOrder,
        }),
      });

      set((state) => ({
        categories: state.categories.map((category) =>
          category.id === id
            ? {
                ...category,
                name: response.name,
                categoryCode: response.category_code,
                active: response.active,
                featured: response.featured,
                sortOrder: response.sort_order,
                updatedAt: new Date().toISOString(),
              }
            : category,
        ),
      }));

      return response;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiRequest<DeleteCategoryResponse>(`/categories/${id}`, {
        method: 'DELETE',
      });

      set((state) => ({
        categories: state.categories.filter((category) => category.id !== id),
      }));

      return response;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to delete category.',
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export function useCategories() {
  return useCategoryStore();
}
