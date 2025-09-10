import { useEffect, useCallback, useRef } from "react";

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
  onShiftTab?: () => void;
  onSpace?: () => void;
  onSlash?: () => void;
  onKeyN?: () => void;
  enabled?: boolean;
  preventDefault?: string[]; // Keys that should prevent default behavior
}

export const useKeyboardNavigation = (
  options: KeyboardNavigationOptions = {}
) => {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    onSpace,
    onSlash,
    onKeyN,
    enabled = true,
    preventDefault = [],
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const { key, shiftKey, ctrlKey, altKey, metaKey } = event;

      // Don't handle if modifier keys are pressed (except Shift for Shift+Tab)
      if ((ctrlKey || altKey || metaKey) && !(shiftKey && key === "Tab")) {
        return;
      }

      // Don't handle if focus is on input elements (except for specific keys)
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          activeElement.getAttribute("contenteditable") === "true");

      // Allow slash and escape even on inputs
      if (isInputFocused && key !== "/" && key !== "Escape") {
        return;
      }

      // Prevent default behavior for specified keys
      if (preventDefault.includes(key)) {
        event.preventDefault();
      }

      switch (key) {
        case "Escape":
          event.preventDefault();
          onEscape?.();
          break;
        case "Enter":
          if (!isInputFocused) {
            event.preventDefault();
            onEnter?.();
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          onArrowUp?.();
          break;
        case "ArrowDown":
          event.preventDefault();
          onArrowDown?.();
          break;
        case "ArrowLeft":
          event.preventDefault();
          onArrowLeft?.();
          break;
        case "ArrowRight":
          event.preventDefault();
          onArrowRight?.();
          break;
        case "Tab":
          if (shiftKey) {
            onShiftTab?.();
          } else {
            onTab?.();
          }
          break;
        case " ":
          if (!isInputFocused) {
            event.preventDefault();
            onSpace?.();
          }
          break;
        case "/":
          if (!isInputFocused) {
            event.preventDefault();
            onSlash?.();
          }
          break;
        case "n":
        case "N":
          if (!isInputFocused) {
            event.preventDefault();
            onKeyN?.();
          }
          break;
      }
    },
    [
      enabled,
      onEscape,
      onEnter,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onTab,
      onShiftTab,
      onSpace,
      onSlash,
      onKeyN,
      preventDefault,
    ]
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);
};

// Hook for managing focus within a container
export const useFocusManagement = () => {
  const containerRef = useRef<HTMLElement>(null);

  const focusFirst = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    firstElement?.focus();
  }, []);

  const focusLast = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;
    lastElement?.focus();
  }, []);

  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    if (event.key === "Tab") {
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }
  }, []);

  return {
    containerRef,
    focusFirst,
    focusLast,
    trapFocus,
  };
};

// Hook for announcing changes to screen readers
export const useScreenReaderAnnouncements = () => {
  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      const announcement = document.createElement("div");
      announcement.setAttribute("aria-live", priority);
      announcement.setAttribute("aria-atomic", "true");
      announcement.setAttribute("class", "sr-only");
      announcement.textContent = message;

      document.body.appendChild(announcement);

      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    },
    []
  );

  return { announce };
};
