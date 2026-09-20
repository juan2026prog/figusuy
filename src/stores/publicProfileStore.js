import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const usePublicProfileStore = create((set, get) => ({
  publicProfile: null,
  publicAlbum: null,
  loading: false,
  error: null,

  fetchPublicProfile: async (username) => {
    set({ loading: true, error: null, publicProfile: null })
    try {
      const { data, error } = await supabase.rpc('get_public_profile', {
        p_username: username
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

  fetchPublicAlbum: async (username, albumId) => {
    set({ loading: true, error: null, publicAlbum: null })
    try {
      const profile = await get().fetchPublicProfile(username)
      if (!profile) return null

      const albumInfo = profile.albums.find(a => a.album_id === albumId)
      if (!albumInfo) throw new Error('Álbum no encontrado o privado')

      const userId = profile.id
      let missing = []
      let duplicate = []

      if (albumInfo.show_missing) {
        const { data } = await supabase.from('stickers_missing').select('sticker_number').eq('user_id', userId).eq('album_id', albumId).order('sticker_number')
        missing = (data || []).map(d => d.sticker_number)
      }

      if (albumInfo.show_repeated) {
        const { data } = await supabase.from('stickers_duplicate').select('sticker_number').eq('user_id', userId).eq('album_id', albumId).order('sticker_number')
        duplicate = (data || []).map(d => d.sticker_number)
      }

      let owned = []
      if (albumInfo.show_progress) {
        const { data } = await supabase.from('stickers_owned').select('sticker_number').eq('user_id', userId).eq('album_id', albumId).order('sticker_number')
        owned = (data || []).map(d => d.sticker_number)
      }

      // Match computation via secure server-side RPC (derives caller via auth.uid())
      let matchInfo = {
        canGiveVisitor: [],
        visitorCanGive: [],
        mutual: false
      }

      try {
        const { data: serverMatch } = await supabase.rpc('get_public_album_match', {
          p_username: username,
          p_album_id: albumId
        })
        if (serverMatch && !serverMatch.error) {
          matchInfo = {
            canGiveVisitor: serverMatch.canGiveVisitor || [],
            visitorCanGive: serverMatch.visitorCanGive || [],
            mutual: Boolean(serverMatch.mutual)
          }
        }
      } catch (matchErr) {
        console.warn('Could not load server-side match info for public album:', matchErr)
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
