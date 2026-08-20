import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/app_toast.dart';
import '../../bikes/data/bike_models.dart';
import '../domain/booking_calculator.dart';
import '../domain/booking_providers.dart';

Future<void> showCreateBookingSheet(BuildContext context, BikeDetail bike) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    builder: (context) => CreateBookingSheet(bike: bike),
  );
}

class CreateBookingSheet extends ConsumerStatefulWidget {
  const CreateBookingSheet({super.key, required this.bike});

  final BikeDetail bike;

  @override
  ConsumerState<CreateBookingSheet> createState() => _CreateBookingSheetState();
}

class _CreateBookingSheetState extends ConsumerState<CreateBookingSheet> {
  DateTimeRange? _range;
  final _cityController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _cityController.text = widget.bike.city;
  }

  @override
  void dispose() {
    _cityController.dispose();
    super.dispose();
  }

  num get _totalPrice {
    if (_range == null) return 0;
    return calculateBookingTotal(
      start: _range!.start,
      end: _range!.end,
      pricePerDay: widget.bike.pricePerDay,
    );
  }

  Future<void> _pickDateRange() async {
    final now = DateTime.now();
    final range = await showDateRangePicker(
      context: context,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
      initialDateRange: _range,
    );
    if (range != null) setState(() => _range = range);
  }

  Future<void> _submit() async {
    if (_range == null) {
      showAppToast(context, 'Pick your travel dates', variant: AppToastVariant.warning);
      return;
    }
    if (_cityController.text.trim().isEmpty) {
      showAppToast(context, 'Pickup city is required', variant: AppToastVariant.warning);
      return;
    }
    setState(() => _isSubmitting = true);
    try {
      final booking = await ref.read(myBookingsProvider.notifier).create(
            bikeId: widget.bike.id,
            startDate: _range!.start,
            endDate: _range!.end,
            pickupCity: _cityController.text.trim(),
          );
      if (mounted) {
        Navigator.of(context).pop();
        context.push('/bookings');
        showAppToast(
          context,
          'Request submitted successfully — booking ${booking.status.toLowerCase()}',
          variant: AppToastVariant.success,
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        showAppToast(context, e.message, variant: AppToastVariant.error);
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
          Text('Book ${widget.bike.name}', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: _pickDateRange,
            icon: const Icon(Icons.calendar_today_outlined),
            label: Text(
              _range == null
                  ? 'Select pickup & return dates'
                  : '${_range!.start.toLocal().toString().split(' ').first} → ${_range!.end.toLocal().toString().split(' ').first}',
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _cityController,
            decoration: const InputDecoration(labelText: 'Pickup city'),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Text('Total', style: Theme.of(context).textTheme.bodyMedium),
              const Spacer(),
              Text('₹${_totalPrice.toStringAsFixed(0)}', style: Theme.of(context).textTheme.titleLarge),
            ],
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
                : Text(widget.bike.instantBooking ? 'Confirm booking' : 'Request booking'),
          ),
        ],
      ),
    );
  }
}
