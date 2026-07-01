import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CursoIA from "./CursoIA.jsx";

createRoot(document.getElementById("curso-ia-root")).render(
  <StrictMode>
    <CursoIA />
  </StrictMode>,
);
