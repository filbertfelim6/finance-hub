import { createClient } from "@/lib/supabase/client";
import type { Category, CategoryType } from "@/lib/types/database.types";

export async function getCategories(type?: CategoryType): Promise<Category[]> {
  const supabase = createClient();
  let query = supabase
    .from("categories")
    .select("*")
    .order("is_system", { ascending: false })
    .order("name", { ascending: true });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) throw error;
  return data as Category[];
}

export async function createCategory(input: {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}): Promise<Category> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}
