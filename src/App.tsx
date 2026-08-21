import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { StoreProvider } from './store/storeContext';
import { AuthProvider, useAuth } from './store/authContext';
import { CmsProvider } from './store/cmsContext';
import { CommunicationProvider } from './store/communicationContext';
import { LoyaltyProvider } from './store/loyaltyContext';
import { ReportProvider } from './store/reportContext';
import { AnnouncementBar } from './components/layout/AnnouncementBar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MiniCart } from './components/layout/MiniCart';
import { SearchModal } from './components/layout/SearchModal';
import { WhatsAppWidget } from './components/layout/WhatsAppWidget';
import { MobileBottomNavigation } from './components/layout/MobileBottomNavigation';

import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { LookbookPage } from './pages/LookbookPage';
import { AboutPage } from './pages/AboutPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { WishlistPage } from './pages/WishlistPage';
import { SearchPage } from './pages/SearchPage';
import { AccountPage } from './pages/AccountPage';

import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminCollectionsPage } from './pages/admin/AdminCollectionsPage';
import { AdminVariantsPage } from './pages/admin/AdminVariantsPage';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminRolesPage } from './pages/admin/AdminRolesPage';
import { AdminAddressesPage } from './pages/admin/AdminAddressesPage';
import { AdminMarketingCenterPage } from './pages/admin/AdminMarketingCenterPage';
import { AdminMediaLibraryPage } from './pages/admin/AdminMediaLibraryPage';
import { AdminLoyaltyPage } from './pages/admin/AdminLoyaltyPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminAccountingPage } from './pages/admin/AdminAccountingPage';
import { AdminRefundsPage } from './pages/admin/AdminRefundsPage';
import { UnauthorizedPage } from './pages/admin/UnauthorizedPage';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { GoogleCallbackPage } from './pages/auth/GoogleCallbackPage';
import { NotFoundPage } from './pages/NotFoundPage';

// SINGLE SOURCE OF TRUTH: Server-grade permission check for Admin Routes
const canAccessAdminRoute = (user: any): boolean => {
  if (!user) return false;
  if (user.role === 'CLIENT') return false;
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isPrimaryAdmin) return true;
  if (user.role === 'STAFF') {
    return Array.isArray(user.permissions) && user.permissions.length > 0;
  }
  return false;
};

// Route Guard Components
const AdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!canAccessAdminRoute(currentUser)) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  return <>{children}</>;
};

const CustomerRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
};

