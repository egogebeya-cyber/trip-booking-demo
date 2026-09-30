/** When false, public site routes show read-only content even for logged-in admins. Admin panel (/admin) is unchanged. */
export const ENABLE_PUBLIC_INLINE_EDIT = false

export function publicInlineEditEnabled(isAdminUser: boolean) {
  return ENABLE_PUBLIC_INLINE_EDIT && isAdminUser
}
