import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { MusicPlayer } from "../common/MusicPlayer";
import { useEffect } from "react";

// Các trang không cần Footer (full-screen live room)
const NO_FOOTER_ROUTES = ["/livestream"];

const MainLayout = () => {
  const location = useLocation();
  const hideFooter = NO_FOOTER_ROUTES.includes(location.pathname) || location.pathname.startsWith('/live/');

  // Lock window scroll trên các trang full-screen
  useEffect(() => {
    if (hideFooter) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [hideFooter]);

  return (
    <>
      <Header />
      <Outlet />
      {!hideFooter && <Footer />}
      <MusicPlayer />
    </>
  );
};

export default MainLayout;

