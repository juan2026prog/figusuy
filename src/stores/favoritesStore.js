import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useFavoritesStore = create((set, get) => ({
  favorites: [],
  favoriteIds: new Set(),
  loading: false,

  fetchFavorites: async (userId) => {
    if (!userId) return
    set({ loading: true })
    const { data, error } = await supabase
      .from('user_favorites')
      .select('favorite_user_id, profile:profiles!user_favorites_favorite_user_id_fkey(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      set({ 
        favorites: data, 
        favoriteIds: new Set(data.map(f => f.favorite_user_id)),
        loading: false 
      })
    } else {
      set({ loading: false })
    }
  },

  addFavorite: async (userId, favoriteUserId) => {
    if (!userId || !favoriteUserId) return
    
    const currentIds = get().favoriteIds
    const nextIds = new Set(currentIds)
    nextIds.add(favoriteUserId)
    set({ favoriteIds: nextIds })
    
    const { error } = await supabase
      .from('user_favorites')
      .insert({ user_id: userId, favorite_user_id: favoriteUserId })

    if (error) {
      console.error(error)
    }
    // Refresh to get the populated profile
    await get().fetchFavorites(userId)
  },

  removeFavorite: async (userId, favoriteUserId) => {
    if (!userId || !favoriteUserId) return

    const currentIds = get().favoriteIds
    const nextIds = new Set(currentIds)
    nextIds.delete(favoriteUserId)
    set({ favoriteIds: nextIds })

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('favorite_user_id', favoriteUserId)

    if (error) {
      console.error(error)
    }
    await get().fetchFavorites(userId)
  },

  toggleFavorite: async (userId, favoriteUserId) => {
    if (get().favoriteIds.has(favoriteUserId)) {
      await get().removeFavorite(userId, favoriteUserId)
    } else {
      await get().addFavorite(userId, favoriteUserId)
    }
  }
}))
