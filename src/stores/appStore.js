import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { findMatches } from '../lib/matching'

export const useAppStore = create((set, get) => ({
  // Albums
  albums: [],
  selectedAlbum: null,
  userAlbums: [],

  // Stickers
  missingStickers: [],
  duplicateStickers: [],

  // Matches
  matches: [],
  matchesLoading: false,

  // Chats
  chats: [],
  currentChat: null,
  messages: [],

  // UI
  loading: false,

  // ==================
  //  ALBUMS
  // ==================
  fetchAlbums: async () => {
    const { data } = await supabase.from('albums').select('*').eq('is_active', true).order('year', { ascending: false })
    set({ albums: data || [] })
  },

  fetchUserAlbums: async (userId) => {
    if (!userId) return
    const { data } = await supabase
      .from('user_albums')
      .select('*, album:albums(*)')
      .eq('user_id', userId)
    set({ userAlbums: data || [] })
  },

  selectAlbum: async (album, userId) => {
    set({ selectedAlbum: album, loading: true })

    // Ensure user_album exists
    if (userId) {
      await supabase
        .from('user_albums')
        .upsert({ user_id: userId, album_id: album.id }, { onConflict: 'user_id,album_id' })
    }

    // Fetch stickers
    await get().fetchStickers(userId, album.id)
    set({ loading: false })
  },

  // ==================
  //  STICKERS
  // ==================
  fetchStickers: async (userId, albumId) => {
    if (!userId || !albumId) return

    const [missingRes, dupRes] = await Promise.all([
      supabase.from('stickers_missing').select('*').eq('user_id', userId).eq('album_id', albumId).order('sticker_number'),
      supabase.from('stickers_duplicate').select('*').eq('user_id', userId).eq('album_id', albumId).order('sticker_number'),
    ])

    set({
      missingStickers: missingRes.data || [],
      duplicateStickers: dupRes.data || [],
    })
  },

  addMissingSticker: async (userId, albumId, stickerNumber) => {
    const { error } = await supabase
      .from('stickers_missing')
      .upsert({ user_id: userId, album_id: albumId, sticker_number: stickerNumber }, { onConflict: 'user_id,album_id,sticker_number' })

    if (!error) {
      // Remove from duplicates if it was there
      await supabase
        .from('stickers_duplicate')
        .delete()
        .eq('user_id', userId)
        .eq('album_id', albumId)
        .eq('sticker_number', stickerNumber)

      await get().fetchStickers(userId, albumId)
    }
  },

  addDuplicateSticker: async (userId, albumId, stickerNumber) => {
    const { error } = await supabase
      .from('stickers_duplicate')
      .upsert({ user_id: userId, album_id: albumId, sticker_number: stickerNumber }, { onConflict: 'user_id,album_id,sticker_number' })

    if (!error) {
      // Remove from missing if it was there
      await supabase
        .from('stickers_missing')
        .delete()
        .eq('user_id', userId)
        .eq('album_id', albumId)
        .eq('sticker_number', stickerNumber)

      await get().fetchStickers(userId, albumId)
    }
  },

  removeStickerStatus: async (userId, albumId, stickerNumber) => {
    await Promise.all([
      supabase.from('stickers_missing').delete().eq('user_id', userId).eq('album_id', albumId).eq('sticker_number', stickerNumber),
      supabase.from('stickers_duplicate').delete().eq('user_id', userId).eq('album_id', albumId).eq('sticker_number', stickerNumber),
    ])
    await get().fetchStickers(userId, albumId)
  },

  // Bulk add stickers
  bulkAddStickers: async (userId, albumId, numbers, type) => {
    const table = type === 'missing' ? 'stickers_missing' : 'stickers_duplicate'
    const otherTable = type === 'missing' ? 'stickers_duplicate' : 'stickers_missing'

    const rows = numbers.map(n => ({
      user_id: userId,
      album_id: albumId,
      sticker_number: n,
    }))

    // Remove from opposite table
    for (const n of numbers) {
      await supabase.from(otherTable).delete().eq('user_id', userId).eq('album_id', albumId).eq('sticker_number', n)
    }

    await supabase.from(table).upsert(rows, { onConflict: 'user_id,album_id,sticker_number' })
    await get().fetchStickers(userId, albumId)
  },

  // ==================
  //  MATCHES
  // ==================
  findMatches: async (userId, albumId, userProfile) => {
    set({ matchesLoading: true })

    try {
      // Get current user's stickers
      const [myMissingRes, myDuplicatesRes] = await Promise.all([
        supabase.from('stickers_missing').select('*').eq('user_id', userId).eq('album_id', albumId),
        supabase.from('stickers_duplicate').select('*').eq('user_id', userId).eq('album_id', albumId),
      ])

      const myMissing = myMissingRes.data || []
      const myDuplicates = myDuplicatesRes.data || []

      if (myMissing.length === 0 && myDuplicates.length === 0) {
        set({ matches: [], matchesLoading: false })
        return
      }

      // Get all other users who have this album
      const { data: otherUserAlbums } = await supabase
        .from('user_albums')
        .select('user_id')
        .eq('album_id', albumId)
        .neq('user_id', userId)

      if (!otherUserAlbums || otherUserAlbums.length === 0) {
        set({ matches: [], matchesLoading: false })
        return
      }

      const otherUserIds = otherUserAlbums.map(ua => ua.user_id)

      // Get profiles + stickers for all other users
      const [profilesRes, otherMissingRes, otherDuplicatesRes] = await Promise.all([
        supabase.from('profiles').select('*').in('id', otherUserIds),
        supabase.from('stickers_missing').select('*').eq('album_id', albumId).in('user_id', otherUserIds),
        supabase.from('stickers_duplicate').select('*').eq('album_id', albumId).in('user_id', otherUserIds),
      ])

      const profiles = profilesRes.data || []
      const otherMissing = otherMissingRes.data || []
      const otherDuplicates = otherDuplicatesRes.data || []

      // Build user objects for matching
      const otherUsers = profiles.map(p => ({
        ...p,
        missing: otherMissing.filter(s => s.user_id === p.id),
        duplicates: otherDuplicates.filter(s => s.user_id === p.id),
      }))

      const currentUserData = {
        ...userProfile,
        missing: myMissing,
        duplicates: myDuplicates,
      }

      const matchResults = findMatches(currentUserData, otherUsers)
      set({ matches: matchResults, matchesLoading: false })
    } catch (err) {
      console.error('Match error:', err)
      set({ matchesLoading: false })
    }
  },

  // ==================
  //  CHATS
  // ==================
  fetchChats: async (userId) => {
    if (!userId) return
    const { data } = await supabase
      .from('chats')
      .select(`
        *,
        profile1:profiles!chats_user_1_fkey(*),
        profile2:profiles!chats_user_2_fkey(*)
      `)
      .or(`user_1.eq.${userId},user_2.eq.${userId}`)
      .order('created_at', { ascending: false })

    set({ chats: data || [] })
  },

  createOrGetChat: async (userId, otherUserId, albumId) => {
    // Check if chat exists
    const { data: existing } = await supabase
      .from('chats')
      .select('*')
      .or(`and(user_1.eq.${userId},user_2.eq.${otherUserId}),and(user_1.eq.${otherUserId},user_2.eq.${userId})`)
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

  // Realtime subscriptions
  subscribeToMessages: (chatId) => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        set(state => ({
          messages: [...state.messages, payload.new],
        }))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}))
