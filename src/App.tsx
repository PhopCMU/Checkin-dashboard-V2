import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";

import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import SignIn from "./pages/SignIn";
import PrivateRoute from "./components/PrivateRoute";
import Reports from "./pages/Reports";
import Userpermission from "./pages/Userpermission";
import AssignDepartment from "./pages/AssignDepartment";
import NotFound from "./pages/404";
import ImportTime from "./pages/ImportTime";
import Locations from "./pages/Locations";

function App() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        {/* Public Route */}
        <Route path="sign-in" element={<SignIn />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="usepermission" element={<Userpermission />} />
          <Route path="assignDepartment" element={<AssignDepartment />} />
          <Route path="profile" element={<Profile />} />
          {/* <Route path="analytics" element={<Analytics />} /> */}
          <Route path="settings" element={<Settings />} />
          <Route path="import-time" element={<ImportTime />} />
          <Route path="add-location" element={<Locations />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
