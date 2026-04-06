import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/main-layout";
import LandingPage from "./pages/landing-page/landing-page";
import Login from "./pages/login/login";
import Register from "./pages/register/register";
import AccountLayout from "./pages/account/account-layout";
import ProfileInfo from "./pages/account/profile-info";
import ChangeEmail from "./pages/account/change-email";
import ChangePassword from "./pages/account/change-password";
import PaketWisataPage from "./pages/paket-wisata/paket-wisata";
import PaketDetailPage from "./pages/paket-detail/paket-detail";
import PenginapanPage from "./pages/penginapan/penginapan";
import WishlistPage from "./pages/wishlist/wishlist";
import RiwayatPesananPage from "./pages/riwayat-pesanan/riwayat-pesanan";
import PaymentPage from "./pages/payment/payment";
import TicketPage from "./pages/ticket/ticket";

import { AuthProvider } from "./contexts/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* pages WITH navbar+footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/paket" element={<PaketWisataPage />} />
            <Route path="/paket-wisata/:id" element={<PaketDetailPage />} />
            <Route path="/penginapan" element={<PenginapanPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/riwayat-pesanan" element={<RiwayatPesananPage />} />


            <Route path="/account" element={<AccountLayout />}>
              <Route index element={<ProfileInfo />} />
              <Route path="email" element={<ChangeEmail />} />
              <Route path="password" element={<ChangePassword />} />
            </Route>
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Standalone payment page — no navbar/footer */}
          <Route path="/payment/:booking_code" element={<PaymentPage />} />
          {/* Standalone ticket/receipt page — no navbar/footer */}
          <Route path="/ticket/:booking_code" element={<TicketPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
