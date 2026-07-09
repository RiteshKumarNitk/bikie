import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_exception.dart';
import 'empty_state.dart';

/// Renders an [AsyncValue] with consistent loading/error/empty handling,
/// conceptually mirroring `.docs/UI_GUIDELINES.md`'s `Skeleton`/`EmptyState`.
class AsyncValueView<T> extends StatelessWidget {
  const AsyncValueView({
    super.key,
    required this.value,
    required this.data,
    this.onRetry,
  });

  final AsyncValue<T> value;
  final Widget Function(T data) data;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return value.when(
      data: data,
      loading: () => const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator())),
      error: (error, stack) {
        final message = error is ApiException ? error.message : 'Something went wrong';
        return EmptyState(
          icon: Icons.error_outline,
          title: 'Couldn\'t load this',
          message: message,
          actionLabel: onRetry != null ? 'Retry' : null,
          onAction: onRetry,
        );
      },
    );
  }
}
