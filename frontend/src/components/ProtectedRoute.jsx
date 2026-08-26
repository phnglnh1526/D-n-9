import {
  Navigate,
  useLocation,
} from "react-router";


function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = sessionStorage.getItem(
    "access_token"
  );

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}


export default ProtectedRoute;
