import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import NoteEditorPage from './pages/NoteEditorPage';
import Search from './pages/Search';
import Trash from './pages/Trash';
import Settings from './pages/Settings';
import AdminUsers from './pages/AdminUsers';
import Friends from './pages/Friends';
import Groups from './pages/Groups';
import SharedFiles from './pages/SharedFiles';
import AdminCollaboration from './pages/AdminCollaboration';
import NotFound from './pages/NotFound';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/common/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="library" element={<Library preset="all" />} />
        <Route path="notes" element={<Library preset="notes" />} />
        <Route path="notes/:id" element={<NoteEditorPage />} />
        <Route path="images" element={<Library preset="images" />} />
        <Route path="videos" element={<Library preset="videos" />} />
        <Route path="files" element={<Library preset="files" />} />
        <Route path="urls" element={<Library preset="urls" />} />
        <Route path="favorites" element={<Library preset="favorites" />} />
        <Route path="folder/:folderId" element={<Library preset="folder" />} />
        <Route path="search" element={<Search />} />
        <Route path="trash" element={<Trash />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin/users" element={<AdminUsers />} />
        <Route path="friends" element={<Friends />} />
        <Route path="groups" element={<Groups />} />
        <Route path="shared" element={<SharedFiles />} />
        <Route path="admin/collaboration" element={<AdminCollaboration />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
