import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/async_value_view.dart';
import '../../../core/widgets/empty_state.dart';
import '../domain/wishlist_providers.dart';

class WishlistScreen extends ConsumerWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wishlist = ref.watch(wishlistProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Wishlist')),
      body: AsyncValueView(
        value: wishlist,
        onRetry: () => ref.invalidate(wishlistProvider),
        data: (items) {
          if (items.isEmpty) {
            return EmptyState(
              icon: Icons.favorite_border,
              title: 'Your wishlist is empty',
              message: 'Tap the heart on any bike to save it here.',
              actionLabel: 'Browse bikes',
              onAction: () => context.go('/bikes'),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(wishlistProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = items[index];
                return Card(
                  clipBehavior: Clip.antiAlias,
                  child: ListTile(
                    onTap: () => context.push('/bikes/${item.bike.slug}'),
                    leading: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(item.bike.imageUrl, width: 56, height: 56, fit: BoxFit.cover),
                    ),
                    title: Text(item.bike.name),
                    subtitle: Text('${item.bike.brand} · ₹${item.bike.pricePerDay.toStringAsFixed(0)}/day'),
                    trailing: IconButton(
                      icon: const Icon(Icons.favorite),
                      onPressed: () => ref.read(wishlistProvider.notifier).toggle(item.bike.id),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
