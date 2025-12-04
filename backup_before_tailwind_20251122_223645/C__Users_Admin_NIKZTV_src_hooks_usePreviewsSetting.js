import { useSettings } from '../context/SettingsContext';

// Backwards-compatible hook that delegates to SettingsContext
export const usePreviewsSetting = () => {
  const { previewsEnabled, togglePreviews, setPreviewsEnabled } = useSettings();
  return { previewsEnabled, toggle: togglePreviews, setPreviewsEnabled };
};

export default usePreviewsSetting;
