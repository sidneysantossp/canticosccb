import { supabase, signInWithEmail, signUpWithEmail, signOut as supabaseSignOut } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Service for authentication and user management
 */
export class AuthService {
  /**
   * Sign up with email and password
   */
  static async signUp(email: string, password: string, name: string) {
    try {
      const { data, error } = await signUpWithEmail(email, password, name);
      
      if (error) throw error;
      
      return {
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await signInWithEmail(email, password);
      
      if (error) throw error;
      
      return {
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign in with Google
   */
  static async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign in with Facebook
   */
  static async signInWithFacebook() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign out
   */
  static async signOut() {
    try {
      await supabaseSignOut();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    return user;
  }

  /**
   * Get current user profile
   */
  static async getCurrentProfile() {
    const user = await this.getCurrentUser();
    
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: Partial<Profile>) {
    const user = await this.getCurrentUser();
    
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update user password
   */
  static async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Request password reset
   */
  static async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Update email
   */
  static async updateEmail(newEmail: string) {
    const { data, error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Upload avatar
   */
  static async uploadAvatar(file: File) {
    const user = await this.getCurrentUser();
    
    if (!user) throw new Error('No user logged in');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update profile
    await this.updateProfile({ avatar_url: publicUrl });

    return publicUrl;
  }

  /**
   * Delete account
   */
  static async deleteAccount() {
    const user = await this.getCurrentUser();
    
    if (!user) throw new Error('No user logged in');

    // Note: Supabase doesn't have a direct delete user method
    // You need to call a custom Edge Function or use the Admin API
    // This is a placeholder for the actual implementation
    
    throw new Error('Account deletion must be implemented via Edge Function');
  }

  /**
   * Check if user has premium subscription
   */
  static async hasPremium() {
    const profile = await this.getCurrentProfile();
    
    if (!profile) return false;

    if (!profile.is_premium) return false;

    if (profile.premium_expires_at) {
      const expiresAt = new Date(profile.premium_expires_at);
      return expiresAt > new Date();
    }

    return profile.is_premium;
  }

  /**
   * Subscribe to auth state changes
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export default AuthService;
