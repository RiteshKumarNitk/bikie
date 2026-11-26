/// Readable text for API error codes that some routes return without a human `message`
/// (`{ "error": "ALREADY_OFFERED" }`). Previously the raw code itself was shown in toasts.
/// Used by `ApiException` only when the server sent no `message` of its own — a server-provided
/// message always wins. Callers still branch on `ApiException.errorCode`, which is unchanged.
const Map<String, String> kApiErrorMessages = {
  // Session / account
  'UNAUTHENTICATED': 'Please log in to continue.',
  'Unauthorized': 'Please log in to continue.',
  'ACCOUNT_RESTRICTED': 'Your account is restricted. Please contact BIKIE support.',
  'WRONG_ACCOUNT_TYPE': 'This feature isn\'t available for your account type.',
  'ADMIN_PROTECTED': 'This account can\'t be changed from the app.',
  'ALREADY_OPEN': 'You already have a pending request. Please wait for it to be reviewed.',
  'SAME_TYPE': 'Your account already has this account type.',

  // SOS
  'ALERT_NOT_ACTIVE': 'This SOS alert is no longer active.',
  'ALREADY_ASSIGNED': 'This request has already been assigned to another helper.',
  'ALREADY_OFFERED': 'You\'ve already offered to help with this request.',
  'ALREADY_RESPONDED': 'You\'ve already responded to this request.',
  'OFFER_NOT_AVAILABLE': 'This offer is no longer available.',
  'ALREADY_RATED': 'You\'ve already rated this helper.',
  'INVALID_RATING': 'Please choose a rating from 1 to 5 stars.',
  'SESSION_NOT_COMPLETED': 'You can rate the helper once assistance is complete.',
  'INVALID_TRANSITION': 'This action isn\'t available right now. Please refresh and try again.',
  'LOCATION_REQUIRED': 'Please share your location to continue.',
  'PARTNER_OFFLINE': 'Set yourself to Available to accept requests.',
  'PARTNER_NOT_APPROVED': 'This action needs a verified Service Provider account.',
  'NOT_VERIFIED': 'This action needs a verified Service Provider account.',
  'CATEGORY_MISMATCH': 'This request doesn\'t match your service type.',

  // Rides
  'TRIP_NOT_FOUND': 'This ride could not be found.',
  'ALREADY_REQUESTED': 'You\'ve already requested to join this ride.',
  'ALREADY_DECIDED': 'This request has already been approved or rejected.',
  'IS_ORGANIZER': 'You\'re the organizer of this ride.',
  'NO_SEATS': 'This ride is fully booked.',
  'SEATS_BELOW_APPROVED': 'Total seats can\'t be fewer than the riders already approved.',
  'NOT_UPCOMING': 'This ride has already started or ended.',

  // Rentals and reviews
  'BIKE_NOT_FOUND': 'This bike could not be found.',
  'BIKE_UNAVAILABLE': 'This bike isn\'t available for the selected dates.',
  'BOOKING_NOT_FOUND': 'This booking could not be found.',
  'INVALID_DATES': 'Please choose valid dates.',
  'NOT_ELIGIBLE': 'You can review a booking once it\'s complete.',
  'ALREADY_REVIEWED': 'You\'ve already reviewed this booking.',

  // Messaging
  'NOT_A_PARTICIPANT': 'You\'re not a member of this conversation.',
  'NOT_EDITABLE': 'This message can no longer be edited.',

  // Membership and payments
  'MEMBERSHIP_REQUIRED': 'An active Membership is required for this feature.',
  'PLAN_NOT_FOUND': 'This Membership plan is no longer available.',
  'ALREADY_ACTIVE': 'You already have an active Membership.',
  'ALREADY_ACTIVE_MEMBERSHIP': 'You already have an active Membership.',
  'NO_ACTIVE_SUBSCRIPTION': 'You don\'t have an active AutoPay subscription.',
  'CANCEL_FAILED': 'We couldn\'t turn off AutoPay right now. Please try again.',
  'COULD_NOT_VERIFY': 'We couldn\'t confirm your payment status with Razorpay. Please try again shortly.',
  'COULD_NOT_VERIFY_SUBSCRIPTION': 'We couldn\'t confirm your payment status with Razorpay. Please try again shortly.',
  'NOT_CONFIGURED': 'Payments are temporarily unavailable. Please try again later.',
  'CHECKOUT_UNAVAILABLE': 'Payments are temporarily unavailable. Please try again later.',
  'ONE_TIME_CHECKOUT_DISABLED': 'Membership is available with AutoPay only.',
  'ONE_TIME_PURCHASE_DISABLED': 'Membership is available with AutoPay only.',
  'ACTIVE_SUBSCRIPTION': 'Turn off AutoPay for your Membership before deleting your account.',
};

/// A bare machine code (`SOME_CODE`) with no readable text — never shown to users as-is.
final RegExp _machineCode = RegExp(r'^[A-Z][A-Z0-9_]+$');

/// Best readable message for an error [code] sent without a `message`.
String friendlyApiErrorMessage(String code) {
  final known = kApiErrorMessages[code];
  if (known != null) return known;
  if (_machineCode.hasMatch(code)) return 'Something went wrong. Please try again.';
  return code;
}
