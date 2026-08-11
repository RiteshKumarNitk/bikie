import type { AccountType } from "../domain/account-type";

export type AccountTypeMismatch =
  | { matches: true }
  | { matches: false; currentType: AccountType; requestedType: AccountType };

/**
 * ADR-053 — account-type mismatch detection, used by both signup and login's existing-number
 * branch. `accountType` is only ever changed by admin-approved Account Type Change Requests (see
 * the `account-type-requests` service) — there is deliberately no self-service switch here, this
 * function only tells the caller whether to show the "already registered as X" message.
 */
export function createAccountTypeApplication() {
  return {
    detectAccountTypeMismatch(
      session: { accountType?: string | null },
      requestedType: AccountType,
    ): AccountTypeMismatch {
      const currentType = (session.accountType ?? "RIDER") as AccountType;
      return currentType === requestedType
        ? { matches: true }
        : { matches: false, currentType, requestedType };
    },
  };
}

export type AccountTypeApplication = ReturnType<typeof createAccountTypeApplication>;
