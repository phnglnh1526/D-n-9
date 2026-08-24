import { Navigate } from "react-router";


function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem(
    "access_token"
  );

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}


export default ProtectedRoute;