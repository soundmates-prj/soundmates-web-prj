import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { MusicPlayer } from "../common/MusicPlayer";

const MainLayout = () => {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
      <MusicPlayer />
    </>
  );
};

export default MainLayout;
