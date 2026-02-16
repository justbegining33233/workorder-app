// import { ErrorBoundary } from "../components/ErrorBoundary";
// import ServiceWorkerRegister from "../components/ServiceWorkerRegister";
// import { AuthProvider } from "../contexts/AuthContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    // <AuthProvider>
      {children}
    // </AuthProvider>
  );
}
