import i18n from './config';

const groupRoleKeys = { OWNER: 'shared:roleOwner', ADMIN: 'shared:roleAdmin', MEMBER: 'shared:roleMember' };
const systemRoleKeys = { user: 'common:user', admin: 'common:administrator' };
const friendshipStatusKeys = { pending: 'shared:statusPending', accepted: 'shared:statusAccepted' };
const shareTargetKeys = { user: 'common:user', group: 'shared:group' };

const translate = (keys, value) => keys[value] ? i18n.t(keys[value]) : value;

export const groupRoleLabel = (role) => translate(groupRoleKeys, role);
export const systemRoleLabel = (role) => translate(systemRoleKeys, role);
export const friendshipStatusLabel = (status) => translate(friendshipStatusKeys, status);
export const shareTargetLabel = (type) => translate(shareTargetKeys, type);
