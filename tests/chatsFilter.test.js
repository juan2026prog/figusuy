import { describe, it, expect } from 'vitest'

const getOtherUser = (chat, currentUserId) => {
  return chat.user_1 === currentUserId ? chat.profile2 : chat.profile1
}

const isChatUnanswered = (chat, currentUserId) => {
  const hasMessage = Boolean(chat.last_message_preview || chat.last_message_at || chat.last_sender_id)
  if (!hasMessage) return false
  const other = getOtherUser(chat, currentUserId)
  if (chat.last_sender_id) {
    return chat.last_sender_id === other?.id && chat.last_sender_id !== currentUserId
  }
  return false
}

describe('ChatsList - Sin Responder Semantics', () => {
  const currentUserId = 'user-me'
  const otherUserId = 'user-other'

  it('should return false if chat has no messages (new chat without activity)', () => {
    const chat = {
      id: 'chat-1',
      user_1: currentUserId,
      user_2: otherUserId,
      profile1: { id: currentUserId, name: 'Me' },
      profile2: { id: otherUserId, name: 'Other' },
      last_message_preview: null,
      last_message_at: null,
      last_sender_id: null,
    }

    expect(isChatUnanswered(chat, currentUserId)).toBe(false)
  })

  it('should return false if the last message was sent by the current user', () => {
    const chat = {
      id: 'chat-2',
      user_1: currentUserId,
      user_2: otherUserId,
      profile1: { id: currentUserId, name: 'Me' },
      profile2: { id: otherUserId, name: 'Other' },
      last_message_preview: '¿Tenés la figurita 45?',
      last_message_at: '2026-05-01T12:00:00Z',
      last_sender_id: currentUserId,
    }

    expect(isChatUnanswered(chat, currentUserId)).toBe(false)
  })

  it('should return true if the last message was sent by the other user (waiting for current user reply)', () => {
    const chat = {
      id: 'chat-3',
      user_1: currentUserId,
      user_2: otherUserId,
      profile1: { id: currentUserId, name: 'Me' },
      profile2: { id: otherUserId, name: 'Other' },
      last_message_preview: 'Dale, nos encontramos a las 18hs en el shopping',
      last_message_at: '2026-05-01T12:30:00Z',
      last_sender_id: otherUserId,
    }

    expect(isChatUnanswered(chat, currentUserId)).toBe(true)
  })

  it('should handle chats where current user is user_2 correctly', () => {
    const chat = {
      id: 'chat-4',
      user_1: otherUserId,
      user_2: currentUserId,
      profile1: { id: otherUserId, name: 'Other' },
      profile2: { id: currentUserId, name: 'Me' },
      last_message_preview: 'Hola, te queda la 12?',
      last_message_at: '2026-05-01T13:00:00Z',
      last_sender_id: otherUserId,
    }

    expect(isChatUnanswered(chat, currentUserId)).toBe(true)
  })
})
