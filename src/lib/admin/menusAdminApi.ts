import { supabase } from '@/lib/supabase-auth';

export interface MenuItemRecord {
  id: string;
  label: string;
  url: string;
  icon?: string;
  position: number;
  isActive: boolean;
  parentId?: string | null;
}

const mapMenuItem = (row: any): MenuItemRecord => ({
  id: String(row.id),
  label: row.label || '',
  url: row.url || '',
  icon: row.icon || undefined,
  position: Number(row.position || 0),
  isActive: row.is_active !== false,
  parentId: row.parent_id || null,
});

export const getMenuItems = async (): Promise<MenuItemRecord[]> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapMenuItem);
};

export const createMenuItem = async (
  data: Omit<MenuItemRecord, 'id'>
): Promise<MenuItemRecord> => {
  const { data: created, error } = await supabase
    .from('menu_items')
    .insert({
      label: data.label.trim(),
      url: data.url.trim(),
      icon: data.icon || null,
      position: Number(data.position || 0),
      is_active: data.isActive,
      parent_id: data.parentId || null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapMenuItem(created);
};

export const updateMenuItem = async (
  id: string,
  data: Partial<Omit<MenuItemRecord, 'id'>>
): Promise<MenuItemRecord | null> => {
  const payload: Record<string, unknown> = {};
  if (data.label !== undefined) payload.label = data.label.trim();
  if (data.url !== undefined) payload.url = data.url.trim();
  if (data.icon !== undefined) payload.icon = data.icon || null;
  if (data.position !== undefined) payload.position = Number(data.position);
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  if (data.parentId !== undefined) payload.parent_id = data.parentId || null;

  const { data: updated, error } = await supabase
    .from('menu_items')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return updated ? mapMenuItem(updated) : null;
};

export const deleteMenuItem = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

export const saveMenuOrder = async (items: MenuItemRecord[]): Promise<boolean> => {
  for (const [index, item] of items.entries()) {
    const { error } = await supabase
      .from('menu_items')
      .update({ position: index + 1 })
      .eq('id', item.id);

    if (error) throw error;
  }

  return true;
};
