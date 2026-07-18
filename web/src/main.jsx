import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/ko" replace />} />
      <Route path="/:lang" element={<App />} />
      <Route path="*" element={<Navigate to="/ko" replace />} />
    </Routes>
  </BrowserRouter>
);
