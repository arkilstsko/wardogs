import { createRoot } from "react-dom/client";
import { App, ErrorBoundary } from "./v1/App";
import "./style.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
