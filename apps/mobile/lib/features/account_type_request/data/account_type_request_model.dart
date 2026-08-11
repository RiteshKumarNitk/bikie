import 'package:freezed_annotation/freezed_annotation.dart';

part 'account_type_request_model.freezed.dart';
part 'account_type_request_model.g.dart';

/// ADR-053 — mirrors `packages/types/src/account-type-request.ts` `AccountTypeChangeRequestDTO`.
@freezed
class AccountTypeChangeRequest with _$AccountTypeChangeRequest {
  const factory AccountTypeChangeRequest({
    required String id,
    required String currentType,
    required String requestedType,
    required String reason,
    String? supportingInfo,
    required String status,
    String? adminRemarks,
    String? reviewedByName,
    String? reviewedAt,
    required String createdAt,
  }) = _AccountTypeChangeRequest;

  factory AccountTypeChangeRequest.fromJson(Map<String, dynamic> json) =>
      _$AccountTypeChangeRequestFromJson(json);
}
