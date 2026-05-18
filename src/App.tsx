import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Lazy loading pages to split the large javascript bundle and speed up loading times
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const Plans = lazy(() => import('./pages/Plans'));
const CreateClass = lazy(() => import('./pages/CreateClass'));
const ManagePlans = lazy(() => import('./pages/ManagePlans'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ManageTeachers = lazy(() => import('./pages/ManageTeachers'));
const ClassManagement = lazy(() => import('./pages/ClassManagement'));
const ClassSelection = lazy(() => import('./pages/ClassSelection'));
const StudentHistory = lazy(() => import('./pages/StudentHistory'));
const ManageApprovals = lazy(() => import('./pages/ManageApprovals'));
const CourtBooking = lazy(() => import('./pages/CourtBooking'));
const DayUse = lazy(() => import('./pages/DayUse'));
const ManageLeisure = lazy(() => import('./pages/ManageLeisure'));
const ManageLoyalty = lazy(() => import('./pages/ManageLoyalty'));
const MyLoyalty = lazy(() => import('./pages/MyLoyalty'));
const ScanRedemption = lazy(() => import('./pages/ScanRedemption'));
const CashierPointRedemption = lazy(() => import('./pages/CashierPointRedemption'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const ManageStudents = lazy(() => import('./pages/ManageStudents'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));
const ManageMarketing = lazy(() => import('./pages/ManageMarketing'));
const Ranking = lazy(() => import('./pages/Ranking'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const ScheduleView = lazy(() => import('./pages/ScheduleView'));

import { UnitProvider } from './contexts/UnitContext';

export default function App() {
  return (
    <UnitProvider>
      <Router>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center font-bold text-secondary uppercase animate-pulse">
            Carregando portal PAPEL FUTEVÔLEI...
          </div>
        }>
          <Routes>
            <Route path="/" element={<StudentDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/create-class" element={<CreateClass />} />
            <Route path="/manage-plans" element={<ManagePlans />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/marketing" element={<ManageMarketing />} />
            <Route path="/manage-teachers" element={<ManageTeachers />} />
            <Route path="/class-management/:id" element={<ClassManagement />} />
            <Route path="/book-class" element={<ClassSelection />} />
            <Route path="/student/history" element={<StudentHistory />} />
            <Route path="/admin/approvals" element={<ManageApprovals />} />
            <Route path="/court-booking" element={<CourtBooking />} />
            <Route path="/day-use" element={<DayUse />} />
            <Route path="/admin/leisure" element={<ManageLeisure />} />
            <Route path="/admin/loyalty" element={<ManageLoyalty />} />
            <Route path="/admin/cashier" element={<CashierPointRedemption />} />
            <Route path="/admin/scan-pontos" element={<ScanRedemption />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/students" element={<ManageStudents />} />
            <Route path="/meu-pontos" element={<MyLoyalty />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/manage-marketing" element={<ManageMarketing />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/schedule" element={<ScheduleView />} />
          </Routes>
        </Suspense>
      </Router>
    </UnitProvider>
  );
}
