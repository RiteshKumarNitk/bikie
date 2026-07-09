import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../bookings/data/booking_model.dart';
import '../../bookings/domain/booking_providers.dart';
import '../data/review_repository.dart';
import '../domain/review_providers.dart';

Future<void> showCreateReviewSheet(BuildContext context, BookingModel booking) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    builder: (context) => CreateReviewSheet(booking: booking),
  );
}

class CreateReviewSheet extends ConsumerStatefulWidget {
  const CreateReviewSheet({super.key, required this.booking});

  final BookingModel booking;

  @override
  ConsumerState<CreateReviewSheet> createState() => _CreateReviewSheetState();
}

class _CreateReviewSheetState extends ConsumerState<CreateReviewSheet> {
  int _rating = 5;
  final _commentController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_commentController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add a comment')));
      return;
    }
    setState(() => _isSubmitting = true);
    try {
      await ref.read(reviewRepositoryProvider).create(
            bikeSlug: widget.booking.bike.slug,
            bookingId: widget.booking.id,
            rating: _rating,
            comment: _commentController.text.trim(),
          );
      ref.invalidate(myBookingsProvider);
      ref.invalidate(bikeReviewsProvider(widget.booking.bike.slug));
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Review submitted — thank you!')));
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Review ${widget.booking.bike.name}', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (index) {
              final starValue = index + 1;
              return IconButton(
                onPressed: () => setState(() => _rating = starValue),
                icon: Icon(
                  starValue <= _rating ? Icons.star : Icons.star_border,
                  color: Theme.of(context).colorScheme.primary,
                ),
              );
            }),
          ),
          TextField(
            controller: _commentController,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Your experience'),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _isSubmitting ? null : _submit,
            child: _isSubmitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Submit review'),
          ),
        ],
      ),
    );
  }
}
