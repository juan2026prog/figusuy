import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { findMatches } from '../lib/matching'

export const useAppStore = create((set, get) => ({
  albums: [],
  selectedAlbum: null,
  userAlbums: [],

  ownedStickers: [],
  missingStickers: [],
  duplicateStickers: [],
  albumStickers: [],

  matches: [],
  matchesLoading: false,

  chats: [],
  currentChat: null,
  messages: [],

  loading: false,

  fetchAlbums: async () => {
    const { data } = await supabase
      .from('albums')
      .select('*')
      .eq('is_active', true)
      .order('year', { ascending: false })

    set({ albums: data || [] })
  },

  fetchUserAlbums: async (userId) => {
    if (!userId) return

    const { data } = await supabase
      .from('user_albums')
      .select('*, album:albums(*)')
      .eq('user_id', userId)

    const albumsWithProgress = await Promise.all(
      (data || []).map(async (ua) => {
        const [missingRes, ownedRes, duplicateRes] = await Promise.all([
          supabase.from('stickers_missing').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('album_id', ua.album_id),
          supabase.from('stickers_owned').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('album_id', ua.album_id),
          supabase.from('stickers_duplicate').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('album_id', ua.album_id)
        ])

        return { 
          ...ua, 
          missingCount: missingRes.count || 0,
          ownedCount: ownedRes.count || 0,
          duplicateCount: duplicateRes.count || 0
        }
      })
    )

    set({ userAlbums: albumsWithProgress })

    const currentSelected = get().selectedAlbum
    if (!currentSelected && albumsWithProgress.length > 0) {
      await get().selectAlbum(albumsWithProgress[0].album, userId)
    }
  },

  selectAlbum: async (album, userId) => {
    set({ selectedAlbum: album, loading: true })

    if (userId) {
      const { error } = await supabase
        .from('user_albums')
        .upsert(
          { user_id: userId, album_id: album.id },
          { onConflict: 'user_id,album_id' }
        )
      
      if (error) {
        set({ loading: false })
        return { error }
      }
    }

    await get().fetchStickers(userId, album.id)
    set({ loading: false })
    return { error: null }
  },

  fetchStickers: async (userId, albumId) => {
    if (!userId || !albumId) return

    const [ownedRes, missingRes, dupRes, albumStickersRes] = await Promise.all([
      supabase
        .from('stickers_owned')
        .select('*')
        .eq('user_id', userId)
        .eq('album_id', albumId)
        .order('sticker_number'),
      supabase
        .from('stickers_missing')
        .select('*')
        .eq('user_id', userId)
        .eq('album_id', albumId)
        .order('sticker_number'),
      supabase
        .from('stickers_duplicate')
        .select('*')
        .eq('user_id', userId)
        .eq('album_id', albumId)
        .order('sticker_number'),
      supabase
        .from('album_stickers')
        .select('*')
        .eq('album_id', albumId)
    ])

    const newOwned = ownedRes.data || []
    const newMissing = missingRes.data || []
    const newDuplicate = dupRes.data || []
    const newAlbumStickers = albumStickersRes.data || []

    const currentUserAlbums = get().userAlbums || []
    const updatedUserAlbums = currentUserAlbums.map(ua => {
      if (ua.album_id === albumId) {
        return {
          ...ua,
          ownedCount: newOwned.length,
          missingCount: newMissing.length,
          duplicateCount: newDuplicate.length
        }
      }
      return ua
    })

    set({
      ownedStickers: newOwned,
      missingStickers: newMissing,
      duplicateStickers: newDuplicate,
      albumStickers: newAlbumStickers,
      userAlbums: updatedUserAlbums
    })
  },

  addOwnedSticker: async (userId, albumId, stickerNumber) => {
    const { error } = await supabase
      .from('stickers_owned')
      .upsert(
        { user_id: userId, album_id: albumId, sticker_number: stickerNumber },
        { onConflict: 'user_id,album_id,sticker_number' }
      )

    if (!error) {
      await Promise.all([
        supabase
          .from('stickers_missing')
          .delete()
          .eq('user_id', userId)
          .eq('album_id', albumId)
          .eq('sticker_number', stickerNumber),
        supabase
          .from('stickers_duplicate')
          .delete()
          .eq('user_id', userId)
          .eq('album_id', albumId)
          .eq('sticker_number', stickerNumber),
      ])

      await get().fetchStickers(userId, albumId)
    } else {
      console.error('Error in addOwnedSticker:', error)
      throw error
    }
  },

  addMissingSticker: async (userId, albumId, stickerNumber) => {
    const { error } = await supabase
      .from('stickers_missing')
      .upsert(
        { user_id: userId, album_id: albumId, sticker_number: stickerNumber },
        { onConflict: 'user_id,album_id,sticker_number' }
      )

    if (!error) {
      await Promise.all([
        supabase
          .from('stickers_duplicate')
          .delete()
          .eq('user_id', userId)
          .eq('album_id', albumId)
          .eq('sticker_number', stickerNumber),
        supabase
          .from('stickers_owned')
          .delete()
          .eq('user_id', userId)
          .eq('album_id', albumId)
          .eq('sticker_number', stickerNumber),
      ])

      await get().fetchStickers(userId, albumId)
    } else {
      console.error('Error in addMissingSticker:', error)
      throw error
    }
  },

  addDuplicateSticker: async (userId, albumId, stickerNumber) => {
    const { error } = await supabase
      .from('stickers_duplicate')
      .upsert(
        { user_id: userId, album_id: albumId, sticker_number: stickerNumber },
        { onConflict: 'user_id,album_id,sticker_number' }
      )

    if (!error) {
      await Promise.all([
        supabase
          .from('stickers_missing')
          .delete()
          .eq('user_id', userId)
          .eq('album_id', albumId)
          .eq('sticker_number', stickerNumber),
        supabase
          .from('stickers_owned')
          .delete()
          .eq('user_id', userId)
          .eq('album_id', albumId)
          .eq('sticker_number', stickerNumber),
      ])

      await get().fetchStickers(userId, albumId)
    } else {
      console.error('Error in addDuplicateSticker:', error)
      throw error
    }
  },

  removeStickerStatus: async (userId, albumId, stickerNumber) => {
    await Promise.all([
      supabase
        .from('stickers_owned')
        .delete()
        .eq('user_id', userId)
        .eq('album_id', albumId)
        .eq('sticker_number', stickerNumber),
      supabase
        .from('stickers_missing')
        .delete()
        .eq('user_id', userId)
        .eq('album_id', albumId)
        .eq('sticker_number', stickerNumber),
      supabase
        .from('stickers_duplicate')
        .delete()
        .eq('user_id', userId)
        .eq('album_id', albumId)
        .eq('sticker_number', stickerNumber),
    ])

    await get().fetchStickers(userId, albumId)
  },

  bulkAddStickers: async (userId, albumId, numbers, type) => {
    const tableByType = {
      have: 'stickers_owned',
      missing: 'stickers_missing',
      duplicate: 'stickers_duplicate',
    }

    const targetTable = tableByType[type]
    if (!targetTable) return

    const rows = numbers.map((n) => ({
      user_id: userId,
      album_id: albumId,
      sticker_number: n,
    }))

    await Promise.all(
      numbers.map((n) =>
        Promise.all([
          supabase
            .from('stickers_owned')
            .delete()
            .eq('user_id', userId)
            .eq('album_id', albumId)
            .eq('sticker_number', n),
          supabase
            .from('stickers_missing')
            .delete()
            .eq('user_id', userId)
            .eq('album_id', albumId)
            .eq('sticker_number', n),
          supabase
            .from('stickers_duplicate')
            .delete()
            .eq('user_id', userId)
            .eq('album_id', albumId)
            .eq('sticker_number', n),
        ])
      )
    )

    await supabase
      .from(targetTable)
      .upsert(rows, { onConflict: 'user_id,album_id,sticker_number' })

    await get().fetchStickers(userId, albumId)
  },

  findMatches: async (userId, albumId, userProfile) => {
    set({ matchesLoading: true })

    try {
      const { data, error } = await supabase.functions.invoke('find-matches', {
        body: { albumId },
      })

      if (error) throw error

      set({ matches: data.matches || [], matchesLoading: false })
    } catch (err) {
      console.error('Match error:', err)
      set({ matchesLoading: false })
    }
  },

  fetchChats: async (userId) => {
    if (!userId) return

    const { data } = await supabase
      .from('chats')
      .select(`
        *,
        profile1:profiles!chats_user_1_fkey(id,name,avatar_url,city,department,is_premium,plan_name,is_verified),
        profile2:profiles!chats_user_2_fkey(id,name,avatar_url,city,department,is_premium,plan_name,is_verified)
      `)
      .or(`user_1.eq.${userId},user_2.eq.${userId}`)

    const sortedData = (data || []).sort((a, b) => {
      const timeA = new Date(a.last_message_at || a.created_at).getTime()
      const timeB = new Date(b.last_message_at || b.created_at).getTime()
      return timeB - timeA
    })

    set({ chats: sortedData })
  },

  createOrGetChat: async (userId, otherUserId, albumId) => {
    const { data: existing } = await supabase
      .from('chats')
      .select('*')
      .or(
        `and(user_1.eq.${userId},user_2.eq.${otherUserId}),and(user_1.eq.${otherUserId},user_2.eq.${userId})`
      )
      .eq('album_id', albumId)
      .maybeSingle()

    if (existing) return existing

    const { data: newChat, error } = await supabase
      .from('chats')
      .insert({
        user_1: userId,
        user_2: otherUserId,
        album_id: albumId,
      })
      .select()
      .single()

    if (error) throw error
    return newChat
  },

  fetchMessages: async (chatId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    set({ messages: data || [] })
  },

  sendMessage: async (chatId, senderId, text) => {
    const { error } = await supabase
      .from('messages')
      .insert({ chat_id: chatId, sender_id: senderId, text })

    if (!error) {
      await get().fetchMessages(chatId)
    }
  },

  subscribeToMessages: (chatId) => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          set((state) => ({
            messages: [...state.messages, payload.new],
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}))