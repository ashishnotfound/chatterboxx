import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthProvider";
import { CallProvider } from "@/contexts/CallProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CapacitorErrorBoundary } from "@/components/error/CapacitorErrorBoundary";
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { BackButtonHandler } from "@/components/navigation/BackButtonHandler";
import { isCapacitorNative } from "@/utils/capacitor";
import { CallUI } from "@/components/call/CallUI";
import HomePage from "./pages/HomePage";
import MoodPage from "./pages/MoodPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import ProPage from "./pages/ProPage";
import SettingsPage from "./pages/SettingsPage";
import FriendsPage from "./pages/FriendsPage";
import CustomizePage from "./pages/CustomizePage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import NotificationsPage from "./pages/settings/NotificationsPage";
import AppearancePage from "./pages/settings/AppearancePage";
import LanguagePage from "./pages/settings/LanguagePage";
import PrivacyPage from "./pages/settings/PrivacyPage";
import HelpPage from "./pages/settings/HelpPage";
import TermsPage from "./pages/settings/TermsPage";
import DeleteAccountPage from "./pages/settings/DeleteAccountPage";
import BlockedUsersPage from "./pages/settings/BlockedUsersPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status?: number }).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});

const Router = isCapacitorNative() ? HashRouter : BrowserRouter;

import { LanguageSync } from "@/components/common/LanguageSync";
import { NotificationSync } from "@/components/common/NotificationSync";

const App = () => (
  <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <CapacitorErrorBoundary>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CallProvider>
              <LanguageSync />
              <NotificationSync />
              <ThemeProvider>
                <TooltipProvider>
                  <CallUI />
                  <NetworkStatus />
                  <BackButtonHandler>
                    <Toaster />
                    <Sonner position="top-center" />
                    <ErrorBoundary>
                      <Routes>
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                        <Route path="/status" element={<ProtectedRoute><MoodPage /></ProtectedRoute>} />
                        <Route path="/chat" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                        <Route path="/chat/:chatId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                        <Route path="/profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
                        <Route path="/pro" element={<ProtectedRoute><ProPage /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                        <Route path="/settings/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                        <Route path="/settings/appearance" element={<ProtectedRoute><AppearancePage /></ProtectedRoute>} />
                        <Route path="/settings/language" element={<ProtectedRoute><LanguagePage /></ProtectedRoute>} />
                        <Route path="/settings/privacy" element={<ProtectedRoute><PrivacyPage /></ProtectedRoute>} />
                        <Route path="/settings/privacy/blocked" element={<ProtectedRoute><BlockedUsersPage /></ProtectedRoute>} />
                        <Route path="/settings/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
                        <Route path="/settings/terms" element={<ProtectedRoute><TermsPage /></ProtectedRoute>} />
                        <Route path="/settings/delete-account" element={<ProtectedRoute><DeleteAccountPage /></ProtectedRoute>} />
                        <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
                        <Route path="/customize" element={<ProtectedRoute><CustomizePage /></ProtectedRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </ErrorBoundary>
                  </BackButtonHandler>
                </TooltipProvider>
              </ThemeProvider>
            </CallProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </CapacitorErrorBoundary>
  </Router>
);

export default App;
