import { useLocation } from "react-router-dom";
import Header from "./Header";

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  if (pathname.startsWith("/admin")) return <>{children}</>;

  return (
    <div className="app-layout">
      <Header />
      <div className="app-main">
        {children}
      </div>
    </div>
  );
}

export default Layout;