import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/async_value_view.dart';
import '../../../core/widgets/empty_state.dart';
import '../../reviews/presentation/create_review_sheet.dart';
import '../data/booking_model.dart';
import '../domain/booking_providers.dart';

const _statusColors = {
  'PENDING': Colors.amber,
  'CONFIRMED': Colors.lightBlue,
  'ACTIVE': Colors.green,
  'COMPLETED': Colors.grey,
  'CANCELLED': Colors.redAccent,
};

class BookingsScreen extends ConsumerWidget {
  const BookingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookings = ref.watch(myBookingsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Bookings')),
      body: AsyncValueView(
        value: bookings,
        onRetry: () => ref.invalidate(myBookingsProvider),
        data: (list) {
          if (list.isEmpty) {
            return EmptyState(
              icon: Icons.event_note_outlined,
              title: 'No bookings yet',
              message: 'Browse bikes and book your first ride.',
              actionLabel: 'Browse bikes',
              onAction: () => context.go('/bikes'),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myBookingsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) => _BookingCard(booking: list[index]),
            ),
          );
        },
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  const _BookingCard({required this.booking});

  final BookingModel booking;

  @override
  Widget build(BuildContext context) {
    final canReview = booking.status == 'COMPLETED' && !booking.hasReview;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(booking.bike.imageUrl, width: 72, height: 72, fit: BoxFit.cover),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(booking.bike.name, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 4),
                  Text(
                    '${booking.startDate.split('T').first} → ${booking.endDate.split('T').first}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  Text(booking.pickupCity, style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: (_statusColors[booking.status] ?? Colors.grey).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          booking.status,
                          style: TextStyle(
                            color: _statusColors[booking.status] ?? Colors.grey,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ),
                      const Spacer(),
                      Text('₹${booking.totalPrice.toStringAsFixed(0)}', style: Theme.of(context).textTheme.titleSmall),
                    ],
                  ),
                  if (canReview) ...[
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: OutlinedButton(
                        onPressed: () => showCreateReviewSheet(context, booking),
                        child: const Text('Leave a review'),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
