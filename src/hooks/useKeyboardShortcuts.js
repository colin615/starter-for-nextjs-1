import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only handle shortcuts when not typing in input fields
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
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
  }, [router]);
}