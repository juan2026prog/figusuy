import { create } from 'zustand'

export const useLogoutStore = create((set) => ({
  isConfirmOpen: false,
  openConfirm: () => set({ isConfirmOpen: true }),
  closeConfirm: () => set({ isConfirmOpen: false }),
}))
