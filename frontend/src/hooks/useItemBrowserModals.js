import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItemActions } from './useItemActions';

/** Notes open in the full editor page; everything else opens the preview modal. */
export function useItemBrowserModals() {
  const navigate = useNavigate();
  const actions = useItemActions();
  const [detailItem, setDetailItem] = useState(null);
  const [renamingItem, setRenamingItem] = useState(null);
  const [movingItem, setMovingItem] = useState(null);

  const handleOpen = (item) => {
    if (item.type === 'note') navigate(`/app/notes/${item._id}`);
    else setDetailItem(item);
  };

  return { actions, detailItem, setDetailItem, renamingItem, setRenamingItem, movingItem, setMovingItem, handleOpen };
}
