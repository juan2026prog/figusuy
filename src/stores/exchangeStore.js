import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useExchangeStore = create((set, get) => ({
  completions: {},
  triggers: {},
  loading: false,

  fetchCompletionState: async (chatId) => {
    if (!chatId) return null

    try {
      const { data, error } = await supabase.rpc('get_exchange_completion_state', {
        p_chat_id: chatId,
      })
      if (error) throw error

      set((state) => ({
        completions: {
          ...state.completions,
          [chatId]: data?.completion || null,
        },
        triggers: {
          ...state.triggers,
          [chatId]: data?.trigger || null,
        },
      }))

      return data
    } catch (err) {
      console.error('Error fetching exchange completion state:', err)
      return null
    }
  },

  submitResponse: async (chatId, userId, response) => {
    if (!chatId || !userId || !response) return null
    set({ loading: true })
    try {
      const { error } = await supabase.rpc('handle_exchange_response', {
        p_chat_id: chatId,
        p_user_id: userId,
        p_response: response
      })

      if (error) throw error

      return await get().fetchCompletionState(chatId)
    } catch (err) {
      console.error('Error submitting response:', err)
      return null
    } finally {
      set({ loading: false })
    }
  },

  getChatCompletionState: (chatId) => ({
    completion: get().completions[chatId] || null,
    trigger: get().triggers[chatId] || null,
  }),

  reset: () => set({ completions: {}, triggers: {}, loading: false }),
}))
