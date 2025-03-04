import { BrowserRouter as Router, Routes, Route, BrowserRouter } from "react-router-dom";
import React from "react";
import './App.css';
import Accueil from "./pages/accueil/accueil";
import FormEditor2 from "./pages/form_editorr/form_editorr";
import FormViewer from "./pages/form_viewer/form_viewer";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route index element={<Accueil/>}></Route>
          <Route path="/accueil" element={<Accueil/>}></Route>
          <Route path="/form-editor2" element={<FormEditor2 />} />
          <Route path="/form-viewer/:id" element={<FormViewer />} />
          <Route path="/form-viewer/:id/:id_participant" element={<FormViewer />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;