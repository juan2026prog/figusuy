import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const usePublicProfileStore = create((set, get) => ({
  publicProfile: null,
  publicAlbum: null,
  loading: false,
  error: null,

  fetchPublicProfile: async (username, visitorId) => {
    set({ loading: true, error: null, publicProfile: null })
    try {
      const { data, error } = await supabase.rpc('get_public_profile', {
        p_username: username,
        p_visitor_id: visitorId || null
      })

      if (error) throw error
      if (!data) throw new Error('Perfil no encontrado')
      if (data.error) throw new Error(data.error)

      set({ publicProfile: data, loading: false })
      return data
    } catch (err) {
      console.error('Error fetching public profile:', err)
      set({ error: err.message, loading: false })
      return null
    }
  },

  fetchPublicAlbum: async (username, albumId, visitorId) => {
    // Para simplificar, obtenemos todo el perfil y filtramos el álbum.
    // Podríamos hacer un RPC específico si fuera más pesado.
    set({ loading: true, error: null, publicAlbum: null })
    try {
      const profile = await get().fetchPublicProfile(username, visitorId)
      if (!profile) return null

      const albumInfo = profile.albums.find(a => a.album_id === albumId)
      if (!albumInfo) throw new Error('Ãlbum no encontrado o privado')

      // Ahora obtenemos las faltantes y repetidas de ese usuario si están visibles.
      // Necesitamos el user_id.
      const userId = profile.id
      let missing = []
      let duplicate = []
      let checklist = []

      if (albumInfo.show_missing) {
        const { data } = await supabase.from('stickers_missing').select('sticker_number').eq('user_id', userId).eq('album_id', albumId).order('sticker_number')
        missing = (data || []).map(d => d.sticker_number)
      }

      if (albumInfo.show_repeated) {
        const { data } = await supabase.from('stickers_duplicate').select('sticker_number').eq('user_id', userId).eq('album_id', albumId).order('sticker_number')
        duplicate = (data || []).map(d => d.sticker_number)
      }

      // Si queremos un checklist visible, podríamos traer todos los stickers o owned.
      let owned = []
      if (albumInfo.show_progress) {
        const { data } = await supabase.from('stickers_owned').select('sticker_number').eq('user_id', userId).eq('album_id', albumId).order('sticker_number')
        owned = (data || []).map(d => d.sticker_number)
      }

      // Match computation (only if visitor is logged in)
      let matchInfo = {
        canGiveVisitor: [],
        visitorCanGive: [],
        mutual: false
      }

      if (visitorId && visitorId !== userId) {
        // Find what the profile owner has duplicate that visitor is missing
        const { data: duplicateData } = await supabase.from('stickers_duplicate').select('sticker_number').eq('user_id', userId).eq('album_id', albumId)
        const ownerDups = (duplicateData || []).map(d => d.sticker_number)

        const { data: missingDataVisitor } = await supabase.from('stickers_missing').select('sticker_number').eq('user_id', visitorId).eq('album_id', albumId)
        const visitorMissing = (missingDataVisitor || []).map(d => d.sticker_number)

        matchInfo.canGiveVisitor = ownerDups.filter(n => visitorMissing.includes(n))

        // Find what visitor has duplicate that profile owner is missing
        const { data: missingDataOwner } = await supabase.from('stickers_missing').select('sticker_number').eq('user_id', userId).eq('album_id', albumId)
        const ownerMissing = (missingDataOwner || []).map(d => d.sticker_number)

        const { data: duplicateDataVisitor } = await supabase.from('stickers_duplicate').select('sticker_number').eq('user_id', visitorId).eq('album_id', albumId)
        const visitorDups = (duplicateDataVisitor || []).map(d => d.sticker_number)

        matchInfo.visitorCanGive = visitorDups.filter(n => ownerMissing.includes(n))
        matchInfo.mutual = matchInfo.canGiveVisitor.length > 0 && matchInfo.visitorCanGive.length > 0
      }

      const publicAlbumData = {
        ...albumInfo,
        profile,
        missing,
        duplicate,
        owned,
        matchInfo
      }

      set({ publicAlbum: publicAlbumData, loading: false })
      return publicAlbumData

    } catch (err) {
      console.error('Error fetching public album detail:', err)
      set({ error: err.message, loading: false })
      return null
    }
  }
}))
