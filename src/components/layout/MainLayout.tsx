import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { MusicPlayer } from "../common/MusicPlayer";
import { useEffect } from "react";

// Các trang không cần Footer (full-screen live room)
const NO_FOOTER_ROUTES = ["/livestream"];

const MainLayout = () => {
  const location = useLocation();
  const isLiveRoom = location.pathname.startsWith('/live/');
  const isProfilePage = location.pathname.startsWith('/profile');
  const hideFooter = NO_FOOTER_ROUTES.includes(location.pathname) || isLiveRoom;
  const hideHeader = isLiveRoom;
  
  // Apply default background for pages except Live Room and Profile
  const needsDefaultBackground = !isLiveRoom && !isProfilePage;

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

  // Scroll-to-top khi chuyển trang
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div className={needsDefaultBackground ? "page-wrapper" : ""}>
      {!hideHeader && <Header />}
      <Outlet />
      {!hideFooter && <Footer />}
      <MusicPlayer />
    </div>
  );
};

export default MainLayout;

