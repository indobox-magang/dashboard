"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

let showToastImpl: ((msg: string) => void) | null = null;

export function toast(msg: string) {
  showToastImpl?.(msg);
}

export function ToastHost() {
  const [msg, setMsg] = useState("");
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    showToastImpl = (m) => {
      setMsg(m);
      setVisible(true);
      window.setTimeout(() => setVisible(false), 2500);
    };
    return () => {
      showToastImpl = null;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed right-5 bottom-5 z-50 rounded-lg bg-[#172439] px-4 py-3 text-[13px] text-white shadow-lg transition ${
        visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
      }`}
    >
      {msg}
    </div>,
    document.body
  );
}
