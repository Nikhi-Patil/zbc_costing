import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "bootstrap/dist/css/bootstrap.min.css";
import "admin-lte/dist/css/adminlte.min.css";
import "tabulator-tables/dist/css/tabulator.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "tom-select/dist/css/tom-select.css";

import App from "./App";
import "./index.css";
import "./pages/Login.css";
import "./assets/css/masterTable.css";


ReactDOM.createRoot(document.getElementById("root")).render(
     <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);