// import { Routes, Route } from 'react-router';
// import { Suspense, lazy } from 'react';
// import { Layout } from './components/layout/Layout';
// import { Spinner } from './components/ui/Spinner';

// const HomePage = lazy(() => import('./pages/HomePage'));
// const LoginPage = lazy(() => import('./pages/LoginPage'));
// const LobbyPage = lazy(() => import('./pages/LobbyPage'));
// const RoomPage = lazy(() => import('./pages/RoomPage'));
// const GamePage = lazy(() => import('./pages/GamePage'));

// export default function App() {
//   return (
//     <Routes>
//       <Route element={<Layout />}>
//         <Route path="/" element={
//           <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>}>
//             <HomePage />
//           </Suspense>
//         } />
//         <Route path="/login" element={
//           <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>}>
//             <LoginPage />
//           </Suspense>
//         } />
//         <Route path="/lobby" element={
//           <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>}>
//             <LobbyPage />
//           </Suspense>
//         } />
//         <Route path="/room/:code" element={
//           <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>}>
//             <RoomPage />
//           </Suspense>
//         } />
//         <Route path="/game/:roomId" element={
//           <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>}>
//             <GamePage />
//           </Suspense>
//         } />
//       </Route>
//     </Routes>
//   );
// }

import { Routes, Route } from "react-router";
import { Layout } from "./components/layout/Layout";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <div
              style={{
                color: "white",
                fontSize: 40,
                padding: 50,
              }}
            >
              HOME ROUTE WORKS ✅
            </div>
          }
        />
      </Route>
    </Routes>
  );
}