// Scroll to top component on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export function App() {
  return (
    <AuthProvider>
      <CmsProvider>
        <CommunicationProvider>
          <LoyaltyProvider>
            <StoreProvider>
              <ReportProvider>
                <Router>
                <ScrollToTop />
                <div className="flex flex-col min-h-screen bg-white font-sans text-pros-black antialiased selection:bg-pros-sand selection:text-black">
                  <Routes>
                    {/* Auth & Admin Login Routes */}
                    <Route path="/auth/login" element={<LoginPage />} />
                    <Route path="/auth/register" element={<RegisterPage />} />
                    <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/auth/callback/google" element={<GoogleCallbackPage />} />
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route path="/admin/unauthorized" element={<UnauthorizedPage />} />

                    {/* Protected Admin Modular Routes */}
                    <Route path="/admin" element={<AdminRouteGuard><AdminDashboardPage /></AdminRouteGuard>} />
                    <Route path="/admin/products" element={<AdminRouteGuard><AdminProductsPage /></AdminRouteGuard>} />
                    <Route path="/admin/orders" element={<AdminRouteGuard><AdminOrdersPage /></AdminRouteGuard>} />
                    <Route path="/admin/categories" element={<AdminRouteGuard><AdminCategoriesPage /></AdminRouteGuard>} />
                    <Route path="/admin/collections" element={<AdminRouteGuard><AdminCollectionsPage /></AdminRouteGuard>} />
                    <Route path="/admin/variants" element={<AdminRouteGuard><AdminVariantsPage /></AdminRouteGuard>} />
                    <Route path="/admin/inventory" element={<AdminRouteGuard><AdminInventoryPage /></AdminRouteGuard>} />
                    <Route path="/admin/reviews" element={<AdminRouteGuard><AdminReviewsPage /></AdminRouteGuard>} />
                    <Route path="/admin/coupons" element={<AdminRouteGuard><AdminCouponsPage /></AdminRouteGuard>} />
                    <Route path="/admin/customers" element={<AdminRouteGuard><AdminCustomersPage /></AdminRouteGuard>} />
                    <Route path="/admin/roles" element={<AdminRouteGuard><AdminRolesPage /></AdminRouteGuard>} />
                    <Route path="/admin/addresses" element={<AdminRouteGuard><AdminAddressesPage /></AdminRouteGuard>} />
                    <Route path="/admin/media-library" element={<AdminRouteGuard><AdminMediaLibraryPage /></AdminRouteGuard>} />
                    <Route path="/admin/loyalty" element={<AdminRouteGuard><AdminLoyaltyPage /></AdminRouteGuard>} />
                    <Route path="/admin/marketing" element={<AdminRouteGuard><AdminMarketingCenterPage /></AdminRouteGuard>} />
                    <Route path="/admin/marketing/cms" element={<AdminRouteGuard><AdminMarketingCenterPage /></AdminRouteGuard>} />
                    <Route path="/admin/marketing/homepage" element={<AdminRouteGuard><AdminMarketingCenterPage /></AdminRouteGuard>} />
                    <Route path="/admin/marketing/media" element={<AdminRouteGuard><AdminMarketingCenterPage /></AdminRouteGuard>} />
                    <Route path="/admin/marketing/banners" element={<AdminRouteGuard><AdminMarketingCenterPage /></AdminRouteGuard>} />
                    <Route path="/admin/marketing/communications" element={<AdminRouteGuard><AdminMarketingCenterPage /></AdminRouteGuard>} />
                    <Route path="/admin/marketing/loyalty" element={<AdminRouteGuard><AdminMarketingCenterPage /></AdminRouteGuard>} />
                    <Route path="/admin/marketing/loyalty/members" element={<AdminRouteGuard><AdminMarketingCenterPage /></AdminRouteGuard>} />
                    <Route path="/admin/marketing/loyalty/members/:id" element={<AdminRouteGuard><AdminMarketingCenterPage /></AdminRouteGuard>} />
                    <Route path="/admin/marketing/loyalty/transactions" element={<AdminRouteGuard><AdminMarketingCenterPage /></AdminRouteGuard>} />
                    <Route path="/admin/marketing/loyalty/levels" element={<AdminRouteGuard><AdminMarketingCenterPage /></AdminRouteGuard>} />
                    <Route path="/admin/marketing/loyalty/rewards" element={<AdminRouteGuard><AdminMarketingCenterPage /></AdminRouteGuard>} />
                    <Route path="/admin/marketing/loyalty/rules" element={<AdminRouteGuard><AdminMarketingCenterPage /></AdminRouteGuard>} />
                    <Route path="/admin/marketing/loyalty/campaigns" element={<AdminRouteGuard><AdminMarketingCenterPage /></AdminRouteGuard>} />
                    <Route path="/admin/marketing/loyalty/settings" element={<AdminRouteGuard><AdminMarketingCenterPage /></AdminRouteGuard>} />
                    <Route path="/admin/marketing/loyalty/audit" element={<AdminRouteGuard><AdminMarketingCenterPage /></AdminRouteGuard>} />
                <Route path="/admin/analytics" element={<AdminRouteGuard><AdminAnalyticsPage /></AdminRouteGuard>} />
                <Route path="/admin/reports" element={<AdminRouteGuard><AdminAnalyticsPage /></AdminRouteGuard>} />
                <Route path="/admin/statistics" element={<AdminRouteGuard><AdminAnalyticsPage /></AdminRouteGuard>} />
                <Route path="/admin/accounting" element={<AdminRouteGuard><AdminAccountingPage /></AdminRouteGuard>} />
                <Route path="/admin/refunds" element={<AdminRouteGuard><AdminRefundsPage /></AdminRouteGuard>} />
                <Route path="/admin/settings" element={<AdminRouteGuard><AdminSettingsPage /></AdminRouteGuard>} />
                <Route path="/admin/settings/payments" element={<AdminRouteGuard><AdminSettingsPage /></AdminRouteGuard>} />
                <Route path="/admin/settings/shipping" element={<AdminRouteGuard><AdminSettingsPage /></AdminRouteGuard>} />
                <Route path="/admin/settings/taxes" element={<AdminRouteGuard><AdminSettingsPage /></AdminRouteGuard>} />
                <Route path="/admin/settings/notifications" element={<AdminRouteGuard><AdminSettingsPage /></AdminRouteGuard>} />
                <Route path="/admin/settings/logs" element={<AdminRouteGuard><AdminSettingsPage /></AdminRouteGuard>} />

                {/* Storefront Routes */}
                <Route
                  path="*"
                  element={
                    <>
                      <AnnouncementBar />
                      <Header />
                      <div className="flex-1">
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/shop" element={<ShopPage />} />
                          <Route path="/search" element={<SearchPage />} />
                          <Route path="/product/:slug" element={<ProductDetailPage />} />
                          <Route path="/collections" element={<CollectionsPage />} />
                          <Route path="/lookbook" element={<LookbookPage />} />
                          <Route path="/about" element={<AboutPage />} />
                          <Route path="/cart" element={<CartPage />} />
                          <Route path="/checkout" element={<CheckoutPage />} />
                          <Route path="/order-tracking" element={<OrderTrackingPage />} />
                          <Route path="/wishlist" element={<WishlistPage />} />
                          <Route path="/account" element={<CustomerRouteGuard><AccountPage /></CustomerRouteGuard>} />
                          <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                      </div>
                      <Footer />
                      <MiniCart />
                      <SearchModal />
                      <WhatsAppWidget />
                      <MobileBottomNavigation />
                    </>
                  }
                />
              </Routes>
            </div>
          </Router>
        </ReportProvider>
        </StoreProvider>
        </LoyaltyProvider>
      </CommunicationProvider>
    </CmsProvider>
  </AuthProvider>
  );
}

export default App;
