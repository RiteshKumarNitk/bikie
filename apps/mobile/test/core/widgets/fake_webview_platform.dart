import 'package:flutter/widgets.dart';
import 'package:webview_flutter_platform_interface/webview_flutter_platform_interface.dart';

/// Minimal `WebViewPlatform` test double — `webview_flutter`'s own platform interface docs
/// explicitly call this the supported way to unit-test a screen that embeds a `WebViewWidget`
/// ("For unit testing, `WebViewPlatform.instance` can be set with your own test implementation"
/// — see `PlatformWebViewWidget`'s doc comment). Every method not overridden here already has a
/// safe `UnimplementedError` default in the base classes; only what `InAppPaymentWebViewScreen`
/// actually calls (`setJavaScriptMode`, `setPlatformNavigationDelegate`, `loadRequest`, `reload`,
/// and the `NavigationDelegate` callback setters) needs a real override, and those overrides just
/// no-op — this fake never simulates an actual page load, it only exists so the screen can mount
/// without a real platform view.
class FakeWebViewPlatform extends WebViewPlatform {
  final List<String> loadedUrls = [];

  @override
  PlatformWebViewController createPlatformWebViewController(PlatformWebViewControllerCreationParams params) {
    return _FakeWebViewController(params, this);
  }

  @override
  PlatformNavigationDelegate createPlatformNavigationDelegate(PlatformNavigationDelegateCreationParams params) {
    return _FakeNavigationDelegate(params);
  }

  @override
  PlatformWebViewWidget createPlatformWebViewWidget(PlatformWebViewWidgetCreationParams params) {
    return _FakeWebViewWidget(params);
  }
}

class _FakeWebViewController extends PlatformWebViewController {
  _FakeWebViewController(super.params, this._platform) : super.implementation();

  final FakeWebViewPlatform _platform;

  @override
  Future<void> setJavaScriptMode(JavaScriptMode javaScriptMode) async {}

  @override
  Future<void> setPlatformNavigationDelegate(PlatformNavigationDelegate handler) async {}

  @override
  Future<void> loadRequest(LoadRequestParams params) async {
    _platform.loadedUrls.add(params.uri.toString());
  }

  @override
  Future<void> reload() async {}
}

class _FakeNavigationDelegate extends PlatformNavigationDelegate {
  _FakeNavigationDelegate(super.params) : super.implementation();

  @override
  Future<void> setOnPageStarted(PageEventCallback onPageStarted) async {}

  @override
  Future<void> setOnPageFinished(PageEventCallback onPageFinished) async {}

  @override
  Future<void> setOnWebResourceError(WebResourceErrorCallback onWebResourceError) async {}

  @override
  Future<void> setOnNavigationRequest(NavigationRequestCallback onNavigationRequest) async {}
}

class _FakeWebViewWidget extends PlatformWebViewWidget {
  _FakeWebViewWidget(super.params) : super.implementation();

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}
