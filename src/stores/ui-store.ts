"use client";

import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  selectedNodeId: string | null;
  detailPanelOpen: boolean;
  keyboardShortcutsVisible: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  selectNode: (id: string | null) => void;
  setDetailPanelOpen: (open: boolean) => void;
  toggleKeyboardShortcuts: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  selectedNodeId: null,
  detailPanelOpen: false,
  keyboardShortcutsVisible: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  selectNode: (id) => set({ selectedNodeId: id, detailPanelOpen: id !== null }),
  setDetailPanelOpen: (open) => set({ detailPanelOpen: open }),
  toggleKeyboardShortcuts: () =>
    set((s) => ({ keyboardShortcutsVisible: !s.keyboardShortcutsVisible })),
}));
