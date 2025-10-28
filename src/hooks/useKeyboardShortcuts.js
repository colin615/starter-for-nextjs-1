import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only handle shortcuts when not typing in input fields
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable === true
      ) {
        return;
      }

      // Ignore when any modifier is held (avoid conflicting with system/browser shortcuts)
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      // Explicitly ignore Cmd/Ctrl + C (copy)
      if ((event.metaKey || event.ctrlKey) && event.key && event.key.toLowerCase() === 'c') {
        return;
      }

      // Ignore printable keys if any modifier is held (extra safety)
      if ((event.metaKey || event.ctrlKey) && event.key && event.key.length === 1) {
        return;
      }

      // Ignore when user has an active text selection (e.g., copying selected text)
      const selection = typeof window !== 'undefined' ? window.getSelection() : null;
      if (selection && selection.toString().length > 0) {
        return;
      }

      // Handle keyboard shortcuts
      switch (event.key.toLowerCase()) {
        case 'o':
          event.preventDefault();
          router.push('/dashboard');
          break;
        case 'l':
          event.preventDefault();
          router.push('/dashboard/leaderboards');
          break;
        case 's':
          event.preventDefault();
          router.push('/dashboard/slot-challenges');
          break;
        case 'w':
          event.preventDefault();
          router.push('/dashboard/widgets');
          break;
        case 'p':
          event.preventDefault();
          router.push('/dashboard/payouts');
          break;
        case 'c':
          event.preventDefault();
          router.push('/dashboard/connected-sites');
          break;
        case 'r':
          event.preventDefault();
          // Trigger filter or refresh action
          const filterButton = document.querySelector('[data-shortcut="filter"]');
          if (filterButton) {
            filterButton.click();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);
}