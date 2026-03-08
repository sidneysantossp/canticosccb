import { getSiteConfigMap, slugifyAdminText, upsertSiteConfigEntries } from '@/lib/admin/adminTableUtils';

const CONFIG_KEY = 'admin_promotions';

export interface PromotionRecord {
  id: string;
  title: string;
  description?: string;
  promotion_type: 'discount' | 'trial' | 'upgrade' | 'bundle' | 'referral';
  discount_type: 'percentage' | 'fixed' | 'free';
  discount_value: number;
  promo_code: string;
  max_uses?: number;
  uses_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  clicks_count: number;
  conversions_count: number;
  revenue_generated: number;
  created_at: string;
  updated_at: string;
}

export interface PromotionInput {
  title: string;
  description?: string;
  promotion_type: PromotionRecord['promotion_type'];
  discount_type: PromotionRecord['discount_type'];
  discount_value: number;
  promo_code: string;
  max_uses?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const fallbackId = () => `promotion_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const parsePromotions = (value?: string): PromotionRecord[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((row: any) => ({
      id: String(row?.id || fallbackId()),
      title: String(row?.title || '').trim(),
      description: row?.description || undefined,
      promotion_type: row?.promotion_type || 'discount',
      discount_type: row?.discount_type || 'percentage',
      discount_value: Number(row?.discount_value || 0),
      promo_code: String(row?.promo_code || '').trim().toUpperCase(),
      max_uses: row?.max_uses != null ? Number(row.max_uses) : undefined,
      uses_count: Number(row?.uses_count || 0),
      start_date: row?.start_date || '',
      end_date: row?.end_date || '',
      is_active: row?.is_active !== false,
      clicks_count: Number(row?.clicks_count || 0),
      conversions_count: Number(row?.conversions_count || 0),
      revenue_generated: Number(row?.revenue_generated || 0),
      created_at: row?.created_at || new Date().toISOString(),
      updated_at: row?.updated_at || row?.created_at || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
};

const loadPromotions = async (): Promise<PromotionRecord[]> => {
  const config = await getSiteConfigMap([CONFIG_KEY]);
  return parsePromotions(config[CONFIG_KEY]).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

const savePromotions = async (promotions: PromotionRecord[]) => {
  await upsertSiteConfigEntries({
    [CONFIG_KEY]: JSON.stringify(promotions),
  });
};

const normalizeCode = (value: string) => slugifyAdminText(value).replace(/-/g, '').toUpperCase();

export const getAllPromotions = async (): Promise<PromotionRecord[]> => loadPromotions();

export const getPromotionById = async (id: string): Promise<PromotionRecord | null> => {
  const promotions = await loadPromotions();
  return promotions.find((promotion) => promotion.id === id) || null;
};

export const createPromotion = async (
  data: PromotionInput
): Promise<{ success: boolean; promotion: PromotionRecord }> => {
  const promotions = await loadPromotions();
  const promoCode = normalizeCode(data.promo_code);

  if (!data.title.trim() || !promoCode) {
    throw new Error('Título e código promocional são obrigatórios.');
  }

  if (promotions.some((promotion) => promotion.promo_code === promoCode)) {
    throw new Error('Já existe uma promoção com este código.');
  }

  const now = new Date().toISOString();
  const promotion: PromotionRecord = {
    id: fallbackId(),
    title: data.title.trim(),
    description: data.description?.trim() || undefined,
    promotion_type: data.promotion_type,
    discount_type: data.discount_type,
    discount_value: Number(data.discount_value || 0),
    promo_code: promoCode,
    max_uses: data.max_uses && data.max_uses > 0 ? Number(data.max_uses) : undefined,
    uses_count: 0,
    start_date: data.start_date,
    end_date: data.end_date,
    is_active: data.is_active,
    clicks_count: 0,
    conversions_count: 0,
    revenue_generated: 0,
    created_at: now,
    updated_at: now,
  };

  await savePromotions([...promotions, promotion]);
  return { success: true, promotion };
};

export const updatePromotion = async (
  id: string,
  data: PromotionInput
): Promise<{ success: boolean; promotion: PromotionRecord }> => {
  const promotions = await loadPromotions();
  const promoCode = normalizeCode(data.promo_code);

  if (!data.title.trim() || !promoCode) {
    throw new Error('Título e código promocional são obrigatórios.');
  }

  if (promotions.some((promotion) => promotion.id !== id && promotion.promo_code === promoCode)) {
    throw new Error('Já existe uma promoção com este código.');
  }

  let updatedPromotion: PromotionRecord | null = null;
  const updatedPromotions = promotions.map((promotion) => {
    if (promotion.id !== id) return promotion;

    updatedPromotion = {
      ...promotion,
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      promotion_type: data.promotion_type,
      discount_type: data.discount_type,
      discount_value: Number(data.discount_value || 0),
      promo_code: promoCode,
      max_uses: data.max_uses && data.max_uses > 0 ? Number(data.max_uses) : undefined,
      start_date: data.start_date,
      end_date: data.end_date,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    };

    return updatedPromotion;
  });

  if (!updatedPromotion) {
    throw new Error('Promoção não encontrada.');
  }

  await savePromotions(updatedPromotions);
  return { success: true, promotion: updatedPromotion };
};

export const deletePromotion = async (id: string): Promise<{ success: boolean }> => {
  const promotions = await loadPromotions();
  await savePromotions(promotions.filter((promotion) => promotion.id !== id));
  return { success: true };
};

export const togglePromotionStatus = async (id: string): Promise<{ success: boolean }> => {
  const promotions = await loadPromotions();
  const updatedPromotions = promotions.map((promotion) =>
    promotion.id === id
      ? { ...promotion, is_active: !promotion.is_active, updated_at: new Date().toISOString() }
      : promotion
  );

  await savePromotions(updatedPromotions);
  return { success: true };
};
