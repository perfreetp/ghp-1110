import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BottomTabBar from '@/components/layout/BottomTabBar';
import TasksPage from '@/pages/tasks/TasksPage';
import MapPage from '@/pages/map/MapPage';
import FacilitiesPage from '@/pages/facilities/FacilitiesPage';
import FacilityDetailPage from '@/pages/facilities/FacilityDetailPage';
import ReportPage from '@/pages/report/ReportPage';
import RectificationPage from '@/pages/rectification/RectificationPage';
import MessagesPage from '@/pages/messages/MessagesPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import ScanPage from '@/pages/common/ScanPage';
import HelpPage from '@/pages/common/HelpPage';
import { useMemo } from 'react';

const tabRoutes = ['/', '/map', '/facilities', '/report', '/rectification', '/messages', '/profile'];

function AnimatedRoutes() {
  const location = useLocation();
  const showTabBar = useMemo(() => tabRoutes.includes(location.pathname), [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="pb-24"
              >
                <TasksPage />
              </motion.div>
            }
          />
          <Route
            path="/map"
            element={
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
              >
                <MapPage />
              </motion.div>
            }
          />
          <Route
            path="/facilities"
            element={
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="pb-24"
              >
                <FacilitiesPage />
              </motion.div>
            }
          />
          <Route
            path="/facilities/:id"
            element={
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="pb-6"
              >
                <FacilityDetailPage />
              </motion.div>
            }
          />
          <Route
            path="/report"
            element={
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="pb-24"
              >
                <ReportPage />
              </motion.div>
            }
          />
          <Route
            path="/rectification"
            element={
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="pb-24"
              >
                <RectificationPage />
              </motion.div>
            }
          />
          <Route
            path="/messages"
            element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
                className="pb-24"
              >
                <MessagesPage />
              </motion.div>
            }
          />
          <Route
            path="/profile"
            element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.25 }}
                className="pb-32"
              >
                <ProfilePage />
              </motion.div>
            }
          />
          <Route
            path="/scan"
            element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ScanPage />
              </motion.div>
            }
          />
          <Route
            path="/help"
            element={
              <motion.div
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="pb-24"
              >
                <HelpPage />
              </motion.div>
            }
          />
        </Routes>
      </AnimatePresence>
      {showTabBar && <BottomTabBar />}
    </div>
  );
}

export default AnimatedRoutes;
