import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { socialApi, groupApi, shareApi, adminCollaborationApi } from '../api/collaboration.api';
export const useFriends = () => useQuery({ queryKey: ['friends'], queryFn: socialApi.friends });
export const useFriendRequests = () => useQuery({ queryKey: ['friend-requests'], queryFn: socialApi.requests });
export const useBlocks = () => useQuery({ queryKey: ['blocks'], queryFn: socialApi.blocks });
export const useUserSearch = (q) => useQuery({ queryKey: ['user-search', q], queryFn: () => socialApi.search(q), enabled: Boolean(q) });
export const useGroups = () => useQuery({ queryKey: ['groups'], queryFn: groupApi.mine });
export const useGroupInvitations = () => useQuery({ queryKey: ['group-invitations'], queryFn: groupApi.invitations });
export const useGroupSearch = (q) => useQuery({ queryKey: ['group-search', q], queryFn: () => groupApi.search(q), enabled: Boolean(q) });
export const useReceivedShares = (cursor) => useQuery({ queryKey: ['received-shares', cursor], queryFn: () => shareApi.received(cursor) });
export const useOutgoingShares = () => useQuery({ queryKey: ['outgoing-shares'], queryFn: shareApi.outgoing });
export const useItemShares = (itemId) => useQuery({ queryKey: ['item-shares', itemId], queryFn: () => shareApi.item(itemId), enabled: Boolean(itemId) });
export const useAdminCollaboration = (kind, page, enabled) => useQuery({
  queryKey: ['admin-collaboration', kind, page], queryFn: () => adminCollaborationApi.list(kind, page), enabled,
});
export function useCollaborationAction(action) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      for (const key of ['friends', 'friend-requests', 'blocks', 'user-search', 'groups',
        'group-invitations', 'group-search', 'received-shares', 'outgoing-shares',
        'item-shares', 'admin-collaboration']) cache.invalidateQueries({ queryKey: [key] });
    },
  });
}
