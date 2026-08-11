import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Mirrors the web's `SELECTED_ROLE_COOKIE` (`lib/role.ts`) — a pre-auth UI
/// preference set on `/welcome`, read by both the login and signup screens to
/// decide which role's copy/fields to show, and to detect a mismatch against an
/// existing account's real `accountType` on login. Values are `'RIDER'` /
/// `'SERVICE_PROVIDER'`, matching `UserModel.accountType` directly (ADR-053) —
/// there's nothing to translate between the two.
final selectedRoleProvider = StateProvider<String>((ref) => 'RIDER');

/// ADR-053 — pure helper, same formula as web's `isServiceProviderAccountType`
/// (`@bikie/services`): which tab set/home screen a signed-in account sees.
/// `accountType` is server-authoritative and mutually exclusive — there is no
/// "mode" to switch anymore, only this one fact read straight off the session.
bool isServiceProviderAccountType(String? accountType) => accountType == 'SERVICE_PROVIDER';
