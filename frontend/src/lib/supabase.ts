import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Deshabilitar auto-refresh ya que usamos JWT personalizado
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Helper para verificar si Supabase está configurado
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// Helper para Storage (imágenes de productos)
export const uploadProductImage = async (
  file: File,
  tenantId: string,
  productId: string
): Promise<string | null> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase no está configurado. Upload deshabilitado.');
    return null;
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${tenantId}/${productId}-${Date.now()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path);

  return publicUrl;
};

// Helper para eliminar imagen
export const deleteProductImage = async (imageUrl: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    // Extraer path de la URL
    const url = new URL(imageUrl);
    const path = url.pathname.split('/storage/v1/object/public/product-images/')[1];

    if (!path) {
      console.error('Invalid image URL');
      return false;
    }

    const { error } = await supabase.storage
      .from('product-images')
      .remove([path]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error parsing image URL:', error);
    return false;
  }
};

// Helper para Realtime (sincronización de ventas entre cajas)
export const subscribeToSalesChannel = (
  tenantId: string,
  onSaleCreated: (payload: any) => void
) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase no está configurado. Realtime deshabilitado.');
    return null;
  }

  const channel = supabase
    .channel(`sales:${tenantId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sale',
        filter: `tenantId=eq.${tenantId}`
      },
      (payload) => {
        console.log('Nueva venta detectada:', payload);
        onSaleCreated(payload.new);
      }
    )
    .subscribe();

  return channel;
};

// Helper para desuscribirse de canal Realtime
export const unsubscribeFromChannel = (channel: any) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};
