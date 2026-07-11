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
  updateCategory: (id: string, data: Partial<CategoryFormData>) => Promise<CategoryItem | null>;
  deleteCategory: (id: string) => Promise<boolean>;
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
      let updatedCategory: CategoryItem | null = null;

      set((state) => ({
        categories: state.categories.map((category) => {
          if (category.id !== id) {
            return category;
          }

          updatedCategory = {
            ...category,
            name: data.name?.trim() ?? category.name,
            categoryCode: data.categoryCode?.trim() ?? category.categoryCode,
            description: data.description?.trim() ?? category.description,
            active: data.active ?? category.active,
            featured: data.featured ?? category.featured,
            sortOrder: data.sortOrder ?? category.sortOrder,
            updatedAt: new Date().toISOString(),
          };

          return updatedCategory;
        }),
      }));

      return updatedCategory;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        categories: state.categories.filter((category) => category.id !== id),
      }));
      return true;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export function useCategories() {
  return useCategoryStore();
}
