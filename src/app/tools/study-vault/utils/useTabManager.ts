import { useState, useCallback } from "react";
import { TabItem, PdfEntry } from "./types";

export const DEFAULT_TAB_CONFIG: Omit<TabItem, "id" | "pdfEntry"> = {
  tool: "select",
  penColor: "#1e1e1e",
  highlightColor: "#fbbf24",
  penSize: 3,
  currentPage: 1,
  totalPages: 0,
  scale: 1.3,
  nasPanelOpen: false,
  rotation: 0,
};

export const useTabManager = () => {
  const [state, setState] = useState<{ tabs: TabItem[]; activeTab: number }>({
    tabs: [],
    activeTab: 0,
  });

  const addTab = useCallback((tabData: { pdfEntry: PdfEntry; rotation?: number }) => {
    setState((prev) => {
      const existingIdx = prev.tabs.findIndex((t) => t.pdfEntry?.id === tabData.pdfEntry?.id);
      if (existingIdx >= 0) return { ...prev, activeTab: existingIdx };
      const newTab: TabItem = {
        ...DEFAULT_TAB_CONFIG,
        ...tabData,
        id: tabData.pdfEntry.id + "_tab",
        rotation: tabData.rotation || 0,
      };
      const newTabs = [...prev.tabs, newTab];
      return { tabs: newTabs, activeTab: newTabs.length - 1 };
    });
  }, []);

  const updateTab = useCallback((index: number, updates: Partial<TabItem>) => {
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((tab, i) => (i === index ? { ...tab, ...updates } : tab)),
    }));
  }, []);

  const closeTab = useCallback((index: number) => {
    setState((prev) => {
      const newTabs = prev.tabs.filter((_, i) => i !== index);
      const newActive =
        prev.activeTab >= newTabs.length
          ? Math.max(0, newTabs.length - 1)
          : prev.activeTab > index
          ? prev.activeTab - 1
          : prev.activeTab;
      return { tabs: newTabs, activeTab: newActive };
    });
  }, []);

  const setActiveTab = useCallback((idx: number | ((prevIdx: number) => number)) => {
    setState((prev) => ({
      ...prev,
      activeTab: typeof idx === "function" ? idx(prev.activeTab) : idx,
    }));
  }, []);

  const patchTab = useCallback((index: number, updates: Partial<TabItem>) => {
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((tab, i) => (i === index ? { ...tab, ...updates } : tab)),
    }));
  }, []);

  return {
    tabs: state.tabs,
    activeTab: state.activeTab,
    addTab,
    updateTab,
    closeTab,
    patchTab,
    setActiveTab,
  };
};
