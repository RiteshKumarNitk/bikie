import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Mirrors the web's `SELECTED_ROLE_COOKIE` (`lib/role.ts`) — a pre-auth UI
/// preference set on `/welcome`, read by both `/login` and `/signup` to
/// decide which role's copy/fields to show and which role a brand-new
/// phone-OTP signup gets applied. Values are the real `User.role` strings
/// ("RENTER"/"PARTNER"), not a separate UI enum — there's nothing to map.
final selectedRoleProvider = StateProvider<String>((ref) => 'RENTER');
