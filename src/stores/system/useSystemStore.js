import { create } from 'zustand';

export const useSystemStore = create((set, get) => ({
  eventQueue: [],
  activeEvent: null,

  enqueueEvent: (event) => {
    set((state) => {
      // Prevent duplicates if already in queue or active
      const isDuplicate = 
        state.activeEvent?.id === event.id || 
        state.eventQueue.some(e => e.id === event.id);
        
      if (isDuplicate) return state;

      // Handle Priority: High priority events skip to the front (but after currently active)
      if (event.priority === 'high') {
        return { eventQueue: [event, ...state.eventQueue] };
      }

      return { eventQueue: [...state.eventQueue, event] };
    });
    
    // Auto-process if nothing is active
    get().processQueue();
  },

  processQueue: () => {
    set((state) => {
      if (state.activeEvent !== null || state.eventQueue.length === 0) {
        return state;
      }
      const [nextEvent, ...remainingQueue] = state.eventQueue;
      return {
        activeEvent: nextEvent,
        eventQueue: remainingQueue
      };
    });
  },

  clearActiveEvent: () => {
    set({ activeEvent: null });
    // Process next event after a short delay for transition
    setTimeout(() => {
      get().processQueue();
    }, 500);
  },

  clearQueue: () => {
    set({ eventQueue: [], activeEvent: null });
  }
}));
